
-- Create company_goals table for global company goals
CREATE TABLE IF NOT EXISTS public.company_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  goal_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, month, year)
);

-- Enable RLS
ALTER TABLE public.company_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view company goals" ON public.company_goals
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Admins can manage company goals" ON public.company_goals
  FOR ALL TO authenticated
  USING (is_admin() OR is_super_admin());

-- Index
CREATE INDEX IF NOT EXISTS idx_company_goals_lookup ON public.company_goals(company_id, month, year);

-- Trigger for updated_at
CREATE TRIGGER handle_company_goals_updated_at
  BEFORE UPDATE ON public.company_goals
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
