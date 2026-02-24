-- SINDIPRO: FULL SCHEMA UPGRADE
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. TIPOS ENUM
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'sindico', 'funcionario', 'zelador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.criticidade AS ENUM ('baixa', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.status_obrigacao AS ENUM ('em_dia', 'atencao', 'vencida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.frequencia_tarefa AS ENUM ('diaria', 'semanal', 'mensal', 'personalizada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.status_execucao AS ENUM ('pendente', 'concluida', 'nao_realizada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.perfil_operacional AS ENUM ('zelador', 'aux_manutencao', 'porteiro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.nivel_acesso AS ENUM ('total', 'leitura', 'tarefas_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_notificacao AS ENUM ('obrigacao_vencendo', 'tarefa_atrasada', 'documento_adicionado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABELAS

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure 'role' column exists (for cases where profiles already existed)
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN role public.app_role NOT NULL DEFAULT 'sindico';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Condominios
CREATE TABLE IF NOT EXISTS public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sindico_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  endereco TEXT,
  cep TEXT,
  cidade TEXT,
  estado TEXT,
  cnpj TEXT,
  numero_unidades INT DEFAULT 0,
  numero_andares INT DEFAULT 0,
  foto_capa_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Condominio Acessos
CREATE TABLE IF NOT EXISTS public.condominio_acessos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel_acesso public.nivel_acesso NOT NULL DEFAULT 'leitura',
  modulos_permitidos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(condominio_id, user_id)
);

-- Obrigacoes
CREATE TABLE IF NOT EXISTS public.obrigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_ultima_realizacao DATE,
  data_proxima_realizacao DATE,
  periodicidade_dias INT NOT NULL DEFAULT 365,
  criticidade public.criticidade NOT NULL DEFAULT 'media',
  dias_alerta_antecipado INT NOT NULL DEFAULT 30,
  status public.status_obrigacao NOT NULL DEFAULT 'em_dia',
  responsavel_nome TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_documento TEXT,
  descricao TEXT,
  fonte TEXT NOT NULL DEFAULT 'upload' CHECK (fonte IN ('upload', 'drive_url')),
  arquivo_url TEXT,
  drive_url TEXT,
  tamanho_bytes BIGINT,
  extensao TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tarefas Check-in
CREATE TABLE IF NOT EXISTS public.tarefas_checkin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  frequencia public.frequencia_tarefa NOT NULL DEFAULT 'diaria',
  frequencia_dias INT,
  horario_previsto TIME,
  status_ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Execuções Check-in
CREATE TABLE IF NOT EXISTS public.execucoes_checkin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID NOT NULL REFERENCES public.tarefas_checkin(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  executado_por UUID NOT NULL REFERENCES auth.users(id),
  data_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
  status public.status_execucao NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  fotos_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usuários Operacionais
CREATE TABLE IF NOT EXISTS public.usuarios_operacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil public.perfil_operacional NOT NULL DEFAULT 'zelador',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.tipo_notificacao NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  referencia_id UUID,
  referencia_tipo TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat IA Histórico
CREATE TABLE IF NOT EXISTS public.chat_ia_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE SET NULL,
  mensagem_usuario TEXT NOT NULL,
  resposta_ia TEXT NOT NULL,
  acoes_executadas JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominio_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obrigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_operacionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_ia_historico ENABLE ROW LEVEL SECURITY;

-- Helper: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role = _role FROM public.profiles WHERE id = _user_id $$;

-- Helper: has_condominio_access
CREATE OR REPLACE FUNCTION public.has_condominio_access(_user_id UUID, _condominio_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.condominios WHERE id = _condominio_id AND (sindico_id = _user_id OR sindico_id IN (SELECT id FROM public.profiles WHERE role = 'admin'))
    UNION
    SELECT 1 FROM public.condominio_acessos WHERE condominio_id = _condominio_id AND user_id = _user_id
    UNION
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'admin'
  )
$$;

-- POLICIES (Exemplo simplificado, expandir conforme necessário)
CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "User see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- 4. GATILHOS (Triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'sindico');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-checkin', 'fotos-checkin', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatares', 'avatares', true) ON CONFLICT DO NOTHING;
