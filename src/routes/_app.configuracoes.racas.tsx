import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Rota legada — a antiga tela de "Raças" foi fundida com "Espécies" em
 * /configuracoes/especies (master-detail). Este redirect preserva o
 * `especieId` da URL antiga e usa `replace: true` para não poluir o histórico.
 */
export const Route = createFileRoute("/_app/configuracoes/racas")({
  validateSearch: (search: Record<string, unknown>) => ({
    especieId: typeof search.especieId === "string" ? search.especieId : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/configuracoes/especies",
      search: search.especieId ? { especieId: search.especieId } : {},
      replace: true,
    });
  },
});
