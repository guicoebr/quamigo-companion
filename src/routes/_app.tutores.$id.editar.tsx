import { createFileRoute } from "@tanstack/react-router";
import { TutorFormPage } from "@/components/forms/TutorFormPage";

export const Route = createFileRoute("/_app/tutores/$id/editar")({
  head: () => ({ meta: [{ title: "Editar tutor — +QAmigo" }] }),
  component: () => <TutorFormPage mode="editar" />,
});