import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Pet } from "@/types/pet";

type PetRow = {
  id: string;
  tutor_id: string;
  especie_id: string | null;
  raca_id: string | null;
  nome: string;
  sexo: string;
  cor: string;
  peso_kg: number | string;
  data_nascimento: string | null;
  data_falecimento: string | null;
  observacoes: string | null;
  criado_em: string;
};

const PET_COLS =
  "id, tutor_id, especie_id, raca_id, nome, sexo, cor, peso_kg, data_nascimento, data_falecimento, observacoes, criado_em";

function toPetDTO(p: PetRow): Pet {
  return {
    id: p.id,
    tutorId: p.tutor_id,
    nome: p.nome,
    especieId: p.especie_id ?? "",
    racaId: p.raca_id ?? "",
    sexo: p.sexo as Pet["sexo"],
    cor: p.cor,
    pesoKg: Number(p.peso_kg),
    dataNascimento: p.data_nascimento ?? undefined,
    dataFalecimento: p.data_falecimento ?? undefined,
    observacoes: p.observacoes ?? undefined,
    criadoEm: p.criado_em,
  };
}

export const listPets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Pet[]> => {
    const { data, error } = await context.supabase.from("pets").select(PET_COLS).order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toPetDTO(r as PetRow));
  });

export const getPet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<Pet | null> => {
    const { data: row, error } = await context.supabase
      .from("pets")
      .select(PET_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toPetDTO(row as PetRow) : null;
  });

export const createPet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }): Promise<Pet> => {
    const { data: row, error } = await context.supabase
      .from("pets")
      .insert({
        tutor_id: data.tutorId,
        nome: data.nome,
        especie_id: data.especieId,
        raca_id: data.racaId,
        sexo: data.sexo,
        cor: data.cor,
        peso_kg: data.pesoKg,
        data_nascimento: data.dataNascimento || null,
        observacoes: data.observacoes || null,
      })
      .select(PET_COLS)
      .single();
    if (error) throw new Error(error.message);
    return toPetDTO(row as PetRow);
  });

export const updatePet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }): Promise<Pet> => {
    const p = data.patch;
    const patch: Record<string, unknown> = {};
    if (p.tutorId !== undefined) patch.tutor_id = p.tutorId;
    if (p.nome !== undefined) patch.nome = p.nome;
    if (p.especieId !== undefined) patch.especie_id = p.especieId;
    if (p.racaId !== undefined) patch.raca_id = p.racaId;
    if (p.sexo !== undefined) patch.sexo = p.sexo;
    if (p.cor !== undefined) patch.cor = p.cor;
    if (p.pesoKg !== undefined) patch.peso_kg = p.pesoKg;
    if (p.dataNascimento !== undefined) patch.data_nascimento = p.dataNascimento || null;
    if (p.dataFalecimento !== undefined) patch.data_falecimento = p.dataFalecimento || null;
    if (p.observacoes !== undefined) patch.observacoes = p.observacoes || null;

    const { data: row, error } = await context.supabase
      .from("pets")
      .update(patch as never)
      .eq("id", data.id)
      .select(PET_COLS)
      .single();
    if (error) throw new Error(error.message);
    return toPetDTO(row as PetRow);
  });
