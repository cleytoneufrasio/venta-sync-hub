-- Add payment method and payment conditions to vendas table
ALTER TABLE public.vendas 
ADD COLUMN forma_pagamento TEXT DEFAULT 'pix' CHECK (forma_pagamento IN ('pix', 'credito', 'debito', 'prazo')),
ADD COLUMN condicoes_pagamento TEXT,
ADD COLUMN data_vencimento DATE;