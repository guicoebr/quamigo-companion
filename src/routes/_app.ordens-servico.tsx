import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/ordens-servico")({
  head: () => ({ meta: [{ title: "Ordens de serviço — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Ordens de serviço" description="Listagem completa de OS. (Bloco 7)" />
      <DataTablePlaceholder />
    </>
  ),
});