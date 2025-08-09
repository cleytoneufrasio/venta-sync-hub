-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  plano TEXT DEFAULT 'basico' CHECK (plano IN ('basico', 'premium', 'enterprise')),
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Criar tabela de usuários da empresa
CREATE TABLE public.usuarios_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  papel TEXT DEFAULT 'usuario' CHECK (papel IN ('admin', 'gerente', 'usuario')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

-- Habilitar RLS na tabela usuarios_empresa
ALTER TABLE public.usuarios_empresa ENABLE ROW LEVEL SECURITY;

-- Adicionar empresa_id nas tabelas existentes
ALTER TABLE public.clientes ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.produtos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.categorias ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.fornecedores ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.vendas ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.contas_receber ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.contas_pagar ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Função para obter empresa_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID AS $$
  SELECT empresa_id FROM public.usuarios_empresa 
  WHERE user_id = auth.uid() AND ativo = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Função para verificar se usuário é admin da empresa
CREATE OR REPLACE FUNCTION public.is_empresa_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND papel = 'admin' 
    AND ativo = true
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Função para criar empresa e associar usuário como admin
CREATE OR REPLACE FUNCTION public.criar_empresa_e_associar_usuario(
  p_nome TEXT,
  p_cnpj TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_telefone TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  nova_empresa_id UUID;
BEGIN
  -- Criar a empresa
  INSERT INTO public.empresas (nome, cnpj, email, telefone, endereco)
  VALUES (p_nome, p_cnpj, p_email, p_telefone, p_endereco)
  RETURNING id INTO nova_empresa_id;
  
  -- Associar o usuário atual como admin da empresa
  INSERT INTO public.usuarios_empresa (user_id, empresa_id, papel)
  VALUES (auth.uid(), nova_empresa_id, 'admin');
  
  RETURN nova_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para empresas
CREATE POLICY "Usuários podem ver empresas que pertencem" 
ON public.empresas FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND empresa_id = empresas.id 
    AND ativo = true
  )
);

CREATE POLICY "Admins podem atualizar sua empresa" 
ON public.empresas FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND empresa_id = empresas.id 
    AND papel = 'admin' 
    AND ativo = true
  )
);

-- Políticas RLS para usuarios_empresa
CREATE POLICY "Usuários podem ver membros de suas empresas" 
ON public.usuarios_empresa FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_empresa ue2
    WHERE ue2.user_id = auth.uid() 
    AND ue2.empresa_id = usuarios_empresa.empresa_id 
    AND ue2.ativo = true
  )
);

CREATE POLICY "Admins podem gerenciar usuários da empresa" 
ON public.usuarios_empresa FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_empresa ue2
    WHERE ue2.user_id = auth.uid() 
    AND ue2.empresa_id = usuarios_empresa.empresa_id 
    AND ue2.papel = 'admin' 
    AND ue2.ativo = true
  )
);

-- Atualizar políticas RLS das tabelas existentes para usar empresa_id

-- Clientes
DROP POLICY IF EXISTS "Usuários podem ver seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios clientes" ON public.clientes;

CREATE POLICY "Usuários podem ver clientes da empresa" 
ON public.clientes FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir clientes da empresa" 
ON public.clientes FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar clientes da empresa" 
ON public.clientes FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar clientes da empresa" 
ON public.clientes FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Produtos
DROP POLICY IF EXISTS "Usuários podem ver seus próprios produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios produtos" ON public.produtos;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios produtos" ON public.produtos;

CREATE POLICY "Usuários podem ver produtos da empresa" 
ON public.produtos FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir produtos da empresa" 
ON public.produtos FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar produtos da empresa" 
ON public.produtos FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar produtos da empresa" 
ON public.produtos FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Categorias
DROP POLICY IF EXISTS "Usuários podem ver suas próprias categorias" ON public.categorias;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias categorias" ON public.categorias;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias categorias" ON public.categorias;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias categorias" ON public.categorias;

CREATE POLICY "Usuários podem ver categorias da empresa" 
ON public.categorias FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir categorias da empresa" 
ON public.categorias FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar categorias da empresa" 
ON public.categorias FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar categorias da empresa" 
ON public.categorias FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Fornecedores
DROP POLICY IF EXISTS "Usuários podem ver seus próprios fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios fornecedores" ON public.fornecedores;

CREATE POLICY "Usuários podem ver fornecedores da empresa" 
ON public.fornecedores FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir fornecedores da empresa" 
ON public.fornecedores FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar fornecedores da empresa" 
ON public.fornecedores FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar fornecedores da empresa" 
ON public.fornecedores FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Vendas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias vendas" ON public.vendas;

CREATE POLICY "Usuários podem ver vendas da empresa" 
ON public.vendas FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir vendas da empresa" 
ON public.vendas FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar vendas da empresa" 
ON public.vendas FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar vendas da empresa" 
ON public.vendas FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Contas a Receber
DROP POLICY IF EXISTS "Usuários podem ver suas próprias contas a receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias contas a receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias contas a receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias contas a receber" ON public.contas_receber;

CREATE POLICY "Usuários podem ver contas a receber da empresa" 
ON public.contas_receber FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir contas a receber da empresa" 
ON public.contas_receber FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar contas a receber da empresa" 
ON public.contas_receber FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar contas a receber da empresa" 
ON public.contas_receber FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Contas a Pagar
DROP POLICY IF EXISTS "Usuários podem ver suas próprias contas a pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias contas a pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias contas a pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias contas a pagar" ON public.contas_pagar;

CREATE POLICY "Usuários podem ver contas a pagar da empresa" 
ON public.contas_pagar FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir contas a pagar da empresa" 
ON public.contas_pagar FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar contas a pagar da empresa" 
ON public.contas_pagar FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar contas a pagar da empresa" 
ON public.contas_pagar FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Trigger para atualizar updated_at na tabela empresas
CREATE TRIGGER update_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();