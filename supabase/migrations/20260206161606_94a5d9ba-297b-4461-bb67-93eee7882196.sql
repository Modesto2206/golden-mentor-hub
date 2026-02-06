
-- 1) Drop existing CHECK constraint that conflicts
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_commission_percentage_check;

-- 2) Drop the generated column
ALTER TABLE public.sales DROP COLUMN IF EXISTS commission_value;

-- 3) Change commission_percentage to generic NUMERIC
ALTER TABLE public.sales 
  ALTER COLUMN commission_percentage TYPE NUMERIC USING commission_percentage::NUMERIC;

-- 4) Normalize existing data: divide values > 1 by 100 to get 0-1 range
UPDATE public.sales 
SET commission_percentage = commission_percentage / 100.0
WHERE commission_percentage > 1;

-- 5) Now safely narrow to NUMERIC(5,4)
ALTER TABLE public.sales 
  ALTER COLUMN commission_percentage TYPE NUMERIC(5,4);

-- 6) Add commission_value back as a regular column
ALTER TABLE public.sales 
  ADD COLUMN commission_value NUMERIC;

-- 7) Create a validation trigger for commission_percentage (0 to 1 range)
CREATE OR REPLACE FUNCTION public.validate_commission_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.commission_percentage < 0 OR NEW.commission_percentage > 1 THEN
    RAISE EXCEPTION 'commission_percentage must be between 0 and 1, got %', NEW.commission_percentage;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_sales_commission
  BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_commission_percentage();

-- 8) Create a trigger to auto-calculate commission_value
CREATE OR REPLACE FUNCTION public.calculate_commission_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.commission_value := NEW.released_value * NEW.commission_percentage;
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_sales_commission_value
  BEFORE INSERT OR UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_commission_value();

-- 9) Recalculate commission_value for all existing rows  
UPDATE public.sales
SET commission_value = released_value * commission_percentage;

-- 10) Add DELETE policy for user_roles so admins can remove roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (is_admin());
