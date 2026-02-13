import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role - only vendedor or admin
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const allowedRoles = ["vendedor", "administrador", "raiz", "admin_global", "admin_empresa", "gerente"];
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      return new Response(JSON.stringify({ success: false, error: "Sem permissão para enviar propostas" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { proposalId } = await req.json();
    if (!proposalId) {
      return new Response(JSON.stringify({ success: false, error: "proposalId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch proposal with client and bank
    const { data: proposal, error: propError } = await supabaseAdmin
      .from("proposals")
      .select("*, clients(*), banks(*)")
      .eq("id", proposalId)
      .single();

    if (propError || !proposal) {
      return new Response(JSON.stringify({ success: false, error: "Proposta não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate bank is Facta
    if (!proposal.banks?.name?.toLowerCase().includes("facta")) {
      return new Response(JSON.stringify({ success: false, error: "Banco não é Facta" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build payload based on modality
    const client = proposal.clients;
    const basePayload: Record<string, any> = {
      cpf: client.cpf,
      nome: client.full_name,
      data_nascimento: client.birth_date,
      telefone: client.phone,
      valor_solicitado: proposal.requested_value,
      prazo: proposal.term_months,
      taxa: proposal.interest_rate,
      convenio: proposal.covenant,
    };

    let endpoint = "/api/proposta";
    switch (proposal.modality) {
      case "margem_livre":
        basePayload.tipo = "MARGEM";
        break;
      case "fgts_antecipacao":
        basePayload.tipo = "FGTS";
        break;
      case "portabilidade":
        basePayload.tipo = "PORTABILIDADE";
        break;
      case "port_refinanciamento":
        basePayload.tipo = "PORT_REFIN";
        break;
      case "cartao_consignado":
        basePayload.tipo = "CARTAO_RMC";
        break;
      case "credito_trabalhador":
        basePayload.tipo = "CREDITO_TRABALHADOR";
        break;
      default:
        basePayload.tipo = "MARGEM";
    }

    // Add bank account info
    if (proposal.bank_agency) basePayload.agencia = proposal.bank_agency;
    if (proposal.bank_account) basePayload.conta = proposal.bank_account;
    if (proposal.bank_account_type) basePayload.tipo_conta = proposal.bank_account_type;
    if (proposal.pix_key) basePayload.chave_pix = proposal.pix_key;

    // Save payload
    await supabaseAdmin.from("proposals")
      .update({ payload_enviado: basePayload })
      .eq("id", proposalId);

    // Make request to Facta API
    const FACTA_API_KEY = Deno.env.get("FACTA_API_KEY");
    const baseUrl = proposal.banks.base_url || "https://webapi.facta.com.br";

    let factaResponse: Response;
    let responseData: any;
    let success = false;

    try {
      factaResponse = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${FACTA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(basePayload),
      });

      responseData = await factaResponse.json().catch(() => ({ raw: await factaResponse.text() }));
      success = factaResponse.ok;
    } catch (fetchError) {
      responseData = { error: fetchError instanceof Error ? fetchError.message : "Network error" };
      success = false;
    }

    if (success) {
      const protocolo = responseData?.protocolo || responseData?.numero_proposta || responseData?.id || null;
      await supabaseAdmin.from("proposals")
        .update({
          protocolo_banco: protocolo?.toString() || null,
          bank_status: "em_analise",
          resposta_banco: responseData,
          erro_banco: null,
        })
        .eq("id", proposalId);

      // Log
      await supabaseAdmin.from("integration_logs").insert({
        company_id: proposal.company_id,
        provider: "facta",
        operation: "enviar_proposta",
        status_code: factaResponse!.status,
        request_data: basePayload,
        response_data: responseData,
      });

      return new Response(JSON.stringify({ success: true, protocolo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const errorMsg = responseData?.message || responseData?.error || JSON.stringify(responseData);
      await supabaseAdmin.from("proposals")
        .update({
          bank_status: "nao_enviado",
          resposta_banco: responseData,
          erro_banco: errorMsg,
        })
        .eq("id", proposalId);

      await supabaseAdmin.from("integration_logs").insert({
        company_id: proposal.company_id,
        provider: "facta",
        operation: "enviar_proposta",
        status_code: factaResponse?.status || 0,
        request_data: basePayload,
        response_data: responseData,
        error_message: errorMsg,
      });

      return new Response(JSON.stringify({ success: false, error: errorMsg }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
