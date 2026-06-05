import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/pets")({
  head: () => ({ meta: [{ title: "Pets — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Pets" description="Gestão de pets. (Bloco 5)" />
      <DataTablePlaceholder />
    </>
  ),
});