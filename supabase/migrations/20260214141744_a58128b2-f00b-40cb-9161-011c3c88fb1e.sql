
-- Fix companies RLS to include super_admin roles
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
CREATE POLICY "Admins can manage companies" ON public.companies
FOR ALL USING (is_admin() OR is_super_admin());
