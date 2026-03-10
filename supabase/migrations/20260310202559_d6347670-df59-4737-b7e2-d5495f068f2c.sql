
-- WhatsApp Sessions table
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number TEXT,
  session_id TEXT,
  instance_name TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- WhatsApp Messages table
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'client',
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Conversations (aggregated view helper)
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  client_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unread_count INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, phone)
);

-- Indexes
CREATE INDEX idx_whatsapp_messages_company ON public.whatsapp_messages(company_id);
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(company_id, phone);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_conversations_company ON public.whatsapp_conversations(company_id);
CREATE INDEX idx_whatsapp_conversations_last_msg ON public.whatsapp_conversations(company_id, last_message_at DESC);

-- Enable RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- RLS for whatsapp_sessions
CREATE POLICY "Admins can manage sessions" ON public.whatsapp_sessions
  FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view sessions" ON public.whatsapp_sessions
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- RLS for whatsapp_messages
CREATE POLICY "Users can view messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Users can send messages" ON public.whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS for whatsapp_conversations
CREATE POLICY "Users can view conversations" ON public.whatsapp_conversations
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Users can manage conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin())
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
