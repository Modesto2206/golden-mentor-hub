import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface WhatsAppSession {
  id: string;
  company_id: string;
  phone_number: string | null;
  session_id: string | null;
  instance_name: string | null;
  status: string;
  qr_code: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
  api_url: string | null;
  api_key: string | null;
}

export interface WhatsAppConversation {
  id: string;
  company_id: string;
  client_id: string | null;
  phone: string;
  client_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  assigned_to: string | null;
  status: string;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  company_id: string;
  client_id: string | null;
  phone: string;
  sender_type: string;
  message_text: string | null;
  message_type: string;
  media_url: string | null;
  status: string;
  external_id: string | null;
  created_at: string;
}

// Helper to invoke evolution edge function
const invokeEvolution = async (action: string, data: Record<string, any> = {}) => {
  const { data: result, error } = await supabase.functions.invoke("whatsapp-evolution", {
    body: { action, ...data },
  });
  if (error) throw error;
  if (result && !result.success) throw new Error(result.error || "Erro desconhecido");
  return result;
};

export const useWhatsAppSession = () => {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ["whatsapp-session", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("whatsapp_sessions" as any) as any)
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppSession | null;
    },
    enabled: !!companyId,
    staleTime: 1000 * 10,
  });
};

export const useWhatsAppConversations = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-conversations", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("whatsapp_conversations" as any) as any)
        .select("*")
        .eq("company_id", companyId)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WhatsAppConversation[];
    },
    enabled: !!companyId,
    staleTime: 1000 * 10,
  });

  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("whatsapp-conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations", filter: `company_id=eq.${companyId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", companyId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);

  return query;
};

export const useWhatsAppMessages = (phone: string | null) => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-messages", companyId, phone],
    queryFn: async () => {
      const { data, error } = await (supabase.from("whatsapp_messages" as any) as any)
        .select("*")
        .eq("company_id", companyId)
        .eq("phone", phone)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as WhatsAppMessage[];
    },
    enabled: !!companyId && !!phone,
    staleTime: 1000 * 5,
  });

  useEffect(() => {
    if (!companyId || !phone) return;
    const channel = supabase
      .channel(`whatsapp-msgs-${phone}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_messages", filter: `company_id=eq.${companyId}` }, (payload: any) => {
        if (payload.new?.phone === phone) {
          queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", companyId, phone] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, phone, queryClient]);

  return query;
};

export const useSendWhatsAppMessage = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, messageText, clientId, clientName }: {
      phone: string;
      messageText: string;
      clientId?: string | null;
      clientName?: string | null;
    }) => {
      if (!companyId) throw new Error("Sem empresa");

      // Check if session has Evolution API configured
      const { data: session } = await (supabase.from("whatsapp_sessions" as any) as any)
        .select("api_url, api_key, status")
        .eq("company_id", companyId)
        .maybeSingle();

      if (session?.api_url && session?.api_key && session?.status === "connected") {
        // Send via Evolution API
        return invokeEvolution("send-message", {
          phone,
          message_text: messageText,
          client_id: clientId,
          client_name: clientName,
        });
      }

      // Fallback: save locally (manual mode)
      const { error: msgError } = await (supabase.from("whatsapp_messages" as any) as any)
        .insert({
          company_id: companyId,
          phone,
          sender_type: "seller",
          message_text: messageText,
          message_type: "text",
          status: "pending",
          client_id: clientId || null,
        });
      if (msgError) throw msgError;

      const { error: convError } = await (supabase.from("whatsapp_conversations" as any) as any)
        .upsert({
          company_id: companyId,
          phone,
          client_id: clientId || null,
          client_name: clientName || phone,
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          status: "open",
        }, { onConflict: "company_id,phone" });
      if (convError) throw convError;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", companyId, vars.phone] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations", companyId] });
    },
  });
};

export const useSaveEvolutionConfig = () => {
  const queryClient = useQueryClient();
  const { companyId } = useAuth();

  return useMutation({
    mutationFn: async ({ apiUrl, apiKey }: { apiUrl: string; apiKey: string }) => {
      return invokeEvolution("save-config", { api_url: apiUrl, api_key: apiKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-session", companyId] });
    },
  });
};

export const useCreateWhatsAppSession = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Sem empresa");
      return invokeEvolution("create-instance");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-session", companyId] });
    },
  });
};

export const useCheckWhatsAppStatus = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return invokeEvolution("check-status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-session", companyId] });
    },
  });
};

export const useRefreshQRCode = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return invokeEvolution("get-qrcode");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-session", companyId] });
    },
  });
};

export const useDisconnectWhatsApp = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Sem empresa");
      return invokeEvolution("disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-session", companyId] });
    },
  });
};
