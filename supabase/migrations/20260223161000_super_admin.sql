
-- 1. Add 'admin' to app_role enum (Note: Postgres doesn't allow ALTER TYPE ... ADD VALUE in transactions easily, but we'll try or use a workaround if needed)
-- Since we are running this in a fresh environment or as a migration:
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- 2. Update RLS policies for global admin access

-- Profiles
CREATE POLICY "Admins can do everything on profiles" ON public.profiles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Condominios
CREATE POLICY "Admins can do everything on condominios" ON public.condominios
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Condominio Acessos
CREATE POLICY "Admins can do everything on access" ON public.condominio_acessos
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Obrigacoes
CREATE POLICY "Admins can do everything on obrigacoes" ON public.obrigacoes
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Documentos
CREATE POLICY "Admins can do everything on documentos" ON public.documentos
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tarefas Check-in
CREATE POLICY "Admins can do everything on tarefas" ON public.tarefas_checkin
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Execuçoes Check-in
CREATE POLICY "Admins can do everything on execucoes" ON public.execucoes_checkin
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Notificações
CREATE POLICY "Admins can do everything on notifications" ON public.notificacoes
FOR ALL USING (public.has_role(auth.uid(), 'admin'));
