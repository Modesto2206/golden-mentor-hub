
-- ============================================================
-- PART 1: FIX RESTRICTIVE → PERMISSIVE RLS POLICIES
-- ============================================================

-- === BANKS ===
DROP POLICY IF EXISTS "Admins can manage banks" ON public.banks;
DROP POLICY IF EXISTS "Users can view banks of their company" ON public.banks;

CREATE POLICY "Admins can manage banks" ON public.banks
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view banks of their company" ON public.banks
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === GOALS ===
DROP POLICY IF EXISTS "Admins can manage goals" ON public.goals;
DROP POLICY IF EXISTS "Users can view goals" ON public.goals;

CREATE POLICY "Admins can manage goals" ON public.goals
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view goals" ON public.goals
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === BENEFITS ===
DROP POLICY IF EXISTS "Users can manage benefits" ON public.benefits;
DROP POLICY IF EXISTS "Users can view benefits" ON public.benefits;

CREATE POLICY "Users can manage benefits" ON public.benefits
  AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin())
  WITH CHECK (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Users can view benefits" ON public.benefits
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === COMMISSION_ENTRIES ===
DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commission_entries;
DROP POLICY IF EXISTS "Users can view own commissions" ON public.commission_entries;

CREATE POLICY "Admins can manage commissions" ON public.commission_entries
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view own commissions" ON public.commission_entries
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((seller_id = auth.uid() AND company_id = get_user_company_id(auth.uid())) OR (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

-- === COMPANY_BILLING ===
DROP POLICY IF EXISTS "Super admins can manage billing" ON public.company_billing;
DROP POLICY IF EXISTS "Admins can view own billing" ON public.company_billing;

CREATE POLICY "Super admins can manage billing" ON public.company_billing
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Admins can view own billing" ON public.company_billing
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === SELLER_COMMISSIONS ===
DROP POLICY IF EXISTS "Admins can manage seller commissions" ON public.seller_commissions;
DROP POLICY IF EXISTS "Sellers can view own commissions" ON public.seller_commissions;

CREATE POLICY "Admins can manage seller commissions" ON public.seller_commissions
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Sellers can view own commissions" ON public.seller_commissions
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((seller_id = auth.uid() AND company_id = get_user_company_id(auth.uid())) OR (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

-- === STORE_PRODUCTS ===
DROP POLICY IF EXISTS "Admins can manage store products" ON public.store_products;
DROP POLICY IF EXISTS "Users can view store products of their company" ON public.store_products;

CREATE POLICY "Admins can manage store products" ON public.store_products
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view store products of their company" ON public.store_products
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === API_CREDENTIALS ===
DROP POLICY IF EXISTS "Admins can manage credentials" ON public.api_credentials;
DROP POLICY IF EXISTS "Users can view credential names" ON public.api_credentials;

CREATE POLICY "Admins can manage credentials" ON public.api_credentials
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view credential names" ON public.api_credentials
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- === COMMISSION_RULES ===
DROP POLICY IF EXISTS "Admins can manage commission rules" ON public.commission_rules;
DROP POLICY IF EXISTS "Users can view commission rules" ON public.commission_rules;

CREATE POLICY "Admins can manage commission rules" ON public.commission_rules
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view commission rules" ON public.commission_rules
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === MONTHLY_GOALS ===
DROP POLICY IF EXISTS "Admins can manage goals" ON public.monthly_goals;
DROP POLICY IF EXISTS "Authenticated users can view goals" ON public.monthly_goals;

CREATE POLICY "Admins can manage goals" ON public.monthly_goals
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Authenticated users can view goals" ON public.monthly_goals
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === COMPANIES ===
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated can view companies" ON public.companies;

CREATE POLICY "Admins can manage companies" ON public.companies
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Authenticated can view companies" ON public.companies
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view their own roles" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- === PRODUCTS ===
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view products" ON public.products;

CREATE POLICY "Admins can manage products" ON public.products
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view products" ON public.products
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === COMPANY_SETTINGS ===
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can view own company settings" ON public.company_settings;

CREATE POLICY "Admins can manage company settings" ON public.company_settings
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view own company settings" ON public.company_settings
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === ROLE_PERMISSIONS ===
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated can view permissions" ON public.role_permissions;

CREATE POLICY "Admins can manage permissions" ON public.role_permissions
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_admin() OR is_super_admin())
  WITH CHECK (is_admin() OR is_super_admin());

CREATE POLICY "Authenticated can view permissions" ON public.role_permissions
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- === COMPANY_GOALS ===
DROP POLICY IF EXISTS "Admins can manage company goals" ON public.company_goals;
DROP POLICY IF EXISTS "Users can view company goals" ON public.company_goals;

CREATE POLICY "Admins can manage company goals" ON public.company_goals
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin())
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view company goals" ON public.company_goals
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === PROFILES ===
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can view their own profile" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles" ON public.profiles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR is_super_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles" ON public.profiles
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

-- === FIX REMAINING RESTRICTIVE TABLES (single-policy-per-command but still RESTRICTIVE) ===

-- CONSENT_REQUESTS
DROP POLICY IF EXISTS "Users can create consents" ON public.consent_requests;
DROP POLICY IF EXISTS "Users can update consents" ON public.consent_requests;
DROP POLICY IF EXISTS "Users can view consents" ON public.consent_requests;

CREATE POLICY "Users can create consents" ON public.consent_requests
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update consents" ON public.consent_requests
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view consents" ON public.consent_requests
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- ALERTS
DROP POLICY IF EXISTS "System can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can mark alerts read" ON public.alerts;
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;

CREATE POLICY "System can create alerts" ON public.alerts
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can mark alerts read" ON public.alerts
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND (user_id = auth.uid() OR is_admin()));

CREATE POLICY "Users can view own alerts" ON public.alerts
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL));

-- PROPOSALS
DROP POLICY IF EXISTS "Users can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete proposals" ON public.proposals;

CREATE POLICY "Users can create proposals" ON public.proposals
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'propostas'::app_resource, 'create'::app_action) AND (company_id = get_user_company_id(auth.uid()) OR is_super_admin()) AND seller_id = auth.uid());

CREATE POLICY "Users can view proposals" ON public.proposals
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'propostas'::app_resource, 'view'::app_action) AND (company_id = get_user_company_id(auth.uid()) OR is_super_admin()));

CREATE POLICY "Users can update proposals" ON public.proposals
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'propostas'::app_resource, 'update'::app_action) AND (seller_id = auth.uid() OR is_admin() OR is_super_admin()));

CREATE POLICY "Users can delete proposals" ON public.proposals
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'propostas'::app_resource, 'delete'::app_action) AND (company_id = get_user_company_id(auth.uid()) OR is_super_admin()));

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- TASKS
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

CREATE POLICY "Users can view tasks" ON public.tasks
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Users can create tasks" ON public.tasks
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update tasks" ON public.tasks
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete tasks" ON public.tasks
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

-- PORTABILITY_CONTRACTS
DROP POLICY IF EXISTS "Users can manage portability contracts" ON public.portability_contracts;

CREATE POLICY "Users can manage portability contracts" ON public.portability_contracts
  AS PERMISSIVE FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM proposals p WHERE p.id = portability_contracts.proposal_id AND p.company_id = get_user_company_id(auth.uid())));

-- CLIENTS
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;

CREATE POLICY "Users can view clients" ON public.clients
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_admin() OR is_super_admin());

CREATE POLICY "Users can create clients" ON public.clients
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update clients" ON public.clients
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_admin());

CREATE POLICY "Users can delete clients" ON public.clients
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_admin() OR is_super_admin() OR (created_by = auth.uid() AND company_id = get_user_company_id(auth.uid())));

-- PROPOSAL_STATUS_HISTORY
DROP POLICY IF EXISTS "Users can view status history" ON public.proposal_status_history;
DROP POLICY IF EXISTS "Authenticated can insert status history" ON public.proposal_status_history;

CREATE POLICY "Users can view status history" ON public.proposal_status_history
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM proposals p WHERE p.id = proposal_status_history.proposal_id AND p.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Authenticated can insert status history" ON public.proposal_status_history
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- INTEGRATION_LOGS
DROP POLICY IF EXISTS "Admins can view integration logs" ON public.integration_logs;
DROP POLICY IF EXISTS "System can insert integration logs" ON public.integration_logs;

CREATE POLICY "Admins can view integration logs" ON public.integration_logs
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "System can insert integration logs" ON public.integration_logs
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- SIMULATIONS
DROP POLICY IF EXISTS "Users can create simulations" ON public.simulations;
DROP POLICY IF EXISTS "Users can view simulations" ON public.simulations;

CREATE POLICY "Users can create simulations" ON public.simulations
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view simulations" ON public.simulations
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- === ALSO FIX SALES (were recreated as RESTRICTIVE in previous migration) ===
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can create sales for anyone" ON public.sales;
DROP POLICY IF EXISTS "Admins can update any sale" ON public.sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Vendedores can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Vendedores can create their own sales" ON public.sales;
DROP POLICY IF EXISTS "Vendedores can update their own sales" ON public.sales;

CREATE POLICY "Admins can view all sales" ON public.sales
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Admins can create sales for anyone" ON public.sales
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Admins can update any sale" ON public.sales
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Admins can delete sales" ON public.sales
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

CREATE POLICY "Vendedores can view their own sales" ON public.sales
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = seller_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Vendedores can create their own sales" ON public.sales
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id AND is_vendedor() AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Vendedores can update their own sales" ON public.sales
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id AND is_vendedor() AND company_id = get_user_company_id(auth.uid()));


-- ============================================================
-- PART 2: PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sales_company_id ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller_id ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON public.clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_seller_id ON public.proposals(seller_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_internal_status ON public.proposals(internal_status);

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);

CREATE INDEX IF NOT EXISTS idx_goals_company_id ON public.goals(company_id);
CREATE INDEX IF NOT EXISTS idx_goals_seller_id ON public.goals(seller_id);

CREATE INDEX IF NOT EXISTS idx_monthly_goals_company_id ON public.monthly_goals(company_id);
CREATE INDEX IF NOT EXISTS idx_company_goals_company_id ON public.company_goals(company_id);

CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_alerts_company_id ON public.alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_benefits_company_id ON public.benefits(company_id);
CREATE INDEX IF NOT EXISTS idx_benefits_client_id ON public.benefits(client_id);

CREATE INDEX IF NOT EXISTS idx_banks_company_id ON public.banks(company_id);

CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_bank_id ON public.products(bank_id);

CREATE INDEX IF NOT EXISTS idx_simulations_company_id ON public.simulations(company_id);
CREATE INDEX IF NOT EXISTS idx_simulations_client_id ON public.simulations(client_id);

CREATE INDEX IF NOT EXISTS idx_commission_entries_company_id ON public.commission_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_commission_entries_seller_id ON public.commission_entries(seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_commissions_company_id ON public.seller_commissions(company_id);
CREATE INDEX IF NOT EXISTS idx_seller_commissions_seller_id ON public.seller_commissions(seller_id);

CREATE INDEX IF NOT EXISTS idx_company_billing_company_id ON public.company_billing(company_id);
CREATE INDEX IF NOT EXISTS idx_company_billing_due_date ON public.company_billing(due_date);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_integration_logs_company_id ON public.integration_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON public.integration_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_proposal_status_history_proposal_id ON public.proposal_status_history(proposal_id);

-- Composite indexes for common multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON public.sales(company_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_proposals_company_status ON public.proposals(company_id, internal_status);
CREATE INDEX IF NOT EXISTS idx_clients_company_active ON public.clients(company_id, is_active);


-- ============================================================
-- PART 3: DATA INTEGRITY - NOT NULL CONSTRAINTS
-- ============================================================

-- Update any NULL company_id in sales before adding constraint
UPDATE public.sales SET company_id = (
  SELECT p.company_id FROM public.profiles p WHERE p.user_id = sales.seller_id LIMIT 1
) WHERE company_id IS NULL;

-- Make sales.company_id NOT NULL
ALTER TABLE public.sales ALTER COLUMN company_id SET NOT NULL;
