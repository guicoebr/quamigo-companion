import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { DataTablePlaceholder } from "@/components/tables/DataTablePlaceholder";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — +QAmigo" }] }),
  component: DashboardStub,
});

function DashboardStub() {
  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral da operação. (Conteúdo completo no Bloco 4)" />
      <DataTablePlaceholder
        title="Cards e tabela em construção"
        description="OS abertas, contratos ativos e pagamentos pendentes serão exibidos aqui."
      />
    </>
  );
}