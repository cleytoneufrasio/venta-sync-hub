-- Ensure helper functions exist
CREATE OR REPLACE FUNCTION public.get_current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select empresa_id
  from public.user_companies
  where user_id = auth.uid()
  order by created_at asc
  limit 1
$function$;

CREATE OR REPLACE FUNCTION public.populate_empresa_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if new.empresa_id is null then
    new.empresa_id := public.get_current_empresa_id();
  end if;
  return new;
end;
$function$;

-- Recreate RLS policies to ensure correct access control
-- user_companies
DROP POLICY IF EXISTS "Users manage their own user_companies" ON public.user_companies;
CREATE POLICY "Users manage their own user_companies"
ON public.user_companies
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso por empresa" ON public.clientes;
CREATE POLICY "Acesso por empresa"
ON public.clientes
FOR ALL
USING (empresa_id = public.get_current_empresa_id())
WITH CHECK (empresa_id = public.get_current_empresa_id());

-- produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso por empresa" ON public.produtos;
CREATE POLICY "Acesso por empresa"
ON public.produtos
FOR ALL
USING (empresa_id = public.get_current_empresa_id())
WITH CHECK (empresa_id = public.get_current_empresa_id());

-- vendas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso por empresa" ON public.vendas;
CREATE POLICY "Acesso por empresa"
ON public.vendas
FOR ALL
USING (empresa_id = public.get_current_empresa_id())
WITH CHECK (empresa_id = public.get_current_empresa_id());

-- Create triggers to auto-populate empresa_id on insert
DO $$
BEGIN
  -- clientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'populate_empresa_id_on_clientes'
  ) THEN
    CREATE TRIGGER populate_empresa_id_on_clientes
    BEFORE INSERT ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_empresa_id();
  END IF;

  -- produtos
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'populate_empresa_id_on_produtos'
  ) THEN
    CREATE TRIGGER populate_empresa_id_on_produtos
    BEFORE INSERT ON public.produtos
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_empresa_id();
  END IF;

  -- vendas
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'populate_empresa_id_on_vendas'
  ) THEN
    CREATE TRIGGER populate_empresa_id_on_vendas
    BEFORE INSERT ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_empresa_id();
  END IF;

  -- contas_pagar
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'populate_empresa_id_on_contas_pagar'
  ) THEN
    CREATE TRIGGER populate_empresa_id_on_contas_pagar
    BEFORE INSERT ON public.contas_pagar
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_empresa_id();
  END IF;

  -- contas_receber
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'populate_empresa_id_on_contas_receber'
  ) THEN
    CREATE TRIGGER populate_empresa_id_on_contas_receber
    BEFORE INSERT ON public.contas_receber
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_empresa_id();
  END IF;

  -- itens_venda
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'populate_empresa_id_on_itens_venda'
  ) THEN
    CREATE TRIGGER populate_empresa_id_on_itens_venda
    BEFORE INSERT ON public.itens_venda
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_empresa_id();
  END IF;
END
$$;