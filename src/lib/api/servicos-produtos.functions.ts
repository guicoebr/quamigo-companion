import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import { ServicoProduto as ServicoProdutoEntity } from "@/server/entities";
import { requireAuth, requirePermission } from "@/server/session.server";
import type { ServicoProduto } from "@/types/lookup";

function toDTO(s: ServicoProdutoEntity): ServicoProduto {
  return { id: s.id, nome: s.nome, tipo: s.tipo, descricao: s.descricao ?? undefined, preco: s.preco, ativo: s.ativo };
}

export const listServicosProdutos = createServerFn({ method: "GET" }).handler(async (): Promise<ServicoProduto[]> => {
  await requireAuth();
  const ds = await getDataSource();
  const rows = await ds.getRepository(ServicoProdutoEntity).find({ order: { nome: "ASC" } });
  return rows.map(toDTO);
});

const servicoProdutoInput = z.object({
  nome: z.string().min(2),
  tipo: z.enum(["servico", "produto"]),
  descricao: z.string().optional(),
  preco: z.number().min(0),
  ativo: z.boolean(),
});

export const createServicoProduto = createServerFn({ method: "POST" })
  .inputValidator(servicoProdutoInput)
  .handler(async ({ data }): Promise<ServicoProduto> => {
    await requirePermission("servico.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(ServicoProdutoEntity);
    return toDTO(await repo.save(repo.create(data)));
  });

export const updateServicoProduto = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid(), patch: servicoProdutoInput.partial() }))
  .handler(async ({ data }): Promise<ServicoProduto> => {
    await requirePermission("servico.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(ServicoProdutoEntity);
    await repo.update(data.id, data.patch);
    return toDTO(await repo.findOneByOrFail({ id: data.id }));
  });
