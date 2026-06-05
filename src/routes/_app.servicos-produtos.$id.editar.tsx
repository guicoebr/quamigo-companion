import { createFileRoute } from "@tanstack/react-router";
import { ServicoProdutoFormPage } from "@/components/forms/ServicoProdutoFormPage";

export const Route = createFileRoute("/_app/servicos-produtos/$id/editar")({
  head: () => ({ meta: [{ title: "Editar item — +QAmigo" }] }),
  component: () => <ServicoProdutoFormPage mode="editar" />,
});