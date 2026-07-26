import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tutor } from "@/types/tutor";

type TutorRow = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  observacoes: string | null;
  criado_em: string;
};

function toTutorDTO(t: TutorRow): Tutor {
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
    criadoEm: t.criado_em,
  };
}

const TUTOR_COLS =
  "id, nome, cpf, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf, observacoes, criado_em";

export const listTutores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Tutor[]> => {
    const { data, error } = await context.supabase
      .from("tutores")
      .select(TUTOR_COLS)
      .order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toTutorDTO(r as TutorRow));
  });

export const getTutor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<Tutor | null> => {
    const { data: row, error } = await context.supabase
      .from("tutores")
      .select(TUTOR_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toTutorDTO(row as TutorRow) : null;
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

function translateSupabaseError(err: { code?: string; message?: string; details?: string | null }): never {
  const detail = (err.details ?? err.message ?? "").toString();
  if (err.code === "23505") {
    if (/cpf/i.test(detail)) throw new Error("Já existe um tutor cadastrado com este CPF.");
    if (/email/i.test(detail)) throw new Error("Já existe um tutor cadastrado com este e-mail.");
    throw new Error("Já existe um tutor com estes dados.");
  }
  throw new Error(err.message || "Erro ao salvar tutor.");
}

export const createTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(tutorInput)
  .handler(async ({ data, context }): Promise<Tutor> => {
    const { data: row, error } = await context.supabase
      .from("tutores")
      .insert({
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
      })
      .select(TUTOR_COLS)
      .single();
    if (error) translateSupabaseError(error);
    return toTutorDTO(row as TutorRow);
  });

export const updateTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), patch: tutorInput.partial() }))
  .handler(async ({ data, context }): Promise<Tutor> => {
    const { endereco, ...rest } = data.patch;
    const patch: Record<string, unknown> = { ...rest };
    if (rest.cpf) patch.cpf = rest.cpf.replace(/\D/g, "");
    if (rest.telefone) patch.telefone = rest.telefone.replace(/\D/g, "");
    if (endereco) {
      patch.cep = endereco.cep.replace(/\D/g, "");
      patch.logradouro = endereco.logradouro;
      patch.numero = endereco.numero;
      patch.complemento = endereco.complemento || null;
      patch.bairro = endereco.bairro;
      patch.cidade = endereco.cidade;
      patch.uf = endereco.uf.toUpperCase();
    }
    const { data: row, error } = await context.supabase
      .from("tutores")
      .update(patch as never)
      .eq("id", data.id)
      .select(TUTOR_COLS)
      .single();
    if (error) translateSupabaseError(error);
    return toTutorDTO(row as TutorRow);
  });
