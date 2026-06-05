import { createFileRoute } from "@tanstack/react-router";
import { TutorFormPage } from "@/components/forms/TutorFormPage";

export const Route = createFileRoute("/_app/tutores/novo")({
  head: () => ({ meta: [{ title: "Novo tutor — +QAmigo" }] }),
  component: () => <TutorFormPage mode="novo" />,
});