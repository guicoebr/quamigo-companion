import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import {
  OrdemPagamento as OrdemPagamentoEntity,
  Parcela as ParcelaEntity,
} from "@/server/entities";
import { requireAuth, requirePermission } from "@/server/session.server";
import type { Pagamento, Parcela } from "@/types/pagamento";

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function toParcelaDTO(p: ParcelaEntity): Parcela {
  // "atrasado" é derivado na leitura (pendente com vencimento passado) — nada a
  // persistir, nenhum job de virada de dia.
  const status = p.status === "pendente" && p.dataVencimento < hojeISO() ? "atrasado" : p.status;
  return {
    id: p.id,
    numero: p.numero,
    valor: p.valor,
    vencimento: p.dataVencimento,
    status,
    pagaEm: p.dataRecebimento ?? undefined,
    metodo: p.formaPagamento ?? undefined,
  };
}

function toPagamentoDTO(p: OrdemPagamentoEntity): Pagamento {
  return {
    id: p.id,
    numero: p.numero,
    origem: p.origem,
    ordemServicoId: p.osId ?? undefined,
    contratoId: p.contratoId ?? undefined,
    tutorId: p.tutorId,
    valorTotal: p.valorTotal,
    status: p.status,
    parcelas: (p.parcelas ?? [])
      .slice()
      .sort((a, b) => a.numero - b.numero)
      .map(toParcelaDTO),
    criadoEm: p.criadoEm.toISOString(),
  };
}

export const listPagamentos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Pagamento[]> => {
    await requireAuth();
    const ds = await getDataSource();
    const pags = await ds.getRepository(OrdemPagamentoEntity).find({
      relations: { parcelas: true },
      order: { criadoEm: "DESC" },
    });
    return pags.map(toPagamentoDTO);
  },
);

export const getPagamento = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<Pagamento | null> => {
    await requireAuth();
    const ds = await getDataSource();
    const pag = await ds.getRepository(OrdemPagamentoEntity).findOne({
      where: { id: data.id },
      relations: { parcelas: true },
    });
    return pag ? toPagamentoDTO(pag) : null;
  });

export const darBaixaParcela = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      pagamentoId: z.string().uuid(),
      parcelaId: z.string().uuid(),
      metodo: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "boleto"]),
    }),
  )
  .handler(async ({ data }): Promise<Pagamento> => {
    await requirePermission("pagamento.registrar_recebimento");
    const ds = await getDataSource();

    return ds.transaction(async (manager) => {
      const parcela = await manager.getRepository(ParcelaEntity).findOneBy({
        id: data.parcelaId,
        ordemPagamentoId: data.pagamentoId,
      });
      if (!parcela) throw new Error("Parcela não encontrada.");
      if (parcela.status === "pago") throw new Error("Parcela já está paga.");
      if (parcela.status === "cancelado") throw new Error("Parcela cancelada.");

      await manager.getRepository(ParcelaEntity).update(parcela.id, {
        status: "pago",
        formaPagamento: data.metodo,
        dataRecebimento: hojeISO(),
      });

      const todas = await manager.getRepository(ParcelaEntity).findBy({
        ordemPagamentoId: data.pagamentoId,
      });
      const ativas = todas.filter((p) => p.status !== "cancelado");
      const pagas = ativas.filter((p) => p.status === "pago");
      const novoStatus = pagas.length === ativas.length ? "quitado" : "parcial";
      await manager
        .getRepository(OrdemPagamentoEntity)
        .update(data.pagamentoId, { status: novoStatus });

      const pag = await manager.getRepository(OrdemPagamentoEntity).findOneOrFail({
        where: { id: data.pagamentoId },
        relations: { parcelas: true },
      });
      return toPagamentoDTO(pag);
    });
  });
