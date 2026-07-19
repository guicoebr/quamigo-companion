import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { defaultRouteForRole } from "@/lib/permissions";
import { brand } from "@/design/brand";

type LoginSearch = { redirect?: string };

const NON_DESTINATIONS = new Set(["/", "/login", "/brand-book"]);

function resolvePostLoginTarget(
  redirectTo: string | undefined,
  role: Parameters<typeof defaultRouteForRole>[0],
): string {
  if (!redirectTo) return defaultRouteForRole(role);
  const path = redirectTo.split("?")[0].split("#")[0];
  if (NON_DESTINATIONS.has(path)) return defaultRouteForRole(role);
  return redirectTo;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const store = useAuthStore.getState();
    if (!store.hydrated) await store.hydrate();
    const user = useAuthStore.getState().user;
    if (user) {
      throw redirect({ to: resolvePostLoginTarget(search.redirect, user.role) });
    }
  },
  head: () => ({ meta: [{ title: "Entrar — +QAmigo" }] }),
  component: LoginPage,
});


function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate({ to: search.redirect ?? defaultRouteForRole(result.user.role) });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PawPrint className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold leading-tight">{brand.name}</p>
            <p className="text-xs text-muted-foreground">{brand.tagline}</p>
          </div>
        </div>

        <Card className="rounded-[12px]">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
