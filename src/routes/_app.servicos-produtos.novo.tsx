import { createFileRoute } from "@tanstack/react-router";
import { ServicoProdutoFormPage } from "@/components/forms/ServicoProdutoFormPage";

export const Route = createFileRoute("/_app/servicos-produtos/novo")({
  head: () => ({ meta: [{ title: "Novo item — +QAmigo" }] }),
  component: () => <ServicoProdutoFormPage mode="novo" />,
});