
-- Create seller_commissions table for progressive commission tracking
CREATE TABLE public.seller_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  month_reference DATE NOT NULL, -- first day of the month
  total_volume NUMERIC NOT NULL DEFAULT 0,
  applied_rate NUMERIC NOT NULL DEFAULT 0,
  commission_value NUMERIC NOT NULL DEFAULT 0,
  celebrated_ranges JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Composite index for fast lookups
CREATE UNIQUE INDEX idx_seller_commissions_unique ON public.seller_commissions (company_id, seller_id, month_reference);
CREATE INDEX idx_seller_commissions_seller ON public.seller_commissions (seller_id, month_reference);

-- Enable RLS
ALTER TABLE public.seller_commissions ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own commissions
CREATE POLICY "Sellers can view own commissions"
ON public.seller_commissions
FOR SELECT
USING (seller_id = auth.uid() OR is_admin() OR is_super_admin());

-- Only system/admin can insert/update (via edge function)
CREATE POLICY "Admins can manage seller commissions"
ON public.seller_commissions
FOR ALL
USING (is_admin() OR is_super_admin());

-- Add suspended_at and suspended_by to companies for audit logging
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS suspended_by UUID;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Trigger for updated_at
CREATE TRIGGER update_seller_commissions_updated_at
BEFORE UPDATE ON public.seller_commissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
