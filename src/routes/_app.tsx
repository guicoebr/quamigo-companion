import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/authStore";
import { canAccessRoute } from "@/lib/permissions";

/**
 * Layout pathless `_app` — envolve todas as rotas internas no AppShell.
 *
 * Guards:
 *  - exige sessão (cookie httpOnly validado via server function `me()`);
 *  - sem sessão → redireciona para /login preservando a URL alvo;
 *  - sem permissão para a rota corrente → /unauthorized.
 *    (isso é só UX — a autorização de verdade é reforçada em cada server function
 *    via requireAuth()/requirePermission(), ver src/server/session.server.ts)
 *
 * `ssr: false` evita tentar validar sessão durante SSR; a hidratação acontece no
  * client via `hydrate()` antes de decidir o redirect.
 */
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const store = useAuthStore.getState();
    // Revalida o cookie no servidor em toda navegação. O estado Zustand pode
    // continuar com um usuário antigo depois que a sessão expira ou é perdida;
    // confiar apenas em `hydrated` deixaria a página disparar queries protegidas.
    await store.hydrate();
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
