import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { defaultRouteForRole } from "@/lib/permissions";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: "/login" });
    throw redirect({ to: defaultRouteForRole(user.role) });
  },
});
