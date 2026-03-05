
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage goals" ON public.monthly_goals;
DROP POLICY IF EXISTS "Authenticated users can view goals" ON public.monthly_goals;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage goals"
  ON public.monthly_goals
  FOR ALL
  TO authenticated
  USING (is_admin() OR is_super_admin())
  WITH CHECK (is_admin() OR is_super_admin());

CREATE POLICY "Authenticated users can view goals"
  ON public.monthly_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
