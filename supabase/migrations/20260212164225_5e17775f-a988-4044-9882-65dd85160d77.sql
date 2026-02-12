
-- =============================================
-- FASE 2: Bancos + Produtos
-- =============================================

-- Modalidades
CREATE TYPE public.loan_modality AS ENUM (
  'margem_livre', 'portabilidade', 'port_refinanciamento', 
  'cartao_consignado', 'fgts_antecipacao', 'credito_trabalhador'
);

-- Convênios expandido
CREATE TYPE public.covenant AS ENUM ('INSS', 'SIAPE', 'CLT', 'OUTROS');

-- Bancos
CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_banks_updated_at BEFORE UPDATE ON public.banks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view banks of their company" ON public.banks FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Admins can manage banks" ON public.banks FOR ALL USING (public.is_admin() OR public.is_super_admin());

-- Produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  bank_id UUID REFERENCES public.banks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  modality public.loan_modality NOT NULL,
  covenant public.covenant NOT NULL,
  min_rate NUMERIC,
  max_rate NUMERIC,
  min_term INTEGER,
  max_term INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view products" ON public.products FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin() OR public.is_super_admin());

-- Credenciais de API
CREATE TABLE public.api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  bank_id UUID REFERENCES public.banks(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  credential_type TEXT NOT NULL DEFAULT 'api_key',
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_api_credentials_updated_at BEFORE UPDATE ON public.api_credentials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- View pública sem expor dados sensíveis
CREATE POLICY "Admins can manage credentials" ON public.api_credentials FOR ALL USING (public.is_admin() OR public.is_super_admin());
CREATE POLICY "Users can view credential names" ON public.api_credentials FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

-- =============================================
-- FASE 3: Clientes
-- =============================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  birth_date DATE,
  gender TEXT,
  nationality TEXT DEFAULT 'Brasileira',
  phone TEXT,
  email TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  internal_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, cpf)
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view clients" ON public.clients FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Users can create clients" ON public.clients FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update clients" ON public.clients FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_admin());
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (public.is_admin() OR public.is_super_admin());

-- Benefícios
CREATE TABLE public.benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  benefit_number TEXT,
  benefit_type TEXT,
  covenant public.covenant,
  gross_value NUMERIC,
  net_value NUMERIC,
  available_margin NUMERIC,
  card_margin NUMERIC,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  queried_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_benefits_updated_at BEFORE UPDATE ON public.benefits FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view benefits" ON public.benefits FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Users can manage benefits" ON public.benefits FOR ALL USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_admin());

-- Consentimentos LGPD
CREATE TABLE public.consent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  consent_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  consented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consent_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view consents" ON public.consent_requests FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Users can create consents" ON public.consent_requests FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update consents" ON public.consent_requests FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));

-- =============================================
-- FASE 4: Propostas
-- =============================================

CREATE TYPE public.proposal_internal_status AS ENUM (
  'rascunho', 'pre_cadastrada', 'cadastrada', 'enviada_analise',
  'em_analise', 'pendente_formalizacao', 'pendente_assinatura',
  'aprovada', 'reprovada', 'cancelada', 'paga_liberada'
);

CREATE TYPE public.proposal_bank_status AS ENUM (
  'nao_enviado', 'recebido', 'pendente_documentos', 'pendente_assinatura',
  'em_analise', 'aprovado', 'reprovado', 'pago'
);

CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  bank_id UUID REFERENCES public.banks(id),
  product_id UUID REFERENCES public.products(id),
  seller_id UUID NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id),
  
  -- Dados da proposta
  modality public.loan_modality,
  covenant public.covenant,
  requested_value NUMERIC,
  approved_value NUMERIC,
  released_value NUMERIC,
  interest_rate NUMERIC,
  term_months INTEGER,
  installment_value NUMERIC,
  
  -- Status
  internal_status public.proposal_internal_status NOT NULL DEFAULT 'rascunho',
  bank_status public.proposal_bank_status NOT NULL DEFAULT 'nao_enviado',
  
  -- Dados bancários liberação
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  pix_key TEXT,
  
  -- External
  external_proposal_id TEXT,
  observations TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Admins can manage all proposals" ON public.proposals FOR ALL USING (public.is_admin() OR public.is_super_admin());
CREATE POLICY "Users can view company proposals" ON public.proposals FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Sellers can create proposals" ON public.proposals FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()) AND seller_id = auth.uid());
CREATE POLICY "Sellers can update own proposals" ON public.proposals FOR UPDATE USING (seller_id = auth.uid() AND company_id = public.get_user_company_id(auth.uid()));

-- Histórico de status
CREATE TABLE public.proposal_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  old_status public.proposal_internal_status,
  new_status public.proposal_internal_status NOT NULL,
  old_bank_status public.proposal_bank_status,
  new_bank_status public.proposal_bank_status,
  changed_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.proposal_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history" ON public.proposal_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_id AND p.company_id = public.get_user_company_id(auth.uid()))
);
CREATE POLICY "Authenticated can insert status history" ON public.proposal_status_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Contratos de portabilidade
CREATE TABLE public.portability_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  original_bank TEXT NOT NULL,
  contract_number TEXT NOT NULL,
  outstanding_balance NUMERIC,
  installment_value NUMERIC,
  remaining_term INTEGER,
  confirmed_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portability_contracts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_portability_contracts_updated_at BEFORE UPDATE ON public.portability_contracts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can manage portability contracts" ON public.portability_contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_id AND p.company_id = public.get_user_company_id(auth.uid()))
);

-- Simulações
CREATE TABLE public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  bank_id UUID REFERENCES public.banks(id),
  modality public.loan_modality,
  requested_value NUMERIC,
  approved_value NUMERIC,
  interest_rate NUMERIC,
  term_months INTEGER,
  installment_value NUMERIC,
  simulation_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view simulations" ON public.simulations FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Users can create simulations" ON public.simulations FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- =============================================
-- FASE 5: Comissões + Metas
-- =============================================

CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  bank_id UUID REFERENCES public.banks(id),
  modality public.loan_modality,
  covenant public.covenant,
  percentage NUMERIC NOT NULL,
  fixed_value NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON public.commission_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view commission rules" ON public.commission_rules FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Admins can manage commission rules" ON public.commission_rules FOR ALL USING (public.is_admin() OR public.is_super_admin());

CREATE TABLE public.commission_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id),
  seller_id UUID NOT NULL,
  rule_id UUID REFERENCES public.commission_rules(id),
  base_value NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  commission_value NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_entries ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_commission_entries_updated_at BEFORE UPDATE ON public.commission_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view own commissions" ON public.commission_entries FOR SELECT USING (seller_id = auth.uid() OR public.is_admin() OR public.is_super_admin());
CREATE POLICY "Admins can manage commissions" ON public.commission_entries FOR ALL USING (public.is_admin() OR public.is_super_admin());

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  seller_id UUID,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  target_proposals INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view goals" ON public.goals FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Admins can manage goals" ON public.goals FOR ALL USING (public.is_admin() OR public.is_super_admin());

-- =============================================
-- FASE 6: Tarefas + Alertas
-- =============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id),
  client_id UUID REFERENCES public.clients(id),
  assigned_to UUID,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'manual',
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'pendente',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE POLICY "Users can view tasks" ON public.tasks FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR public.is_super_admin());
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update tasks" ON public.tasks FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE USING (public.is_admin() OR public.is_super_admin());

CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id),
  client_id UUID REFERENCES public.clients(id),
  user_id UUID,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT USING (
  (user_id = auth.uid() OR user_id IS NULL) AND company_id = public.get_user_company_id(auth.uid())
);
CREATE POLICY "System can create alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can mark alerts read" ON public.alerts FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- =============================================
-- FASE 7: Integration logs
-- =============================================

CREATE TABLE public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  provider TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  status_code INTEGER,
  correlation_id UUID DEFAULT gen_random_uuid(),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view integration logs" ON public.integration_logs FOR SELECT USING (public.is_admin() OR public.is_super_admin());
CREATE POLICY "System can insert integration logs" ON public.integration_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
