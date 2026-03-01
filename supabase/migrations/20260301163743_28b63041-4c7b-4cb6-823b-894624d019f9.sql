
-- 1. Add max_users and status to companies (plan already exists as 'plano')
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS max_users integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Update existing plano values to new standard if needed
-- Map: basico -> basic, profissional -> advanced_5, enterprise -> advanced_10

-- 2. Add convenio and modalidade to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS convenio text,
  ADD COLUMN IF NOT EXISTS modalidade text;

-- 3. Create composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_company_created ON public.clients (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_company_created ON public.sales (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_company_created ON public.proposals (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON public.audit_logs (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_company_created ON public.tasks (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_benefits_company_created ON public.benefits (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_commission_entries_company_created ON public.commission_entries (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_goals_company_created ON public.goals (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_banks_company_id ON public.banks (company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products (company_id);

-- 4. Create function to count company users
CREATE OR REPLACE FUNCTION public.get_company_user_count(_company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.profiles WHERE company_id = _company_id AND is_active = true
$$;

-- 5. Create function to check if company can add users
CREATE OR REPLACE FUNCTION public.can_add_user(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    SELECT COUNT(*)::integer FROM public.profiles WHERE company_id = _company_id AND is_active = true
  ) < (
    SELECT COALESCE(max_users, 999) FROM public.companies WHERE id = _company_id
  )
$$;

-- 6. Create function to check if company is active
CREATE OR REPLACE FUNCTION public.is_company_active(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies WHERE id = _company_id AND status = 'active'
  )
$$;
