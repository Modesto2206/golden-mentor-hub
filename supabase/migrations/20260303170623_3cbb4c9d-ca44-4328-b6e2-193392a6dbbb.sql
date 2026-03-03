
DROP POLICY IF EXISTS "Admins can manage goals" ON public.monthly_goals;

CREATE POLICY "Admins can manage goals"
ON public.monthly_goals
FOR ALL
TO authenticated
USING (is_admin() OR is_super_admin())
WITH CHECK (is_admin() OR is_super_admin());
