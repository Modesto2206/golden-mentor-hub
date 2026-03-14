
-- 1. PRIVILEGE ESCALATION: Restrict user_roles INSERT/UPDATE to prevent admins from assigning super-admin roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()) AND role NOT IN ('raiz', 'admin_global'))
  OR is_super_admin()
)
WITH CHECK (
  (is_admin() AND company_id = get_user_company_id(auth.uid()) AND role NOT IN ('raiz', 'admin_global'))
  OR is_super_admin()
);

-- 2. PRIVILEGE ESCALATION: Restrict role_permissions management to super admins only
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.role_permissions;

CREATE POLICY "Super admins can manage permissions" ON public.role_permissions
FOR ALL TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- 3. CROSS-TENANT: Fix clients UPDATE policy to scope by company
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;

CREATE POLICY "Users can update clients" ON public.clients
FOR UPDATE TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid()))
  AND (created_by = auth.uid() OR is_admin() OR is_super_admin())
);

-- 4. CROSS-TENANT: Fix clients DELETE policy to scope by company
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;

CREATE POLICY "Users can delete clients" ON public.clients
FOR DELETE TO authenticated
USING (
  (company_id = get_user_company_id(auth.uid()))
  AND (created_by = auth.uid() OR is_admin() OR is_super_admin())
);

-- 5. EXPOSED DATA: Restrict company_billing SELECT to admins only
DROP POLICY IF EXISTS "Admins can view own billing" ON public.company_billing;

CREATE POLICY "Admins can view own billing" ON public.company_billing
FOR SELECT TO authenticated
USING (
  (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);

-- 6. MISSING RLS: Restrict proposal_status_history INSERT to own company proposals
DROP POLICY IF EXISTS "Authenticated can insert status history" ON public.proposal_status_history;

CREATE POLICY "Users can insert status history for own proposals" ON public.proposal_status_history
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM proposals p
    WHERE p.id = proposal_id
      AND p.company_id = get_user_company_id(auth.uid())
  )
);

-- 7. MISSING RLS: Restrict alerts INSERT to own company
DROP POLICY IF EXISTS "System can create alerts" ON public.alerts;

CREATE POLICY "Users can create alerts for own company" ON public.alerts
FOR INSERT TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
);

-- 8. MISSING RLS: Restrict audit_logs INSERT to own company and own user_id
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert own audit logs" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND user_id = auth.uid()
);

-- 9. MISSING RLS: Restrict integration_logs INSERT to own company
DROP POLICY IF EXISTS "System can insert integration logs" ON public.integration_logs;

CREATE POLICY "Users can insert integration logs for own company" ON public.integration_logs
FOR INSERT TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
);
