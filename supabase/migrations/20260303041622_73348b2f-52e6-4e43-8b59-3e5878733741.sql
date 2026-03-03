
-- 1. Add Ghost plan support + performance indexes + CASCADE

-- Add plan_type column to companies (ghost plan)
-- We'll use the existing 'plano' column and just allow 'ghost' as a value

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_seller_id ON public.proposals(seller_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_company_seller_month ON public.seller_commissions(company_id, seller_id, month_reference);

-- 3. Add ON DELETE CASCADE to foreign keys that reference companies
-- Drop and recreate FKs with CASCADE

-- profiles.company_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- user_roles.company_id
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_company_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- clients.company_id
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_company_id_fkey;
ALTER TABLE public.clients ADD CONSTRAINT clients_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- sales.company_id
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_company_id_fkey;
ALTER TABLE public.sales ADD CONSTRAINT sales_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- banks.company_id
ALTER TABLE public.banks DROP CONSTRAINT IF EXISTS banks_company_id_fkey;
ALTER TABLE public.banks ADD CONSTRAINT banks_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- proposals.company_id
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_company_id_fkey;
ALTER TABLE public.proposals ADD CONSTRAINT proposals_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- goals.company_id
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_company_id_fkey;
ALTER TABLE public.goals ADD CONSTRAINT goals_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- monthly_goals.company_id
ALTER TABLE public.monthly_goals DROP CONSTRAINT IF EXISTS monthly_goals_company_id_fkey;
ALTER TABLE public.monthly_goals ADD CONSTRAINT monthly_goals_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- benefits.company_id
ALTER TABLE public.benefits DROP CONSTRAINT IF EXISTS benefits_company_id_fkey;
ALTER TABLE public.benefits ADD CONSTRAINT benefits_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- commission_entries.company_id
ALTER TABLE public.commission_entries DROP CONSTRAINT IF EXISTS commission_entries_company_id_fkey;
ALTER TABLE public.commission_entries ADD CONSTRAINT commission_entries_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- commission_rules.company_id
ALTER TABLE public.commission_rules DROP CONSTRAINT IF EXISTS commission_rules_company_id_fkey;
ALTER TABLE public.commission_rules ADD CONSTRAINT commission_rules_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- seller_commissions.company_id
ALTER TABLE public.seller_commissions DROP CONSTRAINT IF EXISTS seller_commissions_company_id_fkey;
ALTER TABLE public.seller_commissions ADD CONSTRAINT seller_commissions_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- company_settings.company_id
ALTER TABLE public.company_settings DROP CONSTRAINT IF EXISTS company_settings_company_id_fkey;
ALTER TABLE public.company_settings ADD CONSTRAINT company_settings_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- tasks.company_id
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_company_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- alerts.company_id
ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS alerts_company_id_fkey;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- api_credentials.company_id
ALTER TABLE public.api_credentials DROP CONSTRAINT IF EXISTS api_credentials_company_id_fkey;
ALTER TABLE public.api_credentials ADD CONSTRAINT api_credentials_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- consent_requests.company_id
ALTER TABLE public.consent_requests DROP CONSTRAINT IF EXISTS consent_requests_company_id_fkey;
ALTER TABLE public.consent_requests ADD CONSTRAINT consent_requests_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- integration_logs.company_id
ALTER TABLE public.integration_logs DROP CONSTRAINT IF EXISTS integration_logs_company_id_fkey;
ALTER TABLE public.integration_logs ADD CONSTRAINT integration_logs_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- simulations.company_id
ALTER TABLE public.simulations DROP CONSTRAINT IF EXISTS simulations_company_id_fkey;
ALTER TABLE public.simulations ADD CONSTRAINT simulations_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- store_products.company_id
ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_company_id_fkey;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- audit_logs.company_id
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_company_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- products.company_id
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_company_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
