import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/authStore";
import { canAccessRoute } from "@/lib/permissions";

/**
 * Layout pathless `_app` — envolve todas as rotas internas no AppShell.
 *
 * Guards:
 *  - exige sessão (usuário no authStore persistido em localStorage);
 *  - sem sessão → redireciona para /login preservando a URL alvo;
 *  - sem permissão para a rota corrente → /unauthorized.
 *
 * `ssr: false` evita ler localStorage no servidor (a sessão mock é client-only).
 */
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const user = useAuthStore.getState().user;
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (!canAccessRoute(location.pathname, user.role)) {
      throw redirect({ to: "/unauthorized" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}