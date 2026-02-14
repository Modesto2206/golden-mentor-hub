
-- Update proposals RLS to use has_permission for granular permission control

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Sellers can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Sellers can update own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view company proposals" ON public.proposals;

-- SELECT: users with 'view' permission on 'propostas' can see company proposals
CREATE POLICY "Users can view proposals"
ON public.proposals FOR SELECT
USING (
  has_permission(auth.uid(), 'propostas', 'view')
  AND (
    company_id = get_user_company_id(auth.uid())
    OR is_super_admin()
  )
);

-- INSERT: users with 'create' permission on 'propostas'
CREATE POLICY "Users can create proposals"
ON public.proposals FOR INSERT
WITH CHECK (
  has_permission(auth.uid(), 'propostas', 'create')
  AND (
    company_id = get_user_company_id(auth.uid())
    OR is_super_admin()
  )
  AND seller_id = auth.uid()
);

-- UPDATE: users with 'update' permission (own proposals for vendedor, all for admin)
CREATE POLICY "Users can update proposals"
ON public.proposals FOR UPDATE
USING (
  has_permission(auth.uid(), 'propostas', 'update')
  AND (
    seller_id = auth.uid()
    OR is_admin()
    OR is_super_admin()
  )
);

-- DELETE: users with 'delete' permission on 'propostas'
CREATE POLICY "Users can delete proposals"
ON public.proposals FOR DELETE
USING (
  has_permission(auth.uid(), 'propostas', 'delete')
  AND (
    company_id = get_user_company_id(auth.uid())
    OR is_super_admin()
  )
);

-- Also add 'usuarios' permissions for admin roles to manage collaborators
INSERT INTO public.role_permissions (role, resource, action)
SELECT r.role, 'usuarios'::app_resource, a.action
FROM (VALUES ('administrador'::app_role), ('raiz'::app_role), ('admin_global'::app_role), ('admin_empresa'::app_role)) AS r(role)
CROSS JOIN (VALUES ('view'::app_action), ('create'::app_action), ('update'::app_action), ('delete'::app_action)) AS a(action)
ON CONFLICT DO NOTHING;
