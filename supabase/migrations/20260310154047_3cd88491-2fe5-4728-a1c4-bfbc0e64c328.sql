
-- =====================================================
-- MULTI-TENANT ISOLATION: Fix all RLS policies
-- =====================================================

-- 1. SALES TABLE - Add company_id isolation for admins
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;
CREATE POLICY "Admins can view all sales" ON public.sales
FOR SELECT TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can create sales for anyone" ON public.sales;
CREATE POLICY "Admins can create sales for anyone" ON public.sales
FOR INSERT TO public
WITH CHECK (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can update any sale" ON public.sales;
CREATE POLICY "Admins can update any sale" ON public.sales
FOR UPDATE TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
CREATE POLICY "Admins can delete sales" ON public.sales
FOR DELETE TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- Vendedor SELECT also needs company_id
DROP POLICY IF EXISTS "Vendedores can view their own sales" ON public.sales;
CREATE POLICY "Vendedores can view their own sales" ON public.sales
FOR SELECT TO public
USING (auth.uid() = seller_id AND company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Vendedores can create their own sales" ON public.sales;
CREATE POLICY "Vendedores can create their own sales" ON public.sales
FOR INSERT TO public
WITH CHECK (auth.uid() = seller_id AND is_vendedor() AND company_id = get_user_company_id(auth.uid()));

DROP POLICY IF EXISTS "Vendedores can update their own sales" ON public.sales;
CREATE POLICY "Vendedores can update their own sales" ON public.sales
FOR UPDATE TO public
USING (auth.uid() = seller_id AND is_vendedor() AND company_id = get_user_company_id(auth.uid()));

-- 2. MONTHLY_GOALS - Restrict SELECT to company
DROP POLICY IF EXISTS "Authenticated users can view goals" ON public.monthly_goals;
CREATE POLICY "Authenticated users can view goals" ON public.monthly_goals
FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- Also fix ALL policy for admins
DROP POLICY IF EXISTS "Admins can manage goals" ON public.monthly_goals;
CREATE POLICY "Admins can manage goals" ON public.monthly_goals
FOR ALL TO authenticated
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
)
WITH CHECK (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 3. USER_ROLES - Scope admin access to same company
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 4. PROFILES - Scope admin access to same company
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT TO public
WITH CHECK (
  is_admin() OR is_super_admin() OR auth.uid() = user_id
);

-- 5. BANKS - Scope admin ALL to company
DROP POLICY IF EXISTS "Admins can manage banks" ON public.banks;
CREATE POLICY "Admins can manage banks" ON public.banks
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 6. GOALS - Scope admin ALL to company
DROP POLICY IF EXISTS "Admins can manage goals" ON public.goals;
CREATE POLICY "Admins can manage goals" ON public.goals
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 7. BENEFITS - Fix ALL policy
DROP POLICY IF EXISTS "Users can manage benefits" ON public.benefits;
CREATE POLICY "Users can manage benefits" ON public.benefits
FOR ALL TO public
USING (
  (company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 8. COMMISSION_ENTRIES - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commission_entries;
CREATE POLICY "Admins can manage commissions" ON public.commission_entries
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Users can view own commissions" ON public.commission_entries;
CREATE POLICY "Users can view own commissions" ON public.commission_entries
FOR SELECT TO public
USING (
  (seller_id = auth.uid() AND company_id = get_user_company_id(auth.uid()))
  OR (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 9. COMMISSION_RULES - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage commission rules" ON public.commission_rules;
CREATE POLICY "Admins can manage commission rules" ON public.commission_rules
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 10. SELLER_COMMISSIONS - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage seller commissions" ON public.seller_commissions;
CREATE POLICY "Admins can manage seller commissions" ON public.seller_commissions
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

DROP POLICY IF EXISTS "Sellers can view own commissions" ON public.seller_commissions;
CREATE POLICY "Sellers can view own commissions" ON public.seller_commissions
FOR SELECT TO public
USING (
  (seller_id = auth.uid() AND company_id = get_user_company_id(auth.uid()))
  OR (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 11. STORE_PRODUCTS - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage store products" ON public.store_products;
CREATE POLICY "Admins can manage store products" ON public.store_products
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 12. API_CREDENTIALS - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage credentials" ON public.api_credentials;
CREATE POLICY "Admins can manage credentials" ON public.api_credentials
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 13. COMPANY_SETTINGS - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;
CREATE POLICY "Admins can manage company settings" ON public.company_settings
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 14. COMPANY_GOALS - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage company goals" ON public.company_goals;
CREATE POLICY "Admins can manage company goals" ON public.company_goals
FOR ALL TO authenticated
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
)
WITH CHECK (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 15. ALERTS - Scope to company
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
CREATE POLICY "Users can view own alerts" ON public.alerts
FOR SELECT TO public
USING (
  company_id = get_user_company_id(auth.uid())
  AND ((user_id = auth.uid()) OR (user_id IS NULL))
);

DROP POLICY IF EXISTS "Users can mark alerts read" ON public.alerts;
CREATE POLICY "Users can mark alerts read" ON public.alerts
FOR UPDATE TO public
USING (
  company_id = get_user_company_id(auth.uid())
  AND ((user_id = auth.uid()) OR is_admin())
);

-- 16. AUDIT_LOGS - Scope admin view to company
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 17. INTEGRATION_LOGS - Scope admin to company
DROP POLICY IF EXISTS "Admins can view integration logs" ON public.integration_logs;
CREATE POLICY "Admins can view integration logs" ON public.integration_logs
FOR SELECT TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 18. TASKS - Scope admin delete to company
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
CREATE POLICY "Admins can delete tasks" ON public.tasks
FOR DELETE TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 19. PRODUCTS - Scope admin to company
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
FOR ALL TO public
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 20. ROLE_PERMISSIONS - Scope admin to company (global table but restrict management)
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage permissions" ON public.role_permissions
FOR ALL TO public
USING (is_admin() OR is_super_admin());

-- 21. COMPANIES - Restrict admin to own company only
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
CREATE POLICY "Admins can manage companies" ON public.companies
FOR ALL TO public
USING (
  (is_admin() AND id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- Restrict SELECT to own company for non-super-admins
DROP POLICY IF EXISTS "Authenticated can view companies" ON public.companies;
CREATE POLICY "Authenticated can view companies" ON public.companies
FOR SELECT TO public
USING (
  id = get_user_company_id(auth.uid())
  OR is_super_admin()
);
