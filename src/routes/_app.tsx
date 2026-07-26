import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/authStore";
import { canAccessRoute } from "@/lib/permissions";

/**
 * Layout pathless `_app` — envolve todas as rotas internas no AppShell.
 *
 * Guards:
 *  - exige sessão (Supabase Auth via localStorage);
 *  - sem sessão → /login preservando URL alvo;
 *  - sem permissão para a rota corrente → /unauthorized.
 *    (isso é só UX — a autorização real vive nas RLS policies do banco.)
 *
 * `ssr: false` evita tentar ler a sessão no servidor (localStorage não existe lá).
 */
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const store = useAuthStore.getState();
    if (!store.hydrated) {
      await store.hydrate();
    }
    const user = useAuthStore.getState().user;
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
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
