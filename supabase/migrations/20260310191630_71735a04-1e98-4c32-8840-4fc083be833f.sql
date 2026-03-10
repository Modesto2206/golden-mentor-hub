
-- Drop all existing restrictive policies on sales
DROP POLICY IF EXISTS "Admins can create sales for anyone" ON public.sales;
DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can update any sale" ON public.sales;
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Vendedores can create their own sales" ON public.sales;
DROP POLICY IF EXISTS "Vendedores can update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Vendedores can view their own sales" ON public.sales;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can view all sales" ON public.sales
  FOR SELECT TO authenticated
  USING (
    (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin()
  );

CREATE POLICY "Vendedores can view their own sales" ON public.sales
  FOR SELECT TO authenticated
  USING (
    auth.uid() = seller_id AND company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Admins can create sales for anyone" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (
    (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin()
  );

CREATE POLICY "Vendedores can create their own sales" ON public.sales
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = seller_id AND is_vendedor() AND company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Admins can update any sale" ON public.sales
  FOR UPDATE TO authenticated
  USING (
    (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin()
  );

CREATE POLICY "Vendedores can update their own sales" ON public.sales
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = seller_id AND is_vendedor() AND company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "Admins can delete sales" ON public.sales
  FOR DELETE TO authenticated
  USING (
    (is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin()
  );
