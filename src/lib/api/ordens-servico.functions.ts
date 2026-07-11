import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import {
  OrdemServico as OrdemServicoEntity,
  OSItem as OSItemEntity,
  HistoricoStatusOS as HistoricoEntity,
  OrdemPagamento as OrdemPagamentoEntity,
  Parcela as ParcelaEntity,
  Pet as PetEntity,
  ServicoProduto as ServicoProdutoEntity,
  STATUS_OS_FLOW,
} from "@/server/entities";
import { requireAuth, requirePermission } from "@/server/session.server";
import { nextNumero } from "@/server/numbering.server";
import type { OrdemServico } from "@/types/ordemServico";

function toOSDTO(os: OrdemServicoEntity, pagamentoId?: string): OrdemServico {
  return {
    id: os.id,
    numero: os.numero,
    tutorId: os.tutorId,
    petId: os.petId,
    modalidadeId: os.modalidadeId,
    status: os.status,
    itens: (os.itens ?? []).map((i) => ({
      id: i.id,
      servicoProdutoId: i.servicoProdutoId ?? "",
      descricao: i.descricao,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
    })),
    total: os.total,
    pagamentoId,
    dataFalecimento: os.dataFalecimento ?? undefined,
    observacoes: os.observacoes ?? undefined,
    historico: (os.historico ?? [])
      .slice()
      .sort((a, b) => a.ocorridoEm.getTime() - b.ocorridoEm.getTime())
      .map((h) => ({
        status: h.status,
        ocorridoEm: h.ocorridoEm.toISOString(),
        usuarioId: h.usuarioId,
        usuarioNome: h.usuarioNome,
        observacao: h.observacao ?? undefined,
      })),
    criadoEm: os.criadoEm.toISOString(),
    atualizadoEm: os.atualizadoEm.toISOString(),
  };
}

/** Mapa osId → id do pagamento vinculado (1 pagamento por OS no fluxo de óbito). */
async function pagamentoPorOS(osIds: string[]): Promise<Map<string, string>> {
  if (osIds.length === 0) return new Map();
  const ds = await getDataSource();
  const pags = await ds
    .getRepository(OrdemPagamentoEntity)
    .createQueryBuilder("p")
    .select(["p.id", "p.osId"])
    .where("p.os_id IN (:...osIds)", { osIds })
    .getMany();
  return new Map(pags.filter((p) => p.osId).map((p) => [p.osId!, p.id]));
}

export const listOS = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrdemServico[]> => {
    await requireAuth();
    const ds = await getDataSource();
    const ordens = await ds.getRepository(OrdemServicoEntity).find({
      relations: { itens: true, historico: true },
      order: { atualizadoEm: "DESC" },
    });
    const pagMap = await pagamentoPorOS(ordens.map((o) => o.id));
    return ordens.map((o) => toOSDTO(o, pagMap.get(o.id)));
  },
);

export const getOS = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<OrdemServico | null> => {
    await requireAuth();
    const ds = await getDataSource();
    const os = await ds.getRepository(OrdemServicoEntity).findOne({
      where: { id: data.id },
      relations: { itens: true, historico: true },
    });
    if (!os) return null;
    const pagMap = await pagamentoPorOS([os.id]);
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

/**
 * Fluxo "Registrar óbito" em uma transação única: OS + itens (snapshot de
 * descrição/preço) + histórico inicial + dataFalecimento do pet + ordem de
 * pagamento com 1 parcela (vencimento em 7 dias).
 */
export const registrarObito = createServerFn({ method: "POST" })
  .inputValidator(registrarObitoInput)
  .handler(async ({ data }): Promise<{ os: OrdemServico; numeroPagamento: string }> => {
    const user = await requirePermission("obito.registrar");
    const ds = await getDataSource();

    return ds.transaction(async (manager) => {
      const pet = await manager.getRepository(PetEntity).findOneBy({ id: data.petId });
      if (!pet || pet.tutorId !== data.tutorId) {
        throw new Error("Pet não encontrado para este tutor.");
      }
      if (pet.dataFalecimento) {
        throw new Error("Este pet já possui óbito registrado.");
      }

      const servicos = await manager
        .getRepository(ServicoProdutoEntity)
        .createQueryBuilder("s")
        .where("s.id IN (:...ids)", { ids: data.itensIds })
        .getMany();
      if (servicos.length !== data.itensIds.length) {
        throw new Error("Serviço/produto inválido na seleção.");
      }
      const total = servicos.reduce((acc, s) => acc + s.preco, 0);

      const numeroOS = await nextNumero(manager, "OS");
      const os = await manager.getRepository(OrdemServicoEntity).save(
        manager.getRepository(OrdemServicoEntity).create({
          numero: numeroOS,
          tutorId: data.tutorId,
          petId: data.petId,
          usuarioCriadorId: user.id,
          modalidadeId: data.modalidadeId,
          status: "aguardando_coleta",
          total,
          dataFalecimento: data.dataFalecimento,
          observacoes: data.observacoes || null,
        }),
      );

      await manager.getRepository(OSItemEntity).save(
        servicos.map((s) =>
          manager.getRepository(OSItemEntity).create({
            osId: os.id,
            servicoProdutoId: s.id,
            descricao: s.nome,
            quantidade: 1,
            precoUnitario: s.preco,
          }),
        ),
      );

      await manager.getRepository(HistoricoEntity).save(
        manager.getRepository(HistoricoEntity).create({
          osId: os.id,
          status: "aguardando_coleta",
          usuarioId: user.id,
          usuarioNome: user.nome,
        }),
      );

      await manager.getRepository(PetEntity).update(pet.id, {
        dataFalecimento: data.dataFalecimento,
      });

      const numeroPG = await nextNumero(manager, "PG");
      const pagamento = await manager.getRepository(OrdemPagamentoEntity).save(
        manager.getRepository(OrdemPagamentoEntity).create({
          numero: numeroPG,
          origem: "ordem_servico",
          osId: os.id,
          tutorId: data.tutorId,
          valorTotal: total,
          status: "aberto",
        }),
      );

      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 7);
      await manager.getRepository(ParcelaEntity).save(
        manager.getRepository(ParcelaEntity).create({
          ordemPagamentoId: pagamento.id,
          numero: 1,
          totalParcelas: 1,
          valor: total,
          status: "pendente",
          dataVencimento: vencimento.toISOString().slice(0, 10),
        }),
      );

      const completa = await manager.getRepository(OrdemServicoEntity).findOneOrFail({
        where: { id: os.id },
        relations: { itens: true, historico: true },
      });
      return { os: toOSDTO(completa, pagamento.id), numeroPagamento: numeroPG };
    });
  });

export const mudarStatusOS = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      direcao: z.enum(["avancar", "regredir"]),
      observacao: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<OrdemServico> => {
    const user = await requirePermission(
      data.direcao === "avancar" ? "os.avancar_status" : "os.regredir_status",
    );
    const ds = await getDataSource();

    return ds.transaction(async (manager) => {
      const os = await manager
        .getRepository(OrdemServicoEntity)
        .createQueryBuilder("os")
        .setLock("pessimistic_write")
        .where("os.id = :id", { id: data.id })
        .getOne();
      if (!os) throw new Error("OS não encontrada.");

      const idx = STATUS_OS_FLOW.indexOf(os.status);
      const novoIdx = data.direcao === "avancar" ? idx + 1 : idx - 1;
      const novoStatus = STATUS_OS_FLOW[novoIdx];
      if (!novoStatus) {
        throw new Error(
          data.direcao === "avancar"
            ? "A OS já está no status final."
            : "A OS já está no status inicial.",
        );
      }

      await manager.getRepository(OrdemServicoEntity).update(os.id, { status: novoStatus });
      await manager.getRepository(HistoricoEntity).save(
        manager.getRepository(HistoricoEntity).create({
          osId: os.id,
          status: novoStatus,
          usuarioId: user.id,
          usuarioNome: user.nome,
          observacao:
            data.observacao ||
            (data.direcao === "regredir" ? "Status regredido manualmente." : null),
        }),
      );

      const completa = await manager.getRepository(OrdemServicoEntity).findOneOrFail({
        where: { id: os.id },
        relations: { itens: true, historico: true },
      });
      const pagMap = await pagamentoPorOS([os.id]);
      return toOSDTO(completa, pagMap.get(os.id));
    });
  });
