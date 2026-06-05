import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Configurações" description="Área administrativa. (Bloco 9)" />
      <DataTablePlaceholder />
    </>
  ),
});