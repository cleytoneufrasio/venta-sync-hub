-- Remover políticas problemáticas da tabela usuarios_empresa
DROP POLICY IF EXISTS "Usuários podem ver membros de suas empresas" ON public.usuarios_empresa;
DROP POLICY IF EXISTS "Admins podem gerenciar usuários da empresa" ON public.usuarios_empresa;

-- Criar função de segurança para verificar se o usuário tem acesso à empresa
CREATE OR REPLACE FUNCTION public.user_has_empresa_access(empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND empresa_id = $1 
    AND ativo = true
  );
$$;

-- Criar função para verificar se o usuário é admin da empresa
CREATE OR REPLACE FUNCTION public.user_is_empresa_admin(empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND empresa_id = $1 
    AND papel = 'admin' 
    AND ativo = true
  );
$$;

-- Novas políticas RLS sem recursão
CREATE POLICY "Usuários podem ver suas próprias associações empresa"
ON public.usuarios_empresa
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Usuários podem inserir suas próprias associações"
ON public.usuarios_empresa
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins podem atualizar associações da empresa"
ON public.usuarios_empresa
FOR UPDATE
USING (user_is_empresa_admin(empresa_id));

CREATE POLICY "Admins podem deletar associações da empresa"
ON public.usuarios_empresa
FOR DELETE
USING (user_is_empresa_admin(empresa_id));