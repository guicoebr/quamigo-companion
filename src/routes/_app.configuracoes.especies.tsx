import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { EspeciesRacasTab } from "@/components/config/EspeciesRacasTab";
import { ConfigTabsNav } from "./_app.configuracoes";

type EspeciesSearch = { especieId?: string };

export const Route = createFileRoute("/_app/configuracoes/especies")({
  validateSearch: (search: Record<string, unknown>): EspeciesSearch => ({
    especieId: typeof search.especieId === "string" && search.especieId.length > 0
      ? search.especieId
      : undefined,
  }),
  head: () => ({ meta: [{ title: "Espécies e raças — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader
        title="Configurações"
        description="Gerencie espécies e as raças vinculadas a cada uma."
      />
      <ConfigTabsNav active="especies" />
      <div className="mt-4"><EspeciesRacasTab /></div>
    </>
  ),
});
