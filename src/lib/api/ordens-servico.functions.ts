import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { OrdemServico } from "@/types/ordemServico";
import { STATUS_OS_FLOW, type StatusOS } from "@/mocks/status_os";

type OSItemRow = {
  id: string;
  servico_produto_id: string | null;
  descricao: string;
  quantidade: number | string;
  preco_unitario: number | string;
};
type HistoricoRow = {
  status: StatusOS;
  ocorrido_em: string;
  usuario_id: string;
  usuario_nome: string;
  observacao: string | null;
};
type OSRow = {
  id: string;
  numero: string;
  tutor_id: string;
  pet_id: string;
  modalidade_id: string;
  status: StatusOS;
  total: number | string;
  data_falecimento: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  os_itens: OSItemRow[] | null;
  historico_status_os: HistoricoRow[] | null;
};

const OS_SELECT =
  "id, numero, tutor_id, pet_id, modalidade_id, status, total, data_falecimento, observacoes, criado_em, atualizado_em, os_itens(id, servico_produto_id, descricao, quantidade, preco_unitario), historico_status_os(status, ocorrido_em, usuario_id, usuario_nome, observacao)";

function toOSDTO(os: OSRow, pagamentoId?: string): OrdemServico {
  return {
    id: os.id,
    numero: os.numero,
    tutorId: os.tutor_id,
    petId: os.pet_id,
    modalidadeId: os.modalidade_id,
    status: os.status,
    itens: (os.os_itens ?? []).map((i) => ({
      id: i.id,
      servicoProdutoId: i.servico_produto_id ?? "",
      descricao: i.descricao,
      quantidade: Number(i.quantidade),
      precoUnitario: Number(i.preco_unitario),
    })),
    total: Number(os.total),
    pagamentoId,
    dataFalecimento: os.data_falecimento ?? undefined,
    observacoes: os.observacoes ?? undefined,
    historico: (os.historico_status_os ?? [])
      .slice()
      .sort((a, b) => new Date(a.ocorrido_em).getTime() - new Date(b.ocorrido_em).getTime())
      .map((h) => ({
        status: h.status,
        ocorridoEm: h.ocorrido_em,
        usuarioId: h.usuario_id,
        usuarioNome: h.usuario_nome,
        observacao: h.observacao ?? undefined,
      })),
    criadoEm: os.criado_em,
    atualizadoEm: os.atualizado_em,
  };
}

async function pagamentoPorOS(
  supabase: { from: (t: string) => any },
  osIds: string[],
): Promise<Map<string, string>> {
  if (osIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("ordens_pagamento")
    .select("id, os_id")
    .in("os_id", osIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).filter((p: any) => p.os_id).map((p: any) => [p.os_id, p.id]));
}

async function nextNumero(
  supabase: any,
  tipo: "OS" | "PG",
): Promise<string> {
  const ano = new Date().getFullYear();
  const { data, error } = await supabase.rpc("next_sequence", { _tipo: tipo, _ano: ano });
  if (error) throw new Error(error.message);
  return `${tipo}-${ano}-${String(Number(data)).padStart(5, "0")}`;
}

async function userNome(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("nome").eq("id", userId).maybeSingle();
  return data?.nome || "Usuário";
}

export const listOS = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrdemServico[]> => {
    const { data, error } = await context.supabase
      .from("ordens_servico")
      .select(OS_SELECT)
      .order("atualizado_em", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as OSRow[];
    const pagMap = await pagamentoPorOS(context.supabase, rows.map((o) => o.id));
    return rows.map((o) => toOSDTO(o, pagMap.get(o.id)));
  });

export const getOS = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<OrdemServico | null> => {
    const { data: row, error } = await context.supabase
      .from("ordens_servico")
      .select(OS_SELECT)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const os = row as unknown as OSRow;
    const pagMap = await pagamentoPorOS(context.supabase, [os.id]);
    return toOSDTO(os, pagMap.get(os.id));
  });

const registrarObitoInput = z.object({
  tutorId: z.string().uuid(),
  petId: z.string().uuid(),
  modalidadeId: z.string().uuid(),
  dataFalecimento: z.string().min(1),
  itensIds: z.array(z.string().uuid()).min(1),
  observacoes: z.string().optional(),
});

export const registrarObito = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(registrarObitoInput)
  .handler(async ({ data, context }): Promise<{ os: OrdemServico; numeroPagamento: string }> => {
    const { data: pet, error: petErr } = await context.supabase
      .from("pets")
      .select("id, tutor_id, data_falecimento")
      .eq("id", data.petId)
      .maybeSingle();
    if (petErr) throw new Error(petErr.message);
    if (!pet || pet.tutor_id !== data.tutorId) throw new Error("Pet não encontrado para este tutor.");
    if (pet.data_falecimento) throw new Error("Este pet já possui óbito registrado.");

    const { data: servicos, error: sErr } = await context.supabase
      .from("servicos_produtos")
      .select("id, nome, preco")
      .in("id", data.itensIds);
    if (sErr) throw new Error(sErr.message);
    if (!servicos || servicos.length !== data.itensIds.length) {
      throw new Error("Serviço/produto inválido na seleção.");
    }
    const total = servicos.reduce((acc, s) => acc + Number(s.preco), 0);
    const nome = await userNome(context.supabase, context.userId);

    const numeroOS = await nextNumero(context.supabase, "OS");
    const { data: os, error: iOsErr } = await context.supabase
      .from("ordens_servico")
      .insert({
        numero: numeroOS,
        tutor_id: data.tutorId,
        pet_id: data.petId,
        usuario_criador_id: context.userId,
        modalidade_id: data.modalidadeId,
        status: "aguardando_coleta",
        total,
        data_falecimento: data.dataFalecimento,
        observacoes: data.observacoes || null,
      })
      .select("id")
      .single();
    if (iOsErr) throw new Error(iOsErr.message);

    const { error: itErr } = await context.supabase.from("os_itens").insert(
      servicos.map((s) => ({
        os_id: os.id,
        servico_produto_id: s.id,
        descricao: s.nome,
        quantidade: 1,
        preco_unitario: Number(s.preco),
      })),
    );
    if (itErr) throw new Error(itErr.message);

    const { error: hErr } = await context.supabase.from("historico_status_os").insert({
      os_id: os.id,
      status: "aguardando_coleta",
      usuario_id: context.userId,
      usuario_nome: nome,
    });
    if (hErr) throw new Error(hErr.message);

    const { error: uErr } = await (context.supabase.from("pets") as any)
      .update({ data_falecimento: data.dataFalecimento })
      .eq("id", pet.id);
    if (uErr) throw new Error(uErr.message);

    const numeroPG = await nextNumero(context.supabase, "PG");
    const { data: pag, error: pgErr } = await context.supabase
      .from("ordens_pagamento")
      .insert({
        numero: numeroPG,
        origem: "ordem_servico",
        os_id: os.id,
        tutor_id: data.tutorId,
        valor_total: total,
        status: "aberto",
      })
      .select("id")
      .single();
    if (pgErr) throw new Error(pgErr.message);

    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 7);
    const { error: parErr } = await context.supabase.from("parcelas").insert({
      ordem_pagamento_id: pag.id,
      numero: 1,
      total_parcelas: 1,
      valor: total,
      status: "pendente",
      data_vencimento: vencimento.toISOString().slice(0, 10),
    });
    if (parErr) throw new Error(parErr.message);

    const { data: completo, error: fErr } = await context.supabase
      .from("ordens_servico")
      .select(OS_SELECT)
      .eq("id", os.id)
      .single();
    if (fErr) throw new Error(fErr.message);
    return { os: toOSDTO(completo as unknown as OSRow, pag.id), numeroPagamento: numeroPG };
  });

export const mudarStatusOS = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      direcao: z.enum(["avancar", "regredir"]),
      observacao: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }): Promise<OrdemServico> => {
    const { data: os, error: oErr } = await context.supabase
      .from("ordens_servico")
      .select("id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!os) throw new Error("OS não encontrada.");

    const idx = STATUS_OS_FLOW.indexOf(os.status as StatusOS);
    const novoIdx = data.direcao === "avancar" ? idx + 1 : idx - 1;
    const novoStatus = STATUS_OS_FLOW[novoIdx];
    if (!novoStatus) {
      throw new Error(
        data.direcao === "avancar" ? "A OS já está no status final." : "A OS já está no status inicial.",
      );
    }

    const { error: upErr } = await (context.supabase.from("ordens_servico") as any)
      .update({ status: novoStatus })
      .eq("id", os.id);
    if (upErr) throw new Error(upErr.message);

    const nome = await userNome(context.supabase, context.userId);
    const { error: hErr } = await context.supabase.from("historico_status_os").insert({
      os_id: os.id,
      status: novoStatus,
      usuario_id: context.userId,
      usuario_nome: nome,
      observacao:
        data.observacao || (data.direcao === "regredir" ? "Status regredido manualmente." : null),
    });
    if (hErr) throw new Error(hErr.message);

    const { data: completa, error: fErr } = await context.supabase
      .from("ordens_servico")
      .select(OS_SELECT)
      .eq("id", os.id)
      .single();
    if (fErr) throw new Error(fErr.message);
    const pagMap = await pagamentoPorOS(context.supabase, [os.id]);
    return toOSDTO(completa as unknown as OSRow, pagMap.get(os.id));
  });
