CREATE POLICY "Users can update own attachments or admins"
ON public.client_attachments
FOR UPDATE
TO authenticated
USING (
  (uploaded_by = auth.uid() AND company_id = get_user_company_id(auth.uid()))
  OR (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
)
WITH CHECK (
  (uploaded_by = auth.uid() AND company_id = get_user_company_id(auth.uid()))
  OR (is_admin() AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin()
);