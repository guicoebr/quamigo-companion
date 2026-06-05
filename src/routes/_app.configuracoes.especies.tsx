import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { EspeciesRacasTab } from "@/components/config/EspeciesRacasTab";
import { ConfigTabsNav } from "./_app.configuracoes";

export const Route = createFileRoute("/_app/configuracoes/especies")({
  head: () => ({ meta: [{ title: "Espécies — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Configurações" description="Gerencie espécies e raças." />
      <ConfigTabsNav active="especies" />
      <div className="mt-4"><EspeciesRacasTab /></div>
    </>
  ),
});