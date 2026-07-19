import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import { Tutor as TutorEntity } from "@/server/entities";
import { requireAuth, requirePermission } from "@/server/session.server";
import type { Tutor } from "@/types/tutor";

function toTutorDTO(t: TutorEntity): Tutor {
  return {
    id: t.id,
    nome: t.nome,
    cpf: t.cpf,
    email: t.email,
    telefone: t.telefone,
    endereco: {
      cep: t.cep,
      logradouro: t.logradouro,
      numero: t.numero,
      complemento: t.complemento ?? undefined,
      bairro: t.bairro,
      cidade: t.cidade,
      uf: t.uf,
    },
    observacoes: t.observacoes ?? undefined,
    criadoEm: t.criadoEm.toISOString(),
  };
}

// Lista completa — a busca por nome/CPF/e-mail já é feita no client (mesmo padrão do mock;
// volume de tutores de uma funerária não justifica paginação/busca no servidor ainda).
export const listTutores = createServerFn({ method: "GET" }).handler(async (): Promise<Tutor[]> => {
  await requireAuth();
  const ds = await getDataSource();
  const tutores = await ds.getRepository(TutorEntity).find({ order: { nome: "ASC" } });
  return tutores.map(toTutorDTO);
});

export const getTutor = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }): Promise<Tutor | null> => {
    await requireAuth();
    const ds = await getDataSource();
    const tutor = await ds.getRepository(TutorEntity).findOneBy({ id: data.id });
    return tutor ? toTutorDTO(tutor) : null;
  });

const enderecoInput = z.object({
  cep: z.string(),
  logradouro: z.string(),
  numero: z.string(),
  complemento: z.string().optional(),
  bairro: z.string(),
  cidade: z.string(),
  uf: z.string().refine((v) => v === "" || v.length === 2, { message: "UF com 2 letras." }),
});

const tutorInput = z.object({
  nome: z.string().min(2),
  cpf: z.string(),
  email: z.string(),
  telefone: z.string(),
  endereco: enderecoInput,
  observacoes: z.string().optional(),
});

function translateUniqueViolation(err: unknown): never {
  const e = err as { code?: string; detail?: string; message?: string };
  if (e?.code === "23505") {
    const detail = e.detail ?? e.message ?? "";
    if (/cpf/i.test(detail)) throw new Error("Já existe um tutor cadastrado com este CPF.");
    if (/email/i.test(detail)) throw new Error("Já existe um tutor cadastrado com este e-mail.");
    throw new Error("Já existe um tutor com estes dados.");
  }
  throw err as Error;
}

export const createTutor = createServerFn({ method: "POST" })
  .inputValidator(tutorInput)
  .handler(async ({ data }): Promise<Tutor> => {
    await requirePermission("tutor.criar");
    const ds = await getDataSource();
    try {
      const saved = await ds.getRepository(TutorEntity).save(
        ds.getRepository(TutorEntity).create({
          nome: data.nome,
          cpf: data.cpf.replace(/\D/g, ""),
          email: data.email,
          telefone: data.telefone.replace(/\D/g, ""),
          cep: data.endereco.cep.replace(/\D/g, ""),
          logradouro: data.endereco.logradouro,
          numero: data.endereco.numero,
          complemento: data.endereco.complemento || null,
          bairro: data.endereco.bairro,
          cidade: data.endereco.cidade,
          uf: data.endereco.uf.toUpperCase(),
          observacoes: data.observacoes || null,
        }),
      );
      return toTutorDTO(saved);
    } catch (err) {
      translateUniqueViolation(err);
    }
  });

export const updateTutor = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), patch: tutorInput.partial() }))
  .handler(async ({ data }): Promise<Tutor> => {
    await requirePermission("tutor.editar");
    const ds = await getDataSource();
    const { endereco, ...rest } = data.patch;
    await ds.getRepository(TutorEntity).update(data.id, {
      ...rest,
      cpf: rest.cpf ? rest.cpf.replace(/\D/g, "") : undefined,
      telefone: rest.telefone ? rest.telefone.replace(/\D/g, "") : undefined,
      ...(endereco && {
        cep: endereco.cep.replace(/\D/g, ""),
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento || null,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf.toUpperCase(),
      }),
    });
    return toTutorDTO(await ds.getRepository(TutorEntity).findOneByOrFail({ id: data.id }));
  });
