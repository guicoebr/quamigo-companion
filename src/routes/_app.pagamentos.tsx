import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Pagamentos" description="Ordens de pagamento e parcelas. (Bloco 8)" />
      <DataTablePlaceholder />
    </>
  ),
});