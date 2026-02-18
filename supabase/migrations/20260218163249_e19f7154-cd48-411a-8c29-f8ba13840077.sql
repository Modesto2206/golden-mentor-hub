
-- Tabela de configurações visuais por empresa
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  primary_color text DEFAULT '#FFBC00',
  secondary_color text DEFAULT '#1a1a2e',
  accent_color text DEFAULT '#FFBC00',
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar configurações da empresa
CREATE POLICY "Admins can manage company settings"
  ON public.company_settings FOR ALL
  USING (is_admin() OR is_super_admin());

-- Qualquer usuário autenticado pode ver as configurações da sua empresa
CREATE POLICY "Users can view own company settings"
  ON public.company_settings FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- Trigger de updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Storage bucket para logos de empresas
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- Políticas de storage para logos
CREATE POLICY "Anyone can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can upload company logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update company logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete company logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
