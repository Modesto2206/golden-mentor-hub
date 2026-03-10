
-- Performance indexes for main tables
-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_company_seller ON public.sales(company_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON public.sales(company_id, sale_date DESC);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON public.clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_company_created_by ON public.clients(company_id, created_by);

-- Proposals
CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_seller_id ON public.proposals(seller_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_internal_status ON public.proposals(internal_status);
CREATE INDEX IF NOT EXISTS idx_proposals_company_status ON public.proposals(company_id, internal_status);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Goals
CREATE INDEX IF NOT EXISTS idx_goals_company_id ON public.goals(company_id);
CREATE INDEX IF NOT EXISTS idx_goals_seller_id ON public.goals(seller_id);
CREATE INDEX IF NOT EXISTS idx_goals_company_month_year ON public.goals(company_id, month, year);

-- Monthly Goals
CREATE INDEX IF NOT EXISTS idx_monthly_goals_company_id ON public.monthly_goals(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_month_year ON public.monthly_goals(company_id, month, year);

-- Company Goals
CREATE INDEX IF NOT EXISTS idx_company_goals_company_month_year ON public.company_goals(company_id, month, year);

-- Simulations
CREATE INDEX IF NOT EXISTS idx_simulations_company_id ON public.simulations(company_id);
CREATE INDEX IF NOT EXISTS idx_simulations_client_id ON public.simulations(client_id);

-- Seller Commissions
CREATE INDEX IF NOT EXISTS idx_seller_commissions_company_id ON public.seller_commissions(company_id);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_seller_id ON public.seller_commissions(seller_id);

-- User Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);

-- Commission Entries
CREATE INDEX IF NOT EXISTS idx_commission_entries_seller_id ON public.commission_entries(seller_id);
CREATE INDEX IF NOT EXISTS idx_commission_entries_company_id ON public.commission_entries(company_id);

-- Benefits
CREATE INDEX IF NOT EXISTS idx_benefits_client_id ON public.benefits(client_id);
CREATE INDEX IF NOT EXISTS idx_benefits_company_id ON public.benefits(company_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
