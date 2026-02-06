
-- Create operation_type enum
CREATE TYPE public.operation_type AS ENUM ('Novo', 'Refinanciamento', 'Compra de Dívida', 'Saque FGTS', 'Portabilidade');

-- Add operation_type and financial_institution columns to sales
ALTER TABLE public.sales 
  ADD COLUMN operation_type public.operation_type DEFAULT NULL,
  ADD COLUMN financial_institution TEXT DEFAULT NULL;
