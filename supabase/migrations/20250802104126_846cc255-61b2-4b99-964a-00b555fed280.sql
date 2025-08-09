-- Fix status constraint for contas_receber to use 'paga' instead of 'pago'
ALTER TABLE public.contas_receber 
DROP CONSTRAINT IF EXISTS contas_receber_status_check;

ALTER TABLE public.contas_receber 
ADD CONSTRAINT contas_receber_status_check 
CHECK (status IN ('pendente', 'paga'));

-- Fix status constraint for contas_pagar to use 'paga' instead of 'pago' for consistency
ALTER TABLE public.contas_pagar 
DROP CONSTRAINT IF EXISTS contas_pagar_status_check;

ALTER TABLE public.contas_pagar 
ADD CONSTRAINT contas_pagar_status_check 
CHECK (status IN ('pendente', 'paga'));