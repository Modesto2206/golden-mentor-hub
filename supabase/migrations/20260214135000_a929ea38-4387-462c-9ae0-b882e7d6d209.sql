
-- Add missing fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS plano text DEFAULT 'basico',
ADD COLUMN IF NOT EXISTS responsavel text;

-- Create store_products table for per-company store
CREATE TABLE public.store_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view store products of their company"
ON public.store_products FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) OR is_super_admin());

CREATE POLICY "Admins can manage store products"
ON public.store_products FOR ALL
USING (is_admin() OR is_super_admin());

CREATE TRIGGER update_store_products_updated_at
BEFORE UPDATE ON public.store_products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for store_products
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_products;
