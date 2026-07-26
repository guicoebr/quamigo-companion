import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Contrato } from "@/types/contrato";
import type { Pagamento } from "@/types/pagamento";

type ContratoRow = {
  id: string;
  numero: string;
  tutor_id: string;
  modalidade_id: string;
  status: Contrato["status"];
  valor_mensal: number | string;
  periodicidade: Contrato["periodicidade"];
  inicio_vigencia: string;
  fim_vigencia: string | null;
  observacoes: string | null;
  criado_em: string;
  contrato_pets: { pet_id: string }[] | null;
  contrato_servicos: { servico_produto_id: string }[] | null;
};

const CONTRATO_SELECT =
  "id, numero, tutor_id, modalidade_id, status, valor_mensal, periodicidade, inicio_vigencia, fim_vigencia, observacoes, criado_em, contrato_pets(pet_id), contrato_servicos(servico_produto_id)";

function toContratoDTO(c: ContratoRow): Contrato {
  return {
    id: c.id,
    numero: c.numero,
    tutorId: c.tutor_id,
    petsIds: (c.contrato_pets ?? []).map((cp) => cp.pet_id),
    servicosIds: (c.contrato_servicos ?? []).map((cs) => cs.servico_produto_id),
    modalidadeId: c.modalidade_id,
    status: c.status,
    valorMensal: Number(c.valor_mensal),
    periodicidade: c.periodicidade,
    inicioVigencia: c.inicio_vigencia,
    fimVigencia: c.fim_vigencia ?? undefined,
    observacoes: c.observacoes ?? undefined,
    criadoEm: c.criado_em,
  };
}

async function nextNumero(
  supabase: any,
  tipo: "OS" | "PG" | "CT",
): Promise<string> {
  const ano = new Date().getFullYear();
  const { data, error } = await supabase.rpc("next_sequence", { _tipo: tipo, _ano: ano });
  if (error) throw new Error(error.message);
  const n = Number(data);
  return `${tipo}-${ano}-${String(n).padStart(5, "0")}`;
}

export const listContratos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Contrato[]> => {
    const { data, error } = await context.supabase
      .from("contratos")
      .select(CONTRATO_SELECT)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toContratoDTO(r as unknown as ContratoRow));
  });

export const getContrato = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<Contrato | null> => {
    const { data: row, error } = await context.supabase
      .from("contratos")
      .select(CONTRATO_SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toContratoDTO(row as unknown as ContratoRow) : null;
  });

const createContratoInput = z.object({
  tutorId: z.string().uuid(),
  petsIds: z.array(z.string().uuid()).min(1),
  servicosIds: z.array(z.string().uuid()).min(1),
  modalidadeId: z.string().uuid(),
  valorMensal: z.number().positive(),
  periodicidade: z.enum(["mensal", "trimestral", "anual"]),
  inicioVigencia: z.string().min(1),
  fimVigencia: z.string().optional(),
  observacoes: z.string().optional(),
});

export const createContrato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(createContratoInput)
  .handler(async ({ data, context }): Promise<Contrato> => {
    // Sanidade: pets pertencem ao tutor
    const { data: pets, error: petsErr } = await context.supabase
      .from("pets")
      .select("id, nome, tutor_id")
      .in("id", data.petsIds);
    if (petsErr) throw new Error(petsErr.message);
    if (!pets || pets.length !== data.petsIds.length || pets.some((p) => p.tutor_id !== data.tutorId)) {
      throw new Error("Pet inválido para este tutor.");
    }

    // Conflito: pet já com contrato ativo
    const { data: conflitos, error: cErr } = await context.supabase
      .from("contrato_pets")
      .select("pet_id, contratos!inner(status)")
      .in("pet_id", data.petsIds)
      .eq("contratos.status", "ativo");
    if (cErr) throw new Error(cErr.message);
    if (conflitos && conflitos.length > 0) {
      const petConflito = pets.find((p) => p.id === conflitos[0].pet_id);
      throw new Error(`O pet ${petConflito?.nome ?? ""} já possui contrato ativo.`);
    }

    const numero = await nextNumero(context.supabase, "CT");

    const { data: contrato, error: iErr } = await context.supabase
      .from("contratos")
      .insert({
        numero,
        tutor_id: data.tutorId,
        modalidade_id: data.modalidadeId,
        status: "ativo",
        valor_mensal: data.valorMensal,
        periodicidade: data.periodicidade,
        inicio_vigencia: data.inicioVigencia,
        fim_vigencia: data.fimVigencia || null,
        observacoes: data.observacoes || null,
      })
      .select("id")
      .single();
    if (iErr) throw new Error(iErr.message);

    const { error: cpErr } = await context.supabase
      .from("contrato_pets")
      .insert(data.petsIds.map((pet_id) => ({ contrato_id: contrato.id, pet_id })));
    if (cpErr) throw new Error(cpErr.message);

    const { error: csErr } = await context.supabase
      .from("contrato_servicos")
      .insert(
        data.servicosIds.map((servico_produto_id) => ({
          contrato_id: contrato.id,
          servico_produto_id,
        })),
      );
    if (csErr) throw new Error(csErr.message);

    const { data: completo, error: fErr } = await context.supabase
      .from("contratos")
      .select(CONTRATO_SELECT)
      .eq("id", contrato.id)
      .single();
    if (fErr) throw new Error(fErr.message);
    return toContratoDTO(completo as unknown as ContratoRow);
  });

/**
 * Gera cobrança do mês corrente para um contrato ativo.
 * Índice único (contrato_id, competencia) em `ordens_pagamento` protege contra duplicata.
 */
export const gerarCobrancaContrato = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ contratoId: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<Pagamento> => {
    const { data: contrato, error: cErr } = await context.supabase
      .from("contratos")
      .select("id, tutor_id, valor_mensal, status")
      .eq("id", data.contratoId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!contrato) throw new Error("Contrato não encontrado.");
    if (contrato.status !== "ativo") throw new Error("Contrato não está ativo.");

    const agora = new Date();
    const competencia = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-01`;

    const { data: existente } = await context.supabase
      .from("ordens_pagamento")
      .select("id")
      .eq("contrato_id", contrato.id)
      .eq("competencia", competencia)
      .maybeSingle();
    if (existente) {
      const mm = competencia.slice(5, 7);
      throw new Error(`Já existe uma cobrança gerada para ${mm}/${agora.getFullYear()}.`);
    }

    const numero = await nextNumero(context.supabase, "PG");
    const valor = Number(contrato.valor_mensal);

    const { data: pag, error: pErr } = await context.supabase
      .from("ordens_pagamento")
      .insert({
        numero,
        origem: "contrato",
        contrato_id: contrato.id,
        tutor_id: contrato.tutor_id,
        valor_total: valor,
        status: "aberto",
        competencia,
      })
      .select("id, numero, origem, contrato_id, os_id, tutor_id, valor_total, status, criado_em")
      .single();
    if (pErr) throw new Error(pErr.message);

    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 7);
    const { data: parc, error: paErr } = await context.supabase
      .from("parcelas")
      .insert({
        ordem_pagamento_id: pag.id,
        numero: 1,
        total_parcelas: 1,
        valor,
        status: "pendente",
        data_vencimento: vencimento.toISOString().slice(0, 10),
      })
      .select("id, numero, valor, data_vencimento, status")
      .single();
    if (paErr) throw new Error(paErr.message);

    return {
      id: pag.id,
      numero: pag.numero,
      origem: pag.origem as Pagamento["origem"],
      contratoId: pag.contrato_id ?? undefined,
      tutorId: pag.tutor_id,
      valorTotal: Number(pag.valor_total),
      status: pag.status as Pagamento["status"],
      parcelas: [
        {
          id: parc.id,
          numero: parc.numero,
          valor: Number(parc.valor),
          vencimento: parc.data_vencimento,
          status: parc.status as Pagamento["parcelas"][number]["status"],
        },
      ],
      criadoEm: pag.criado_em,
    };
  });
