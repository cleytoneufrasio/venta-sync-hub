-- Fix security linter: set search_path for functions

-- 1) update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2) handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- 3) create_default_payment_methods
CREATE OR REPLACE FUNCTION public.create_default_payment_methods()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.payment_methods (user_id, name) VALUES
  (NEW.user_id, 'Efectivo'),
  (NEW.user_id, 'Tarjeta de Crédito'),
  (NEW.user_id, 'Tarjeta de Débito'),
  (NEW.user_id, 'Transferencia');

  INSERT INTO public.expense_categories (user_id, name, description) VALUES
  (NEW.user_id, 'Gastos Generales', 'Gastos operativos generales'),
  (NEW.user_id, 'Marketing', 'Gastos de marketing y publicidad'),
  (NEW.user_id, 'Compras', 'Compra de productos e inventario'),
  (NEW.user_id, 'Servicios', 'Servicios externos y profesionales');

  RETURN NEW;
END;
$$;