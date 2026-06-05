import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/tutores")({
  head: () => ({ meta: [{ title: "Tutores — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Tutores" description="Gestão de tutores. (Bloco 5)" />
      <DataTablePlaceholder />
    </>
  ),
});