import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Pagamento, Parcela } from "@/types/pagamento";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

type ParcelaRow = {
  id: string;
  numero: number;
  valor: number | string;
  data_vencimento: string;
  status: Parcela["status"] | "pendente" | "pago" | "cancelado" | "atrasado";
  data_recebimento: string | null;
  forma_pagamento: string | null;
};

type PagRow = {
  id: string;
  numero: string;
  origem: Pagamento["origem"];
  os_id: string | null;
  contrato_id: string | null;
  tutor_id: string;
  valor_total: number | string;
  status: Pagamento["status"];
  criado_em: string;
  parcelas: ParcelaRow[] | null;
};

const PAG_SELECT =
  "id, numero, origem, os_id, contrato_id, tutor_id, valor_total, status, criado_em, parcelas(id, numero, valor, data_vencimento, status, data_recebimento, forma_pagamento)";

function toParcela(p: ParcelaRow): Parcela {
  const status =
    p.status === "pendente" && p.data_vencimento < hojeISO() ? "atrasado" : (p.status as Parcela["status"]);
  return {
    id: p.id,
    numero: p.numero,
    valor: Number(p.valor),
    vencimento: p.data_vencimento,
    status,
    pagaEm: p.data_recebimento ?? undefined,
    metodo: (p.forma_pagamento ?? undefined) as Parcela["metodo"],
  };
}

function toPagamento(p: PagRow): Pagamento {
  return {
    id: p.id,
    numero: p.numero,
    origem: p.origem,
    ordemServicoId: p.os_id ?? undefined,
    contratoId: p.contrato_id ?? undefined,
    tutorId: p.tutor_id,
    valorTotal: Number(p.valor_total),
    status: p.status,
    parcelas: (p.parcelas ?? []).slice().sort((a, b) => a.numero - b.numero).map(toParcela),
    criadoEm: p.criado_em,
  };
}

export const listPagamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Pagamento[]> => {
    const { data, error } = await context.supabase
      .from("ordens_pagamento")
      .select(PAG_SELECT)
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toPagamento(r as unknown as PagRow));
  });

export const getPagamento = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<Pagamento | null> => {
    const { data: row, error } = await context.supabase
      .from("ordens_pagamento")
      .select(PAG_SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toPagamento(row as unknown as PagRow) : null;
  });

export const darBaixaParcela = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      pagamentoId: z.string().uuid(),
      parcelaId: z.string().uuid(),
      metodo: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto"]),
    }),
  )
  .handler(async ({ data, context }): Promise<Pagamento> => {
    const { data: parcela, error: pErr } = await context.supabase
      .from("parcelas")
      .select("id, status, ordem_pagamento_id")
      .eq("id", data.parcelaId)
      .eq("ordem_pagamento_id", data.pagamentoId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!parcela) throw new Error("Parcela não encontrada.");
    if (parcela.status === "pago") throw new Error("Parcela já está paga.");
    if (parcela.status === "cancelado") throw new Error("Parcela cancelada.");

    const { error: upErr } = await (context.supabase.from("parcelas") as any)
      .update({
        status: "pago",
        forma_pagamento: data.metodo,
        data_recebimento: hojeISO(),
      })
      .eq("id", parcela.id);
    if (upErr) throw new Error(upErr.message);

    const { data: todas, error: tErr } = await context.supabase
      .from("parcelas")
      .select("status")
      .eq("ordem_pagamento_id", data.pagamentoId);
    if (tErr) throw new Error(tErr.message);
    const ativas = (todas ?? []).filter((p) => p.status !== "cancelado");
    const pagas = ativas.filter((p) => p.status === "pago");
    const novoStatus = pagas.length === ativas.length ? "quitado" : "parcial";
    const { error: opErr } = await (context.supabase.from("ordens_pagamento") as any)
      .update({ status: novoStatus })
      .eq("id", data.pagamentoId);
    if (opErr) throw new Error(opErr.message);

    const { data: pag, error: fErr } = await context.supabase
      .from("ordens_pagamento")
      .select(PAG_SELECT)
      .eq("id", data.pagamentoId)
      .single();
    if (fErr) throw new Error(fErr.message);
    return toPagamento(pag as unknown as PagRow);
  });
