
-- 1. Harden functions: fixed search_path + revoke public/anon EXECUTE
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.next_sequence(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon;

-- 2. Replace broad "true" SELECT policies with role-scoped ones

-- tutores: any staff role
DROP POLICY IF EXISTS tutores_read_all_auth ON public.tutores;
CREATE POLICY tutores_read_staff ON public.tutores FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operacional'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
);

-- pets: any staff role
DROP POLICY IF EXISTS pets_read_all_auth ON public.pets;
CREATE POLICY pets_read_staff ON public.pets FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operacional'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
);

-- ordens_servico: any staff role
DROP POLICY IF EXISTS os_read_all_auth ON public.ordens_servico;
CREATE POLICY os_read_staff ON public.ordens_servico FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operacional'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
);

-- os_itens: any staff role
DROP POLICY IF EXISTS os_itens_read_all_auth ON public.os_itens;
CREATE POLICY os_itens_read_staff ON public.os_itens FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operacional'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
);

-- historico_status_os: any staff role
DROP POLICY IF EXISTS hist_read_all_auth ON public.historico_status_os;
CREATE POLICY hist_read_staff ON public.historico_status_os FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'operacional'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
  OR has_role(auth.uid(), 'recepcao'::app_role)
);

-- contratos: admin or financeiro
DROP POLICY IF EXISTS contratos_read_all_auth ON public.contratos;
CREATE POLICY contratos_read_fin_admin ON public.contratos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- contrato_pets: admin or financeiro
DROP POLICY IF EXISTS cp_read_all_auth ON public.contrato_pets;
CREATE POLICY cp_read_fin_admin ON public.contrato_pets FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- contrato_servicos: admin or financeiro
DROP POLICY IF EXISTS cs_read_all_auth ON public.contrato_servicos;
CREATE POLICY cs_read_fin_admin ON public.contrato_servicos FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- ordens_pagamento: admin or financeiro
DROP POLICY IF EXISTS op_read_all_auth ON public.ordens_pagamento;
CREATE POLICY op_read_fin_admin ON public.ordens_pagamento FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);

-- parcelas: admin or financeiro
DROP POLICY IF EXISTS parc_read_all_auth ON public.parcelas;
CREATE POLICY parc_read_fin_admin ON public.parcelas FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'financeiro'::app_role)
);
