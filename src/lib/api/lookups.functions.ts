import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import {
  Especie as EspecieEntity,
  Raca as RacaEntity,
  ModalidadeServico as ModalidadeServicoEntity,
} from "@/server/entities";
import { requireAuth, requirePermission } from "@/server/session.server";
import type { Especie, Raca, ModalidadeServico } from "@/types/lookup";

function toEspecieDTO(e: EspecieEntity): Especie {
  return { id: e.id, nome: e.nome, ativo: e.ativo };
}

function toRacaDTO(r: RacaEntity): Raca {
  return { id: r.id, especieId: r.especieId, nome: r.nome, ativo: r.ativo };
}

function toModalidadeDTO(m: ModalidadeServicoEntity): ModalidadeServico {
  return { id: m.id, nome: m.nome, descricao: m.descricao ?? undefined, ativo: m.ativo };
}

// --- Espécies ---

export const listEspecies = createServerFn({ method: "GET" }).handler(async (): Promise<Especie[]> => {
  await requireAuth();
  const ds = await getDataSource();
  const rows = await ds.getRepository(EspecieEntity).find({ order: { nome: "ASC" } });
  return rows.map(toEspecieDTO);
});

export const createEspecie = createServerFn({ method: "POST" })
  .inputValidator(z.object({ nome: z.string().min(2) }))
  .handler(async ({ data }): Promise<Especie> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(EspecieEntity);
    return toEspecieDTO(await repo.save(repo.create(data)));
  });

export const updateEspecie = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ id: z.string().uuid(), patch: z.object({ nome: z.string().min(2).optional(), ativo: z.boolean().optional() }) }),
  )
  .handler(async ({ data }): Promise<Especie> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(EspecieEntity);
    await repo.update(data.id, data.patch);
    return toEspecieDTO(await repo.findOneByOrFail({ id: data.id }));
  });

// --- Raças ---

export const listRacas = createServerFn({ method: "GET" }).handler(async (): Promise<Raca[]> => {
  await requireAuth();
  const ds = await getDataSource();
  const rows = await ds.getRepository(RacaEntity).find({ order: { nome: "ASC" } });
  return rows.map(toRacaDTO);
});

export const createRaca = createServerFn({ method: "POST" })
  .inputValidator(z.object({ nome: z.string().min(2), especieId: z.string().uuid() }))
  .handler(async ({ data }): Promise<Raca> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(RacaEntity);
    return toRacaDTO(await repo.save(repo.create(data)));
  });

export const updateRaca = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      patch: z.object({
        nome: z.string().min(2).optional(),
        especieId: z.string().uuid().optional(),
        ativo: z.boolean().optional(),
      }),
    }),
  )
  .handler(async ({ data }): Promise<Raca> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(RacaEntity);
    await repo.update(data.id, data.patch);
    return toRacaDTO(await repo.findOneByOrFail({ id: data.id }));
  });

// --- Modalidades de serviço ---

export const listModalidades = createServerFn({ method: "GET" }).handler(async (): Promise<ModalidadeServico[]> => {
  await requireAuth();
  const ds = await getDataSource();
  const rows = await ds.getRepository(ModalidadeServicoEntity).find({ order: { nome: "ASC" } });
  return rows.map(toModalidadeDTO);
});

export const createModalidade = createServerFn({ method: "POST" })
  .inputValidator(z.object({ nome: z.string().min(2), descricao: z.string().optional() }))
  .handler(async ({ data }): Promise<ModalidadeServico> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(ModalidadeServicoEntity);
    return toModalidadeDTO(await repo.save(repo.create(data)));
  });

export const updateModalidade = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      patch: z.object({
        nome: z.string().min(2).optional(),
        descricao: z.string().optional(),
        ativo: z.boolean().optional(),
      }),
    }),
  )
  .handler(async ({ data }): Promise<ModalidadeServico> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(ModalidadeServicoEntity);
    await repo.update(data.id, data.patch);
    return toModalidadeDTO(await repo.findOneByOrFail({ id: data.id }));
  });
