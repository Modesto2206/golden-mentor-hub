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

    const { proposalId } = await req.json();
    if (!proposalId) {
      return new Response(JSON.stringify({ error: "proposalId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select("*, banks(base_url, code)")
      .eq("id", proposalId)
      .maybeSingle();

    if (error || !proposal || !proposal.protocolo_banco) {
      return new Response(JSON.stringify({ error: "Proposta sem protocolo Facta" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = proposal.banks?.base_url || "https://webapi.facta.com.br";

    const factaResponse = await fetch(
      `${baseUrl}/v2/propostas/${proposal.protocolo_banco}/status`,
      {
        headers: {
          Authorization: `Basic ${FACTA_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const factaData = await factaResponse.json();

    if (factaResponse.ok) {
      const statusMap: Record<string, string> = {
        ANALISE: "em_analise",
        APROVADO: "aprovado",
        REPROVADO: "reprovado",
        PENDENTE_DOCUMENTOS: "pendente_documentos",
        PENDENTE_ASSINATURA: "pendente_assinatura",
        PAGO: "pago",
      };

      const newBankStatus = statusMap[factaData.status] || proposal.bank_status;

      await supabase
        .from("proposals")
        .update({
          bank_status: newBankStatus,
          resposta_banco: factaData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      return new Response(
        JSON.stringify({ success: true, status: newBankStatus, data: factaData }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: factaData }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: unknown) {
    console.error("Erro sincronizar-status-facta:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
