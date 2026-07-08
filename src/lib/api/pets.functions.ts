import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import { Pet as PetEntity } from "@/server/entities";
import { requireAuth, requirePermission } from "@/server/session.server";
import type { Pet } from "@/types/pet";

function toPetDTO(p: PetEntity): Pet {
  return {
    id: p.id,
    tutorId: p.tutorId,
    nome: p.nome,
    especieId: p.especieId ?? "",
    racaId: p.racaId ?? "",
    sexo: p.sexo,
    cor: p.cor,
    pesoKg: p.pesoKg,
    dataNascimento: p.dataNascimento ?? undefined,
    dataFalecimento: p.dataFalecimento ?? undefined,
    observacoes: p.observacoes ?? undefined,
    criadoEm: p.criadoEm.toISOString(),
  };
}

export const listPets = createServerFn({ method: "GET" }).handler(async (): Promise<Pet[]> => {
  await requireAuth();
  const ds = await getDataSource();
  const pets = await ds.getRepository(PetEntity).find({ order: { nome: "ASC" } });
  return pets.map(toPetDTO);
});

export const getPet = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<Pet | null> => {
    await requireAuth();
    const ds = await getDataSource();
    const pet = await ds.getRepository(PetEntity).findOneBy({ id: data.id });
    return pet ? toPetDTO(pet) : null;
  });

export const createPet = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      tutorId: z.string().uuid(),
      nome: z.string().min(1),
      especieId: z.string().uuid(),
      racaId: z.string().uuid(),
      sexo: z.enum(["macho", "femea"]),
      cor: z.string().min(1),
      pesoKg: z.number().min(0),
      dataNascimento: z.string().optional(),
      observacoes: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<Pet> => {
    await requirePermission("pet.criar");
    const ds = await getDataSource();
    const saved = await ds.getRepository(PetEntity).save(
      ds.getRepository(PetEntity).create({
        tutorId: data.tutorId,
        nome: data.nome,
        especieId: data.especieId,
        racaId: data.racaId,
        sexo: data.sexo,
        cor: data.cor,
        pesoKg: data.pesoKg,
        dataNascimento: data.dataNascimento || null,
        observacoes: data.observacoes || null,
      }),
    );
    return toPetDTO(saved);
  });

export const updatePet = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      patch: z.object({
        tutorId: z.string().uuid().optional(),
        nome: z.string().min(1).optional(),
        especieId: z.string().uuid().optional(),
        racaId: z.string().uuid().optional(),
        sexo: z.enum(["macho", "femea"]).optional(),
        cor: z.string().optional(),
        pesoKg: z.number().min(0).optional(),
        dataNascimento: z.string().optional(),
        dataFalecimento: z.string().optional(),
        observacoes: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data }): Promise<Pet> => {
    await requirePermission("pet.editar");
    const ds = await getDataSource();
    await ds.getRepository(PetEntity).update(data.id, data.patch);
    return toPetDTO(await ds.getRepository(PetEntity).findOneByOrFail({ id: data.id }));
  });
