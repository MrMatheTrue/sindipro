-- REPARAR SISTEMA DE ADMIN E CADASTRO (SINDIPRO)
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. ADICIONAR ROLE 'admin' AO ENUM (COM TRATAMENTO DE ERRO)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'admin') THEN
        ALTER TYPE public.app_role ADD VALUE 'admin';
    END IF;
END
$$;

-- 2. TORNAR O GATILHO DE CADASTRO MAIS ROBUSTO (Resolve erro de registro)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insere no perfil, se já existir apenas ignora ou atualiza
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- Insere a role de sindico por padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sindico')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. REINSTRUTURAR POLÍTICAS RLS PARA PERMISSÃO TOTAL DO ADMIN
-- Remove políticas antigas se existirem para evitar duplicidade
DO $$
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
    CREATE POLICY "Admins can do everything on profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    
    -- Condominios
    DROP POLICY IF EXISTS "Admins can do everything on condominios" ON public.condominios;
    CREATE POLICY "Admins can do everything on condominios" ON public.condominios FOR ALL USING (public.has_role(auth.uid(), 'admin'));
    
    -- User Roles
    DROP POLICY IF EXISTS "Admins can do everything on roles" ON public.user_roles;
    CREATE POLICY "Admins can do everything on roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- 4. VINCULAR O USUÁRIO admin@admin.com À ROLE ADMIN (Se ele já existir)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@admin.com' LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
        -- Garantir que ele tenha a role admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Garantir que ele tenha um perfil
        INSERT INTO public.profiles (id, full_name, email)
        VALUES (admin_id, 'Super Admin Sindipro', 'admin@admin.com')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
