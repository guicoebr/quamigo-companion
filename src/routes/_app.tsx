import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Layout pathless `_app` — envolve todas as rotas internas no AppShell
 * (sidebar + topbar). A proteção por sessão/role será adicionada no Bloco 2,
 * provavelmente migrando para `_authenticated` com `beforeLoad`.
 */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}