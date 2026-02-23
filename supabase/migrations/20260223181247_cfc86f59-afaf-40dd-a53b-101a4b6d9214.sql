
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('sindico', 'funcionario', 'zelador');
CREATE TYPE public.criticidade AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.status_obrigacao AS ENUM ('em_dia', 'atencao', 'vencida');
CREATE TYPE public.frequencia_tarefa AS ENUM ('diaria', 'semanal', 'mensal', 'personalizada');
CREATE TYPE public.status_execucao AS ENUM ('pendente', 'concluida', 'nao_realizada');
CREATE TYPE public.perfil_operacional AS ENUM ('zelador', 'aux_manutencao', 'porteiro');
CREATE TYPE public.nivel_acesso AS ENUM ('total', 'leitura', 'tarefas_only');
CREATE TYPE public.tipo_notificacao AS ENUM ('obrigacao_vencendo', 'tarefa_atrasada', 'documento_adicionado');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'sindico',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Trigger to auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'sindico');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Condominios
CREATE TABLE public.condominios (
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
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sindicos can view own condominios" ON public.condominios FOR SELECT USING (auth.uid() = sindico_id);
CREATE POLICY "Sindicos can insert condominios" ON public.condominios FOR INSERT WITH CHECK (auth.uid() = sindico_id);
CREATE POLICY "Sindicos can update own condominios" ON public.condominios FOR UPDATE USING (auth.uid() = sindico_id);
CREATE POLICY "Sindicos can delete own condominios" ON public.condominios FOR DELETE USING (auth.uid() = sindico_id);

-- Condominio acessos
CREATE TABLE public.condominio_acessos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel_acesso nivel_acesso NOT NULL DEFAULT 'leitura',
  modulos_permitidos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(condominio_id, user_id)
);
ALTER TABLE public.condominio_acessos ENABLE ROW LEVEL SECURITY;

-- Helper function to check condominio access
CREATE OR REPLACE FUNCTION public.has_condominio_access(_user_id UUID, _condominio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.condominios WHERE id = _condominio_id AND sindico_id = _user_id
    UNION
    SELECT 1 FROM public.condominio_acessos WHERE condominio_id = _condominio_id AND user_id = _user_id
  )
$$;

CREATE POLICY "Users with access can view" ON public.condominio_acessos FOR SELECT USING (public.has_condominio_access(auth.uid(), condominio_id));
CREATE POLICY "Sindicos can manage access" ON public.condominio_acessos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can update access" ON public.condominio_acessos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can delete access" ON public.condominio_acessos FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);

-- Obrigacoes
CREATE TABLE public.obrigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  data_ultima_realizacao DATE,
  data_proxima_realizacao DATE,
  periodicidade_dias INT NOT NULL DEFAULT 365,
  criticidade criticidade NOT NULL DEFAULT 'media',
  dias_alerta_antecipado INT NOT NULL DEFAULT 30,
  status status_obrigacao NOT NULL DEFAULT 'em_dia',
  responsavel_nome TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.obrigacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with access can view obrigacoes" ON public.obrigacoes FOR SELECT USING (public.has_condominio_access(auth.uid(), condominio_id));
CREATE POLICY "Sindicos can insert obrigacoes" ON public.obrigacoes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can update obrigacoes" ON public.obrigacoes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can delete obrigacoes" ON public.obrigacoes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);

-- Documentos
CREATE TABLE public.documentos (
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
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with access can view documentos" ON public.documentos FOR SELECT USING (public.has_condominio_access(auth.uid(), condominio_id));
CREATE POLICY "Sindicos can insert documentos" ON public.documentos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can update documentos" ON public.documentos FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can delete documentos" ON public.documentos FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);

-- Tarefas check-in
CREATE TABLE public.tarefas_checkin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  frequencia frequencia_tarefa NOT NULL DEFAULT 'diaria',
  frequencia_dias INT,
  horario_previsto TIME,
  status_ativo BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tarefas_checkin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with access can view tarefas" ON public.tarefas_checkin FOR SELECT USING (public.has_condominio_access(auth.uid(), condominio_id));
CREATE POLICY "Sindicos can insert tarefas" ON public.tarefas_checkin FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can update tarefas" ON public.tarefas_checkin FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);
CREATE POLICY "Sindicos can delete tarefas" ON public.tarefas_checkin FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.condominios WHERE id = condominio_id AND sindico_id = auth.uid())
);

-- Execuções check-in
CREATE TABLE public.execucoes_checkin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id UUID NOT NULL REFERENCES public.tarefas_checkin(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  executado_por UUID NOT NULL REFERENCES auth.users(id),
  data_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
  status status_execucao NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  fotos_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.execucoes_checkin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with access can view execucoes" ON public.execucoes_checkin FOR SELECT USING (public.has_condominio_access(auth.uid(), condominio_id));
CREATE POLICY "Users with access can insert execucoes" ON public.execucoes_checkin FOR INSERT WITH CHECK (public.has_condominio_access(auth.uid(), condominio_id));
CREATE POLICY "Users with access can update execucoes" ON public.execucoes_checkin FOR UPDATE USING (public.has_condominio_access(auth.uid(), condominio_id));

-- Notificações
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo tipo_notificacao NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  referencia_id UUID,
  referencia_tipo TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notificacoes FOR UPDATE USING (auth.uid() = user_id);

-- Chat IA histórico
CREATE TABLE public.chat_ia_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE SET NULL,
  mensagem_usuario TEXT NOT NULL,
  resposta_ia TEXT NOT NULL,
  acoes_executadas JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_ia_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history" ON public.chat_ia_historico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat history" ON public.chat_ia_historico FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_condominios_updated_at BEFORE UPDATE ON public.condominios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_obrigacoes_updated_at BEFORE UPDATE ON public.obrigacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-checkin', 'fotos-checkin', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatares', 'avatares', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatares');
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatares' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view docs" ON storage.objects FOR SELECT USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload checkin photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-checkin' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view checkin photos" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-checkin' AND auth.role() = 'authenticated');

-- Useful indexes
CREATE INDEX idx_condominios_sindico ON public.condominios(sindico_id);
CREATE INDEX idx_obrigacoes_condominio ON public.obrigacoes(condominio_id);
CREATE INDEX idx_obrigacoes_proxima ON public.obrigacoes(data_proxima_realizacao);
CREATE INDEX idx_documentos_condominio ON public.documentos(condominio_id);
CREATE INDEX idx_tarefas_condominio ON public.tarefas_checkin(condominio_id);
CREATE INDEX idx_execucoes_tarefa ON public.execucoes_checkin(tarefa_id);
CREATE INDEX idx_notificacoes_user ON public.notificacoes(user_id, lida);
CREATE INDEX idx_condominio_acessos_user ON public.condominio_acessos(user_id);
