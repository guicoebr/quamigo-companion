import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // TODO(auth Bloco 2): redirecionar para /login se não houver sessão.
    throw redirect({ to: "/dashboard" });
  },
});
