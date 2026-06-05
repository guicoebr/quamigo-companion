import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/servicos-produtos")({
  head: () => ({ meta: [{ title: "Serviços e produtos — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Serviços e produtos" description="Catálogo. (Bloco 8)" />
      <DataTablePlaceholder />
    </>
  ),
});