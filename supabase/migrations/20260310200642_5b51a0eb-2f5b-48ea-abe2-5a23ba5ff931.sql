
-- Drop all existing SELECT policies on clients
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Vendedores can view own clients" ON public.clients;

-- Recreate as PERMISSIVE so OR logic applies
CREATE POLICY "Admins can view all clients" ON public.clients
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin()
  );

CREATE POLICY "Vendedores can view own clients" ON public.clients
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() AND company_id = get_user_company_id(auth.uid())
  );
