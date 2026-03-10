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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const companyId = url.searchParams.get("company_id");

    if (!companyId) {
      return new Response(JSON.stringify({ error: "company_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body.event;

    console.log(`[webhook] company=${companyId} event=${event}`);

    // Handle connection updates
    if (event === "CONNECTION_UPDATE" || event === "connection.update") {
      const state = body.data?.state || body.state;
      const instance = body.instance || body.data?.instance;

      if (state === "open") {
        // Connected!
        let phoneNumber = null;
        if (body.data?.wuid) {
          phoneNumber = body.data.wuid.replace(/@.*/, "");
        }

        await supabase
          .from("whatsapp_sessions")
          .update({
            status: "connected",
            connected_at: new Date().toISOString(),
            qr_code: null,
            phone_number: phoneNumber,
          })
          .eq("company_id", companyId);
      } else if (state === "close" || state === "refused") {
        await supabase
          .from("whatsapp_sessions")
          .update({ status: "disconnected", qr_code: null })
          .eq("company_id", companyId);
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle QR Code updates
    if (event === "QRCODE_UPDATED" || event === "qrcode.updated") {
      const qrBase64 = body.data?.qrcode?.base64 || body.qrcode?.base64 || body.data?.base64;

      if (qrBase64) {
        await supabase
          .from("whatsapp_sessions")
          .update({ qr_code: qrBase64, status: "connecting" })
          .eq("company_id", companyId);
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle incoming messages
    if (event === "MESSAGES_UPSERT" || event === "messages.upsert") {
      const messages = body.data || [];
      const msgArray = Array.isArray(messages) ? messages : [messages];

      for (const msg of msgArray) {
        // Skip outgoing messages (fromMe)
        if (msg.key?.fromMe) continue;

        const remoteJid = msg.key?.remoteJid || "";
        // Skip group messages
        if (remoteJid.includes("@g.us")) continue;

        const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
        if (!phone) continue;

        const messageText = msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          null;

        const messageType = msg.message?.imageMessage ? "image" :
          msg.message?.videoMessage ? "video" :
          msg.message?.audioMessage ? "audio" :
          msg.message?.documentMessage ? "document" :
          "text";

        const pushName = msg.pushName || phone;

        // Check if we have a client with this phone
        const { data: client } = await supabase
          .from("clients")
          .select("id, full_name")
          .eq("company_id", companyId)
          .or(`phone.eq.${phone},phone.eq.+${phone},phone.eq.+55${phone}`)
          .maybeSingle();

        // Insert message
        await supabase.from("whatsapp_messages").insert({
          company_id: companyId,
          phone,
          sender_type: "client",
          message_text: messageText,
          message_type: messageType,
          status: "received",
          external_id: msg.key?.id || null,
          client_id: client?.id || null,
        });

        // Upsert conversation
        const clientName = client?.full_name || pushName || phone;

        // Get current conversation to increment unread
        const { data: existingConv } = await supabase
          .from("whatsapp_conversations")
          .select("unread_count")
          .eq("company_id", companyId)
          .eq("phone", phone)
          .maybeSingle();

        await supabase.from("whatsapp_conversations").upsert({
          company_id: companyId,
          phone,
          client_id: client?.id || null,
          client_name: clientName,
          last_message: messageText || `[${messageType}]`,
          last_message_at: new Date().toISOString(),
          unread_count: (existingConv?.unread_count || 0) + 1,
          status: "open",
        }, { onConflict: "company_id,phone" });
      }

      return new Response(JSON.stringify({ ok: true, processed: msgArray.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unknown event - just acknowledge
    return new Response(JSON.stringify({ ok: true, event }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[webhook] error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
