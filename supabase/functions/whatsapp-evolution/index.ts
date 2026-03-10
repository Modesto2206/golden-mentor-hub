import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get user's company
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", userId)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ success: false, error: "Empresa não encontrada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = profile.company_id;
    const body = await req.json();
    const { action, api_url, api_key, phone, message_text, client_id, client_name } = body;

    // Get or create session
    let { data: session } = await supabaseAdmin
      .from("whatsapp_sessions")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    // For actions that need Evolution API
    const getApiConfig = () => {
      const url = api_url || session?.api_url;
      const key = api_key || session?.api_key;
      if (!url || !key) {
        throw new Error("Configure a URL e API Key da Evolution API primeiro.");
      }
      return { url: url.replace(/\/$/, ""), key };
    };

    const instanceName = `credmais_${companyId.replace(/-/g, "").slice(0, 12)}`;

    switch (action) {
      case "save-config": {
        if (!api_url || !api_key) {
          return new Response(JSON.stringify({ success: false, error: "URL e API Key são obrigatórios" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Test connection
        try {
          const testRes = await fetch(`${api_url.replace(/\/$/, "")}/instance/fetchInstances`, {
            headers: { apikey: api_key },
          });
          if (!testRes.ok) throw new Error(`Status ${testRes.status}`);
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: `Não foi possível conectar: ${e.message}` }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Upsert session with config
        const { error } = await supabaseAdmin
          .from("whatsapp_sessions")
          .upsert({
            company_id: companyId,
            api_url,
            api_key,
            instance_name: instanceName,
            status: "disconnected",
          }, { onConflict: "company_id" });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, message: "Configuração salva com sucesso" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create-instance": {
        const { url, key } = getApiConfig();

        // Create instance in Evolution API
        const createRes = await fetch(`${url}/instance/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: key },
          body: JSON.stringify({
            instanceName,
            integration: "WHATSAPP-BAILEYS",
            qrcode: true,
            reject_call: false,
            always_online: true,
            webhook: {
              url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook?company_id=${companyId}`,
              webhook_by_events: false,
              events: [
                "MESSAGES_UPSERT",
                "CONNECTION_UPDATE",
                "QRCODE_UPDATED",
              ],
            },
          }),
        });

        const createData = await createRes.json();

        if (!createRes.ok) {
          // Instance may already exist, try to connect
          if (createData?.response?.message?.includes("already") || createRes.status === 403) {
            // Try to get QR code from existing instance
            const connectRes = await fetch(`${url}/instance/connect/${instanceName}`, {
              headers: { apikey: key },
            });
            const connectData = await connectRes.json();

            await supabaseAdmin
              .from("whatsapp_sessions")
              .update({
                status: "connecting",
                qr_code: connectData?.base64 || connectData?.qrcode?.base64 || null,
                instance_name: instanceName,
              })
              .eq("company_id", companyId);

            return new Response(JSON.stringify({
              success: true,
              qr_code: connectData?.base64 || connectData?.qrcode?.base64 || null,
              status: "connecting",
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ success: false, error: `Erro ao criar instância: ${JSON.stringify(createData)}` }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const qrCode = createData?.qrcode?.base64 || createData?.base64 || null;

        await supabaseAdmin
          .from("whatsapp_sessions")
          .update({
            status: "connecting",
            qr_code: qrCode,
            instance_name: instanceName,
          })
          .eq("company_id", companyId);

        return new Response(JSON.stringify({
          success: true,
          qr_code: qrCode,
          status: "connecting",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get-qrcode": {
        const { url, key } = getApiConfig();
        const name = session?.instance_name || instanceName;

        const res = await fetch(`${url}/instance/connect/${name}`, {
          headers: { apikey: key },
        });
        const data = await res.json();

        const qrCode = data?.base64 || data?.qrcode?.base64 || null;

        if (qrCode) {
          await supabaseAdmin
            .from("whatsapp_sessions")
            .update({ qr_code: qrCode, status: "connecting" })
            .eq("company_id", companyId);
        }

        return new Response(JSON.stringify({ success: true, qr_code: qrCode }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check-status": {
        const { url, key } = getApiConfig();
        const name = session?.instance_name || instanceName;

        const res = await fetch(`${url}/instance/connectionState/${name}`, {
          headers: { apikey: key },
        });
        const data = await res.json();
        const state = data?.instance?.state || data?.state || "close";
        const isConnected = state === "open";

        if (isConnected && session?.status !== "connected") {
          // Get phone number
          let phoneNumber = null;
          try {
            const infoRes = await fetch(`${url}/instance/fetchInstances?instanceName=${name}`, {
              headers: { apikey: key },
            });
            const infoData = await infoRes.json();
            const inst = Array.isArray(infoData) ? infoData[0] : infoData;
            phoneNumber = inst?.instance?.owner || inst?.owner || null;
          } catch {}

          await supabaseAdmin
            .from("whatsapp_sessions")
            .update({
              status: "connected",
              connected_at: new Date().toISOString(),
              qr_code: null,
              phone_number: phoneNumber,
            })
            .eq("company_id", companyId);
        }

        return new Response(JSON.stringify({
          success: true,
          state,
          connected: isConnected,
          phone: session?.phone_number,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send-message": {
        if (!phone || !message_text) {
          return new Response(JSON.stringify({ success: false, error: "Telefone e mensagem são obrigatórios" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { url, key } = getApiConfig();
        const name = session?.instance_name || instanceName;
        const formattedPhone = phone.replace(/\D/g, "");
        const jid = formattedPhone.startsWith("55") ? `${formattedPhone}@s.whatsapp.net` : `55${formattedPhone}@s.whatsapp.net`;

        // Send via Evolution API
        const sendRes = await fetch(`${url}/message/sendText/${name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: key },
          body: JSON.stringify({
            number: jid,
            text: message_text,
          }),
        });

        const sendData = await sendRes.json();
        const externalId = sendData?.key?.id || null;

        // Save message to DB
        await supabaseAdmin.from("whatsapp_messages").insert({
          company_id: companyId,
          phone: formattedPhone,
          sender_type: "seller",
          message_text,
          message_type: "text",
          status: sendRes.ok ? "sent" : "failed",
          external_id: externalId,
          client_id: client_id || null,
        });

        // Upsert conversation
        await supabaseAdmin.from("whatsapp_conversations").upsert({
          company_id: companyId,
          phone: formattedPhone,
          client_id: client_id || null,
          client_name: client_name || formattedPhone,
          last_message: message_text,
          last_message_at: new Date().toISOString(),
          status: "open",
        }, { onConflict: "company_id,phone" });

        if (!sendRes.ok) {
          return new Response(JSON.stringify({ success: false, error: `Erro ao enviar: ${JSON.stringify(sendData)}` }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, message_id: externalId }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "disconnect": {
        const { url, key } = getApiConfig();
        const name = session?.instance_name || instanceName;

        try {
          await fetch(`${url}/instance/logout/${name}`, {
            method: "DELETE",
            headers: { apikey: key },
          });
        } catch {}

        await supabaseAdmin
          .from("whatsapp_sessions")
          .update({
            status: "disconnected",
            qr_code: null,
            phone_number: null,
            connected_at: null,
          })
          .eq("company_id", companyId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
