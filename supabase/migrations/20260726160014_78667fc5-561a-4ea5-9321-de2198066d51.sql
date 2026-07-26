-- ============================================================================
-- Extensões
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Auth: enum app_role, tabelas profiles e user_roles, função has_role
-- ============================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'operacional', 'financeiro', 'recepcao');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome varchar(200) NOT NULL DEFAULT '',
  email varchar(200) NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger que cria a profile automaticamente ao inserir em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função utilitária para updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Políticas de profiles
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_admin_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_admin_delete"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas de user_roles: só admin gerencia; qualquer autenticado pode ler o próprio
CREATE POLICY "user_roles_select_own_or_admin"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_admin_all"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Domínio: cadastros base
-- ============================================================================
CREATE TABLE public.especies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.especies TO authenticated;
GRANT ALL ON public.especies TO service_role;
ALTER TABLE public.especies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "especies_read_all_auth" ON public.especies FOR SELECT TO authenticated USING (true);
CREATE POLICY "especies_admin_write" ON public.especies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.racas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  especie_id uuid NOT NULL REFERENCES public.especies(id) ON DELETE CASCADE,
  nome varchar(100) NOT NULL,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.racas TO authenticated;
GRANT ALL ON public.racas TO service_role;
ALTER TABLE public.racas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "racas_read_all_auth" ON public.racas FOR SELECT TO authenticated USING (true);
CREATE POLICY "racas_admin_write" ON public.racas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.modalidades_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL UNIQUE,
  descricao text,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modalidades_servico TO authenticated;
GRANT ALL ON public.modalidades_servico TO service_role;
ALTER TABLE public.modalidades_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modalidades_read_all_auth" ON public.modalidades_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "modalidades_admin_write" ON public.modalidades_servico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.servicos_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(200) NOT NULL,
  tipo varchar(30) NOT NULL,
  descricao text,
  preco numeric(10,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos_produtos TO authenticated;
GRANT ALL ON public.servicos_produtos TO service_role;
ALTER TABLE public.servicos_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_read_all_auth" ON public.servicos_produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "sp_admin_write" ON public.servicos_produtos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Domínio: tutores e pets
-- ============================================================================
CREATE TABLE public.tutores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(200) NOT NULL,
  cpf varchar(11) NOT NULL UNIQUE,
  email varchar(200) NOT NULL,
  telefone varchar(20) NOT NULL,
  cep varchar(8) NOT NULL,
  logradouro varchar(200) NOT NULL,
  numero varchar(20) NOT NULL,
  complemento varchar(100),
  bairro varchar(100) NOT NULL,
  cidade varchar(100) NOT NULL,
  uf char(2) NOT NULL,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutores TO authenticated;
GRANT ALL ON public.tutores TO service_role;
ALTER TABLE public.tutores ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER tutores_set_updated_at
  BEFORE UPDATE ON public.tutores
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "tutores_read_all_auth" ON public.tutores FOR SELECT TO authenticated USING (true);
CREATE POLICY "tutores_write_recepcao_admin" ON public.tutores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recepcao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recepcao'));

CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.tutores(id) ON DELETE CASCADE,
  especie_id uuid REFERENCES public.especies(id) ON DELETE SET NULL,
  raca_id uuid REFERENCES public.racas(id) ON DELETE SET NULL,
  nome varchar(100) NOT NULL,
  sexo varchar(10) NOT NULL,
  cor varchar(80) NOT NULL,
  peso_kg numeric(6,2) NOT NULL,
  data_nascimento date,
  data_falecimento date,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pets_read_all_auth" ON public.pets FOR SELECT TO authenticated USING (true);
-- Recepção/admin gerenciam; operacional pode atualizar (para registrar óbito)
CREATE POLICY "pets_insert_recepcao_admin" ON public.pets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recepcao'));
CREATE POLICY "pets_update_recepcao_admin_op" ON public.pets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recepcao') OR public.has_role(auth.uid(), 'operacional'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recepcao') OR public.has_role(auth.uid(), 'operacional'));
CREATE POLICY "pets_delete_admin" ON public.pets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Domínio: ordens de serviço
-- ============================================================================
CREATE TABLE public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero varchar(20) NOT NULL UNIQUE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE RESTRICT,
  tutor_id uuid NOT NULL REFERENCES public.tutores(id) ON DELETE RESTRICT,
  usuario_criador_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  modalidade_id uuid NOT NULL REFERENCES public.modalidades_servico(id) ON DELETE RESTRICT,
  status varchar(30) NOT NULL DEFAULT 'aguardando_coleta',
  total numeric(10,2) NOT NULL DEFAULT 0,
  data_falecimento date,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER os_set_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "os_read_all_auth" ON public.ordens_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_write_op_admin" ON public.ordens_servico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operacional') OR public.has_role(auth.uid(), 'recepcao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operacional') OR public.has_role(auth.uid(), 'recepcao'));

CREATE TABLE public.os_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  servico_produto_id uuid REFERENCES public.servicos_produtos(id) ON DELETE SET NULL,
  descricao varchar(200) NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  preco_unitario numeric(10,2) NOT NULL,
  subtotal numeric(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.os_itens TO authenticated;
GRANT ALL ON public.os_itens TO service_role;
ALTER TABLE public.os_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "os_itens_read_all_auth" ON public.os_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_itens_write_op_admin" ON public.os_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operacional') OR public.has_role(auth.uid(), 'recepcao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operacional') OR public.has_role(auth.uid(), 'recepcao'));

CREATE TABLE public.historico_status_os (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  status varchar(30) NOT NULL,
  ocorrido_em timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome varchar(200) NOT NULL,
  observacao text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_status_os TO authenticated;
GRANT ALL ON public.historico_status_os TO service_role;
ALTER TABLE public.historico_status_os ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hist_read_all_auth" ON public.historico_status_os FOR SELECT TO authenticated USING (true);
CREATE POLICY "hist_write_op_admin" ON public.historico_status_os FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operacional') OR public.has_role(auth.uid(), 'recepcao'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operacional') OR public.has_role(auth.uid(), 'recepcao'));

-- ============================================================================
-- Domínio: contratos
-- ============================================================================
CREATE TABLE public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero varchar(20) NOT NULL UNIQUE,
  tutor_id uuid NOT NULL REFERENCES public.tutores(id) ON DELETE RESTRICT,
  modalidade_id uuid NOT NULL REFERENCES public.modalidades_servico(id) ON DELETE RESTRICT,
  status varchar(20) NOT NULL DEFAULT 'ativo',
  valor_mensal numeric(10,2) NOT NULL,
  periodicidade varchar(20) NOT NULL DEFAULT 'mensal',
  inicio_vigencia date NOT NULL,
  fim_vigencia date,
  observacoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contratos_read_all_auth" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "contratos_admin_write" ON public.contratos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.contrato_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_pets TO authenticated;
GRANT ALL ON public.contrato_pets TO service_role;
ALTER TABLE public.contrato_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_read_all_auth" ON public.contrato_pets FOR SELECT TO authenticated USING (true);
CREATE POLICY "cp_admin_write" ON public.contrato_pets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.contrato_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  servico_produto_id uuid NOT NULL REFERENCES public.servicos_produtos(id) ON DELETE RESTRICT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_servicos TO authenticated;
GRANT ALL ON public.contrato_servicos TO service_role;
ALTER TABLE public.contrato_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_read_all_auth" ON public.contrato_servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cs_admin_write" ON public.contrato_servicos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- Domínio: pagamentos
-- ============================================================================
CREATE TABLE public.ordens_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero varchar(20) NOT NULL UNIQUE,
  origem varchar(20) NOT NULL,
  os_id uuid REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  contrato_id uuid REFERENCES public.contratos(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.tutores(id) ON DELETE RESTRICT,
  valor_total numeric(10,2) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'aberto',
  competencia date,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ordens_pagamento_contrato_competencia_idx
  ON public.ordens_pagamento (contrato_id, competencia);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_pagamento TO authenticated;
GRANT ALL ON public.ordens_pagamento TO service_role;
ALTER TABLE public.ordens_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "op_read_all_auth" ON public.ordens_pagamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "op_write_fin_admin" ON public.ordens_pagamento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'operacional'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'operacional'));

CREATE TABLE public.parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_pagamento_id uuid NOT NULL REFERENCES public.ordens_pagamento(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  total_parcelas integer NOT NULL,
  valor numeric(10,2) NOT NULL,
  forma_pagamento varchar(30),
  status varchar(20) NOT NULL DEFAULT 'pendente',
  data_vencimento date NOT NULL,
  data_recebimento date,
  observacao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parcelas TO authenticated;
GRANT ALL ON public.parcelas TO service_role;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parc_read_all_auth" ON public.parcelas FOR SELECT TO authenticated USING (true);
CREATE POLICY "parc_write_fin_admin" ON public.parcelas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'operacional'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'financeiro') OR public.has_role(auth.uid(), 'operacional'));

-- ============================================================================
-- Sequências (numeração de OS/Pagamento por ano)
-- ============================================================================
CREATE TABLE public.sequencias (
  tipo varchar(4) NOT NULL,
  ano integer NOT NULL,
  ultimo_numero integer NOT NULL DEFAULT 0,
  PRIMARY KEY (tipo, ano)
);
GRANT SELECT ON public.sequencias TO authenticated;
GRANT ALL ON public.sequencias TO service_role;
ALTER TABLE public.sequencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seq_read_auth" ON public.sequencias FOR SELECT TO authenticated USING (true);
-- Escrita de sequência acontece exclusivamente via função next_sequence (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.next_sequence(_tipo text, _ano integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _n integer;
BEGIN
  INSERT INTO public.sequencias (tipo, ano, ultimo_numero)
  VALUES (_tipo, _ano, 1)
  ON CONFLICT (tipo, ano)
  DO UPDATE SET ultimo_numero = public.sequencias.ultimo_numero + 1
  RETURNING ultimo_numero INTO _n;
  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.next_sequence(text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.next_sequence(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_sequence(text, integer) TO service_role;