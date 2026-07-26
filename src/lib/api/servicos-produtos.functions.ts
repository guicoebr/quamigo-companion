import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ServicoProduto } from "@/types/lookup";

type SPRow = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  preco: number | string;
  ativo: boolean;
};

const SP_COLS = "id, nome, tipo, descricao, preco, ativo";

function toDTO(s: SPRow): ServicoProduto {
  return {
    id: s.id,
    nome: s.nome,
    tipo: s.tipo as ServicoProduto["tipo"],
    descricao: s.descricao ?? undefined,
    preco: Number(s.preco),
    ativo: s.ativo,
  };
}

export const listServicosProdutos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServicoProduto[]> => {
    const { data, error } = await context.supabase
      .from("servicos_produtos")
      .select(SP_COLS)
      .order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toDTO(r as SPRow));
  });

const servicoProdutoInput = z.object({
  nome: z.string().min(2),
  tipo: z.enum(["servico", "produto"]),
  descricao: z.string().optional(),
  preco: z.number().min(0),
  ativo: z.boolean(),
});

export const createServicoProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(servicoProdutoInput)
  .handler(async ({ data, context }): Promise<ServicoProduto> => {
    const { data: row, error } = await context.supabase
      .from("servicos_produtos")
      .insert({
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao ?? null,
        preco: data.preco,
        ativo: data.ativo,
      })
      .select(SP_COLS)
      .single();
    if (error) throw new Error(error.message);
    return toDTO(row as SPRow);
  });

export const updateServicoProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), patch: servicoProdutoInput.partial() }))
  .handler(async ({ data, context }): Promise<ServicoProduto> => {
    const { data: row, error } = await context.supabase
      .from("servicos_produtos")
      .update(data.patch as never)
      .eq("id", data.id)
      .select(SP_COLS)
      .single();
    if (error) throw new Error(error.message);
    return toDTO(row as SPRow);
  });
