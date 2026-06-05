import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { EspeciesRacasTab } from "@/components/config/EspeciesRacasTab";
import { ConfigTabsNav } from "./_app.configuracoes";

export const Route = createFileRoute("/_app/configuracoes/racas")({
  head: () => ({ meta: [{ title: "Raças — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Configurações" description="Gerencie raças por espécie." />
      <ConfigTabsNav active="racas" />
      <div className="mt-4"><EspeciesRacasTab /></div>
    </>
  ),
});