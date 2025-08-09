-- 1) Tabela de vínculo usuário-empresa
create table if not exists public.user_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  is_owner boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, empresa_id)
);

alter table public.user_companies enable row level security;

create policy if not exists "Users manage their own user_companies"
on public.user_companies
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2) Função para obter a empresa atual do usuário autenticado
create or replace function public.get_current_empresa_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select empresa_id
  from public.user_companies
  where user_id = auth.uid()
  order by created_at asc
  limit 1
$$;

-- 3) Função e triggers para preencher empresa_id automaticamente
create or replace function public.populate_empresa_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.empresa_id is null then
    new.empresa_id := public.get_current_empresa_id();
  end if;
  return new;
end;
$$;

-- Atualiza as RLS para usar a função em clientes/produtos/vendas
-- clientes
drop policy if exists "Acesso por empresa" on public.clientes;
create policy "Acesso por empresa"
on public.clientes
for all
using (empresa_id = public.get_current_empresa_id())
with check (empresa_id = public.get_current_empresa_id());

-- produtos
drop policy if exists "Acesso por empresa" on public.produtos;
create policy "Acesso por empresa"
on public.produtos
for all
using (empresa_id = public.get_current_empresa_id())
with check (empresa_id = public.get_current_empresa_id());

-- vendas
drop policy if exists "Acesso por empresa" on public.vendas;
create policy "Acesso por empresa"
on public.vendas
for all
using (empresa_id = public.get_current_empresa_id())
with check (empresa_id = public.get_current_empresa_id());

-- Triggers para preencher empresa_id
drop trigger if exists set_clientes_empresa on public.clientes;
create trigger set_clientes_empresa
before insert on public.clientes
for each row execute function public.populate_empresa_id();

drop trigger if exists set_produtos_empresa on public.produtos;
create trigger set_produtos_empresa
before insert on public.produtos
for each row execute function public.populate_empresa_id();

drop trigger if exists set_vendas_empresa on public.vendas;
create trigger set_vendas_empresa
before insert on public.vendas
for each row execute function public.populate_empresa_id();

-- 4) Criar empresa automaticamente ao criar usuário e vincular
create or replace function public.handle_new_user_company()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_nome text;
begin
  -- Determina um nome padrão
  v_nome := coalesce(
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  insert into public.empresas (nome, cnpj)
  values (coalesce(v_nome, 'Minha Empresa'), null)
  returning id into v_empresa_id;

  insert into public.user_companies (user_id, empresa_id, is_owner)
  values (NEW.id, v_empresa_id, true)
  on conflict (user_id, empresa_id) do nothing;

  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created_company on auth.users;
create trigger on_auth_user_created_company
after insert on auth.users
for each row execute function public.handle_new_user_company();