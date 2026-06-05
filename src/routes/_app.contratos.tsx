import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/contratos")({
  head: () => ({ meta: [{ title: "Contratos — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Contratos" description="Gestão de contratos. (Bloco 8)" />
      <DataTablePlaceholder />
    </>
  ),
});