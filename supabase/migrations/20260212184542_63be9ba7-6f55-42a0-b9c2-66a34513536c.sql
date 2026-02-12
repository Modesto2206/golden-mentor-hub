
-- Add API integration columns to banks
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS possui_api boolean NOT NULL DEFAULT false;
ALTER TABLE public.banks ADD COLUMN IF NOT EXISTS base_url text;

-- Add Facta integration columns to proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS protocolo_banco text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS payload_enviado jsonb;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS resposta_banco jsonb;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS erro_banco text;
