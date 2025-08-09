-- Atualiza nomes padrão para PT-BR ao criar novos perfis
CREATE OR REPLACE FUNCTION public.create_default_payment_methods()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Métodos de pagamento (PT-BR)
  INSERT INTO public.payment_methods (user_id, name) VALUES
  (NEW.user_id, 'Dinheiro'),
  (NEW.user_id, 'Cartão de Crédito'),
  (NEW.user_id, 'Cartão de Débito'),
  (NEW.user_id, 'Transferência');

  -- Categorias de despesas (PT-BR)
  INSERT INTO public.expense_categories (user_id, name, description) VALUES
  (NEW.user_id, 'Despesas gerais', 'Despesas operacionais gerais'),
  (NEW.user_id, 'Marketing', 'Despesas de marketing e publicidade'),
  (NEW.user_id, 'Compras', 'Compra de produtos e estoque'),
  (NEW.user_id, 'Serviços', 'Serviços externos e profissionais');

  RETURN NEW;
END;
$$;