
-- =============================================
-- FASE 1B: Funções + Seed de permissões
-- =============================================

-- 1. Função para verificar se é super admin (raiz ou admin_global)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('raiz', 'admin_global')
  )
$$;

-- 2. Função para verificar permissão granular
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _resource app_resource, _action app_action)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.resource = _resource
      AND rp.action = _action
  )
$$;

-- 3. Função para obter company_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 4. Seed de permissões padrão

-- Raiz: tudo
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'raiz', r, a
FROM unnest(enum_range(NULL::app_resource)) r,
     unnest(enum_range(NULL::app_action)) a
ON CONFLICT DO NOTHING;

-- Admin Global: tudo
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'admin_global', r, a
FROM unnest(enum_range(NULL::app_resource)) r,
     unnest(enum_range(NULL::app_action)) a
ON CONFLICT DO NOTHING;

-- Administrador (legado): tudo
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'administrador', r, a
FROM unnest(enum_range(NULL::app_resource)) r,
     unnest(enum_range(NULL::app_action)) a
ON CONFLICT DO NOTHING;

-- Admin Empresa: tudo exceto empresas e integrações
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'admin_empresa', r, a
FROM unnest(enum_range(NULL::app_resource)) r,
     unnest(enum_range(NULL::app_action)) a
WHERE r NOT IN ('empresas', 'integracoes')
ON CONFLICT DO NOTHING;

-- Gerente
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'gerente', r, a
FROM unnest(ARRAY['clientes', 'propostas', 'comissoes', 'metas', 'tarefas', 'relatorios', 'usuarios']::app_resource[]) r,
     unnest(ARRAY['view', 'create', 'update']::app_action[]) a
ON CONFLICT DO NOTHING;

-- Vendedor
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'vendedor', r, a
FROM unnest(ARRAY['clientes', 'propostas']::app_resource[]) r,
     unnest(ARRAY['view', 'create', 'update']::app_action[]) a
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, action)
SELECT 'vendedor', r, 'view'
FROM unnest(ARRAY['bancos', 'produtos', 'metas', 'comissoes', 'tarefas']::app_resource[]) r
ON CONFLICT DO NOTHING;

-- Auditor: view em tudo
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'auditor', r, 'view'
FROM unnest(enum_range(NULL::app_resource)) r
ON CONFLICT DO NOTHING;

-- Compliance
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'compliance', r, 'view'
FROM unnest(ARRAY['clientes', 'propostas', 'auditoria', 'relatorios', 'configuracoes']::app_resource[]) r
ON CONFLICT DO NOTHING;

-- Financeiro
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'financeiro', r, a
FROM unnest(ARRAY['comissoes']::app_resource[]) r,
     unnest(ARRAY['view', 'create', 'update']::app_action[]) a
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, action)
SELECT 'financeiro', r, 'view'
FROM unnest(ARRAY['propostas', 'relatorios', 'metas']::app_resource[]) r
ON CONFLICT DO NOTHING;

-- Operações
INSERT INTO public.role_permissions (role, resource, action)
SELECT 'operacoes', r, a
FROM unnest(ARRAY['propostas']::app_resource[]) r,
     unnest(ARRAY['view', 'create', 'update']::app_action[]) a
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, resource, action)
SELECT 'operacoes', r, 'view'
FROM unnest(ARRAY['clientes', 'bancos', 'produtos', 'contratos_portabilidade', 'tarefas']::app_resource[]) r
ON CONFLICT DO NOTHING;
