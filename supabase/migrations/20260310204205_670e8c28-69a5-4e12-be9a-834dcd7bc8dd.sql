
ALTER TABLE public.whatsapp_sessions
  ADD COLUMN IF NOT EXISTS api_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS api_key text DEFAULT NULL;
