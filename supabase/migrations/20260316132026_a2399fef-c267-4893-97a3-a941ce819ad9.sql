
-- Create leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  cpf text,
  phone text,
  email text,
  source text DEFAULT 'manual',
  city text,
  state text,
  notes text,
  pipeline_stage text NOT NULL DEFAULT 'lead',
  converted_to_client boolean NOT NULL DEFAULT false,
  converted_client_id uuid REFERENCES public.clients(id),
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create pipeline_history table
CREATE TABLE public.pipeline_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  previous_stage text,
  new_stage text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_company_id ON public.leads(company_id);
CREATE INDEX idx_leads_pipeline_stage ON public.leads(company_id, pipeline_stage);
CREATE INDEX idx_leads_created_at ON public.leads(company_id, created_at);
CREATE INDEX idx_pipeline_history_entity ON public.pipeline_history(entity_id);
CREATE INDEX idx_pipeline_history_company ON public.pipeline_history(company_id);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_history ENABLE ROW LEVEL SECURITY;

-- Leads RLS policies
CREATE POLICY "Users can view leads of their company"
  ON public.leads FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Users can create leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update leads of their company"
  ON public.leads FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING ((is_admin() AND company_id = get_user_company_id(auth.uid())) OR is_super_admin());

-- Pipeline history RLS policies
CREATE POLICY "Users can view pipeline history"
  ON public.pipeline_history FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Users can insert pipeline history"
  ON public.pipeline_history FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Updated_at trigger for leads
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
