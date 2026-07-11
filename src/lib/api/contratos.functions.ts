import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import {
  Contrato as ContratoEntity,
  ContratoPet as ContratoPetEntity,
  ContratoServico as ContratoServicoEntity,
  OrdemPagamento as OrdemPagamentoEntity,
  Parcela as ParcelaEntity,
  Pet as PetEntity,
} from "@/server/entities";
import { requireAuth, requirePermission } from "@/server/session.server";
import { nextNumero } from "@/server/numbering.server";
import type { Contrato } from "@/types/contrato";
import type { Pagamento } from "@/types/pagamento";

function toContratoDTO(c: ContratoEntity): Contrato {
  return {
    id: c.id,
    numero: c.numero,
    tutorId: c.tutorId,
    petsIds: (c.contratoPets ?? []).map((cp) => cp.petId),
    servicosIds: (c.contratoServicos ?? []).map((cs) => cs.servicoProdutoId),
    modalidadeId: c.modalidadeId,
    status: c.status,
    valorMensal: c.valorMensal,
    periodicidade: c.periodicidade,
    inicioVigencia: c.inicioVigencia,
    fimVigencia: c.fimVigencia ?? undefined,
    observacoes: c.observacoes ?? undefined,
    criadoEm: c.criadoEm.toISOString(),
  };
}

export const listContratos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Contrato[]> => {
    await requireAuth();
    const ds = await getDataSource();
    const contratos = await ds.getRepository(ContratoEntity).find({
      relations: { contratoPets: true, contratoServicos: true },
      order: { criadoEm: "DESC" },
    });
    return contratos.map(toContratoDTO);
  },
);

export const getContrato = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<Contrato | null> => {
    await requireAuth();
    const ds = await getDataSource();
    const contrato = await ds.getRepository(ContratoEntity).findOne({
      where: { id: data.id },
      relations: { contratoPets: true, contratoServicos: true },
    });
    return contrato ? toContratoDTO(contrato) : null;
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
  .inputValidator(createContratoInput)
  .handler(async ({ data }): Promise<Contrato> => {
    await requirePermission("contrato.gerenciar");
    const ds = await getDataSource();

    return ds.transaction(async (manager) => {
      const pets = await manager
        .getRepository(PetEntity)
        .createQueryBuilder("p")
        .where("p.id IN (:...ids)", { ids: data.petsIds })
        .getMany();
      if (pets.length !== data.petsIds.length || pets.some((p) => p.tutorId !== data.tutorId)) {
        throw new Error("Pet inválido para este tutor.");
      }

      // Regra "um pet só pode ter um contrato ativo por vez" — validada aqui
      // (ver comentário em contrato-pet.entity.ts).
      const conflito = await manager
        .getRepository(ContratoPetEntity)
        .createQueryBuilder("cp")
        .innerJoin("cp.contrato", "c")
        .innerJoin("cp.pet", "pet")
        .where("cp.pet_id IN (:...ids)", { ids: data.petsIds })
        .andWhere("c.status = 'ativo'")
        .select("pet.nome", "nome")
        .getRawOne<{ nome: string }>();
      if (conflito) {
        throw new Error(`O pet ${conflito.nome} já possui contrato ativo.`);
      }

      const numero = await nextNumero(manager, "CT");
      const contrato = await manager.getRepository(ContratoEntity).save(
        manager.getRepository(ContratoEntity).create({
          numero,
          tutorId: data.tutorId,
          modalidadeId: data.modalidadeId,
          status: "ativo",
          valorMensal: data.valorMensal,
          periodicidade: data.periodicidade,
          inicioVigencia: data.inicioVigencia,
          fimVigencia: data.fimVigencia || null,
          observacoes: data.observacoes || null,
        }),
      );

      await manager
        .getRepository(ContratoPetEntity)
        .save(
          data.petsIds.map((petId) =>
            manager.getRepository(ContratoPetEntity).create({ contratoId: contrato.id, petId }),
          ),
        );
      await manager
        .getRepository(ContratoServicoEntity)
        .save(
          data.servicosIds.map((servicoProdutoId) =>
            manager
              .getRepository(ContratoServicoEntity)
              .create({ contratoId: contrato.id, servicoProdutoId }),
          ),
        );

      const completo = await manager.getRepository(ContratoEntity).findOneOrFail({
        where: { id: contrato.id },
        relations: { contratoPets: true, contratoServicos: true },
      });
      return toContratoDTO(completo);
    });
  });

/**
 * Gera a cobrança do mês corrente para um contrato ativo. O índice único
 * (contrato_id, competencia) em ordens_pagamento é a garantia real contra
 * cobrança duplicada no mesmo mês.
 */
export const gerarCobrancaContrato = createServerFn({ method: "POST" })
  .inputValidator(z.object({ contratoId: z.string().uuid() }))
  .handler(async ({ data }): Promise<Pagamento> => {
    await requirePermission("pagamento.gerenciar");
    const ds = await getDataSource();

    return ds.transaction(async (manager) => {
      const contrato = await manager
        .getRepository(ContratoEntity)
        .findOneBy({ id: data.contratoId });
      if (!contrato) throw new Error("Contrato não encontrado.");
      if (contrato.status !== "ativo") throw new Error("Contrato não está ativo.");

      const agora = new Date();
      const competencia = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-01`;
      const jaExiste = await manager.getRepository(OrdemPagamentoEntity).findOneBy({
        contratoId: contrato.id,
        competencia,
      });
      if (jaExiste) {
        const mm = competencia.slice(5, 7);
        throw new Error(`Já existe uma cobrança gerada para ${mm}/${agora.getFullYear()}.`);
      }

      const numero = await nextNumero(manager, "PG");
      const pagamento = await manager.getRepository(OrdemPagamentoEntity).save(
        manager.getRepository(OrdemPagamentoEntity).create({
          numero,
          origem: "contrato",
          contratoId: contrato.id,
          tutorId: contrato.tutorId,
          valorTotal: contrato.valorMensal,
          status: "aberto",
          competencia,
        }),
      );

      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 7);
      await manager.getRepository(ParcelaEntity).save(
        manager.getRepository(ParcelaEntity).create({
          ordemPagamentoId: pagamento.id,
          numero: 1,
          totalParcelas: 1,
          valor: contrato.valorMensal,
          status: "pendente",
          dataVencimento: vencimento.toISOString().slice(0, 10),
        }),
      );

      const completo = await manager.getRepository(OrdemPagamentoEntity).findOneOrFail({
        where: { id: pagamento.id },
        relations: { parcelas: true },
      });
      return {
        id: completo.id,
        numero: completo.numero,
        origem: completo.origem,
        contratoId: completo.contratoId ?? undefined,
        tutorId: completo.tutorId,
        valorTotal: completo.valorTotal,
        status: completo.status,
        parcelas: completo.parcelas.map((p) => ({
          id: p.id,
          numero: p.numero,
          valor: p.valor,
          vencimento: p.dataVencimento,
          status: p.status,
        })),
        criadoEm: completo.criadoEm.toISOString(),
      };
    });
  });
