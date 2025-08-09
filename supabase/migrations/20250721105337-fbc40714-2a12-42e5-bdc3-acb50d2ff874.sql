-- Criar função para atualizar estoque de produto automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_estoque_produto(
  produto_id UUID,
  quantidade_vendida INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar o estoque subtraindo a quantidade vendida
  UPDATE public.produtos
  SET estoque_atual = estoque_atual - quantidade_vendida,
      updated_at = now()
  WHERE id = produto_id;
  
  -- Verificar se o produto existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado com ID: %', produto_id;
  END IF;
END;
$$;