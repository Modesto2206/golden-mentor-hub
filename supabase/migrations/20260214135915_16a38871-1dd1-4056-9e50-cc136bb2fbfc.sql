
-- Fix sales RLS policies to include super_admin (raiz/admin_global)
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;
CREATE POLICY "Admins can view all sales" ON public.sales FOR SELECT USING (is_admin() OR is_super_admin());

DROP POLICY IF EXISTS "Admins can update any sale" ON public.sales;
CREATE POLICY "Admins can update any sale" ON public.sales FOR UPDATE USING (is_admin() OR is_super_admin());

DROP POLICY IF EXISTS "Admins can delete sales" ON public.sales;
CREATE POLICY "Admins can delete sales" ON public.sales FOR DELETE USING (is_admin() OR is_super_admin());

DROP POLICY IF EXISTS "Admins can create sales for anyone" ON public.sales;
CREATE POLICY "Admins can create sales for anyone" ON public.sales FOR INSERT WITH CHECK (is_admin() OR is_super_admin());
