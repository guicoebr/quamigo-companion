import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { ModalidadesTab } from "@/components/config/ModalidadesTab";
import { ConfigTabsNav } from "./_app.configuracoes";

export const Route = createFileRoute("/_app/configuracoes/modalidades")({
  head: () => ({ meta: [{ title: "Modalidades — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Configurações" description="Gerencie modalidades de serviço." />
      <ConfigTabsNav active="modalidades" />
      <div className="mt-4"><ModalidadesTab /></div>
    </>
  ),
});