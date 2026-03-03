
-- 1. Create company_billing table
CREATE TABLE public.company_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'basico',
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Add cancelled_at to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 3. Enable RLS
ALTER TABLE public.company_billing ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Super admins can manage billing" ON public.company_billing
  FOR ALL TO authenticated
  USING (is_super_admin());

CREATE POLICY "Admins can view own billing" ON public.company_billing
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

-- 5. Index
CREATE INDEX idx_company_billing_company_id ON public.company_billing(company_id);
CREATE INDEX idx_company_billing_status ON public.company_billing(status);
CREATE INDEX idx_company_billing_due_date ON public.company_billing(due_date);
