
-- =============================================
-- FASE 1A: Estrutura base + enum expansion
-- =============================================

-- 1. Criar tabela de empresas
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Expandir enum de roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'raiz';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_global';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_empresa';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'auditor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operacoes';

-- 3. Criar enums para recursos e ações
CREATE TYPE public.app_resource AS ENUM (
  'empresas', 'usuarios', 'credenciais_api', 'bancos', 'produtos',
  'clientes', 'propostas', 'contratos_portabilidade', 'comissoes',
  'metas', 'relatorios', 'auditoria', 'tarefas', 'integracoes', 'configuracoes'
);

CREATE TYPE public.app_action AS ENUM ('view', 'create', 'update', 'delete');

-- 4. Tabela de permissões por role
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  resource public.app_resource NOT NULL,
  action public.app_action NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, resource, action)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Tabela de audit logs (imutável)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Adicionar company_id nas tabelas existentes
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.sales ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.monthly_goals ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.user_roles ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- 7. Criar empresa padrão e associar dados existentes
INSERT INTO public.companies (id, name, cnpj) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Cred+ (Padrão)', NULL);

UPDATE public.profiles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.sales SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.monthly_goals SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.user_roles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;

-- 8. RLS básica para companies (usando funções existentes por enquanto)
CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated can view companies"
  ON public.companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 9. RLS para role_permissions
CREATE POLICY "Authenticated can view permissions"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage permissions"
  ON public.role_permissions FOR ALL
  USING (public.is_admin());

-- 10. RLS para audit_logs
CREATE POLICY "Authenticated can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());
