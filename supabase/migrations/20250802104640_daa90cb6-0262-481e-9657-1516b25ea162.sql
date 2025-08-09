-- Tornar o campo email opcional na tabela clientes
ALTER TABLE public.clientes 
ALTER COLUMN email DROP NOT NULL;