
-- Drop existing SELECT policy on clients
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;

-- Admins/SuperAdmins see all clients in their company
CREATE POLICY "Admins can view all clients" ON public.clients
  FOR SELECT TO authenticated
  USING (
    (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin()
  );

-- Vendedores see only clients they created
CREATE POLICY "Vendedores can view own clients" ON public.clients
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() AND company_id = get_user_company_id(auth.uid())
  );
