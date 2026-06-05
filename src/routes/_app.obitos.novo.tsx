import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/obitos/novo")({
  head: () => ({ meta: [{ title: "Registrar óbito — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Registrar óbito" description="Stepper de 4 passos. (Bloco 6)" />
      <DataTablePlaceholder title="Stepper em construção" description="Será implementado no Bloco 6." />
    </>
  ),
});