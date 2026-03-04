
ALTER TABLE public.monthly_goals DROP CONSTRAINT IF EXISTS monthly_goals_month_year_key;
ALTER TABLE public.monthly_goals ADD CONSTRAINT monthly_goals_company_month_year_key UNIQUE (company_id, month, year);
