import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Especie, Raca, ModalidadeServico } from "@/types/lookup";

// --- Espécies ---

export const listEspecies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Especie[]> => {
    const { data, error } = await context.supabase
      .from("especies")
      .select("id, nome, ativo")
      .order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []) as Especie[];
  });

export const createEspecie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ nome: z.string().min(2) }))
  .handler(async ({ data, context }): Promise<Especie> => {
    const { data: row, error } = await context.supabase
      .from("especies")
      .insert({ nome: data.nome })
      .select("id, nome, ativo")
      .single();
    if (error) throw new Error(error.message);
    return row as Especie;
  });

export const updateEspecie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      patch: z.object({ nome: z.string().min(2).optional(), ativo: z.boolean().optional() }),
    }),
  )
  .handler(async ({ data, context }): Promise<Especie> => {
    const { data: row, error } = await context.supabase
      .from("especies")
      .update(data.patch as never)
      .eq("id", data.id)
      .select("id, nome, ativo")
      .single();
    if (error) throw new Error(error.message);
    return row as Especie;
  });

// --- Raças ---

export const listRacas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Raca[]> => {
    const { data, error } = await context.supabase
      .from("racas")
      .select("id, especie_id, nome, ativo")
      .order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      especieId: r.especie_id,
      nome: r.nome,
      ativo: r.ativo,
    }));
  });

export const createRaca = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ nome: z.string().min(2), especieId: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<Raca> => {
    const { data: row, error } = await context.supabase
      .from("racas")
      .insert({ nome: data.nome, especie_id: data.especieId })
      .select("id, especie_id, nome, ativo")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, especieId: row.especie_id, nome: row.nome, ativo: row.ativo };
  });

export const updateRaca = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }): Promise<Raca> => {
    const patch: Record<string, unknown> = {};
    if (data.patch.nome !== undefined) patch.nome = data.patch.nome;
    if (data.patch.especieId !== undefined) patch.especie_id = data.patch.especieId;
    if (data.patch.ativo !== undefined) patch.ativo = data.patch.ativo;
    const { data: row, error } = await context.supabase
      .from("racas")
      .update(patch as never)
      .eq("id", data.id)
      .select("id, especie_id, nome, ativo")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, especieId: row.especie_id, nome: row.nome, ativo: row.ativo };
  });

// --- Modalidades ---

export const listModalidades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ModalidadeServico[]> => {
    const { data, error } = await context.supabase
      .from("modalidades_servico")
      .select("id, nome, descricao, ativo")
      .order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []).map((m) => ({
      id: m.id,
      nome: m.nome,
      descricao: m.descricao ?? undefined,
      ativo: m.ativo,
    }));
  });

export const createModalidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ nome: z.string().min(2), descricao: z.string().optional() }))
  .handler(async ({ data, context }): Promise<ModalidadeServico> => {
    const { data: row, error } = await context.supabase
      .from("modalidades_servico")
      .insert({ nome: data.nome, descricao: data.descricao ?? null })
      .select("id, nome, descricao, ativo")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, nome: row.nome, descricao: row.descricao ?? undefined, ativo: row.ativo };
  });

export const updateModalidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .handler(async ({ data, context }): Promise<ModalidadeServico> => {
    const { data: row, error } = await context.supabase
      .from("modalidades_servico")
      .update(data.patch as never)
      .eq("id", data.id)
      .select("id, nome, descricao, ativo")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, nome: row.nome, descricao: row.descricao ?? undefined, ativo: row.ativo };
  });
