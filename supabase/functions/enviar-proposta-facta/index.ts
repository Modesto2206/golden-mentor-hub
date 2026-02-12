import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FACTA_API_KEY = Deno.env.get("FACTA_API_KEY");
    if (!FACTA_API_KEY) {
      throw new Error("FACTA_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const allowedRoles = ["vendedor", "administrador", "raiz", "admin_global", "admin_empresa", "gerente", "operacoes"];
    if (!roleData || !allowedRoles.includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Sem permissão para enviar propostas" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { proposalId } = await req.json();
    if (!proposalId) {
      return new Response(JSON.stringify({ error: "proposalId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch proposal with client and bank
    const { data: proposal, error: propError } = await supabase
      .from("proposals")
      .select("*, clients(full_name, cpf, birth_date, phone, email), banks(name, code, possui_api, base_url)")
      .eq("id", proposalId)
      .maybeSingle();

    if (propError || !proposal) {
      throw new Error("Proposta não encontrada");
    }

    if (proposal.banks?.code !== "FACTA" || !proposal.banks?.possui_api) {
      return new Response(JSON.stringify({ error: "Esta proposta não é do banco Facta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build payload based on modality
    const payload = buildFactaPayload(proposal);

    const baseUrl = proposal.banks.base_url || "https://webapi.facta.com.br";

    // Send to Facta API
    const factaResponse = await fetch(`${baseUrl}/v2/propostas`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${FACTA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const factaData = await factaResponse.json();

    if (factaResponse.ok && factaData.protocolo) {
      // Success
      await supabase
        .from("proposals")
        .update({
          protocolo_banco: factaData.protocolo,
          bank_status: "em_analise",
          payload_enviado: payload,
          resposta_banco: factaData,
          erro_banco: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "enviar_proposta_facta",
        resource: "proposals",
        resource_id: proposalId,
        company_id: proposal.company_id,
        new_data: { protocolo: factaData.protocolo, status: "em_analise" },
      });

      return new Response(
        JSON.stringify({
          success: true,
          protocolo: factaData.protocolo,
          data: factaData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Error
      const errorMsg = factaData.mensagem || factaData.error || JSON.stringify(factaData);

      await supabase
        .from("proposals")
        .update({
          bank_status: "nao_enviado",
          payload_enviado: payload,
          resposta_banco: factaData,
          erro_banco: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "erro_envio_facta",
        resource: "proposals",
        resource_id: proposalId,
        company_id: proposal.company_id,
        new_data: { error: errorMsg },
      });

      return new Response(
        JSON.stringify({ success: false, error: errorMsg, data: factaData }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: unknown) {
    console.error("Erro enviar-proposta-facta:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildFactaPayload(proposal: any) {
  const client = proposal.clients;
  const base = {
    cpf: client?.cpf?.replace(/\D/g, ""),
    nome: client?.full_name,
    data_nascimento: client?.birth_date,
    telefone: client?.phone,
    email: client?.email,
    valor_solicitado: proposal.requested_value,
    prazo: proposal.term_months,
    taxa: proposal.interest_rate,
    banco_conta: proposal.bank_account,
    banco_agencia: proposal.bank_agency,
    tipo_conta: proposal.bank_account_type,
    pix: proposal.pix_key,
  };

  const modality = proposal.modality;

  switch (modality) {
    case "margem_livre":
      return {
        ...base,
        tipo_operacao: "MARGEM_LIVRE",
        convenio: proposal.covenant,
      };

    case "fgts_antecipacao":
      return {
        ...base,
        tipo_operacao: "FGTS",
      };

    case "portabilidade":
      return {
        ...base,
        tipo_operacao: "PORTABILIDADE",
        convenio: proposal.covenant,
        banco_origem: null, // Will be filled from portability_contracts
      };

    case "port_refinanciamento":
      return {
        ...base,
        tipo_operacao: "PORT_REFIN",
        convenio: proposal.covenant,
      };

    case "cartao_consignado":
      return {
        ...base,
        tipo_operacao: "CARTAO_RMC",
        convenio: proposal.covenant,
      };

    case "credito_trabalhador":
      return {
        ...base,
        tipo_operacao: "CREDITO_TRABALHADOR",
      };

    default:
      return {
        ...base,
        tipo_operacao: modality?.toUpperCase() || "MARGEM_LIVRE",
        convenio: proposal.covenant,
      };
  }
}
