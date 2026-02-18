
-- Drop existing SELECT and DELETE policies on clients
DROP POLICY IF EXISTS "Users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

-- SELECT: Vendedor vê só seus clientes, Admin/SuperAdmin vê todos da empresa
CREATE POLICY "Users can view clients"
ON public.clients FOR SELECT
USING (
  (is_admin() OR is_super_admin())
  OR
  (created_by = auth.uid() AND company_id = get_user_company_id(auth.uid()))
);

-- DELETE: Admin pode deletar qualquer um da empresa, vendedor só os seus
CREATE POLICY "Users can delete clients"
ON public.clients FOR DELETE
USING (
  (is_admin() OR is_super_admin())
  OR
  (created_by = auth.uid() AND company_id = get_user_company_id(auth.uid()))
);
