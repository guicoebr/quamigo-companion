import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LogIn, PawPrint } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Entrar — +QAmigo" }] }),
  component: LoginPage,
});


function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const login = useAuthStore((s) => s.login);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      void hydrate().catch(() => {
        // Keep the login form usable when session restoration is unavailable.
      });
    }
  }, [hydrate, hydrated]);

  useEffect(() => {
    if (hydrated && user) {
      void navigate({
        to: resolvePostLoginTarget(search.redirect, user.role),
        replace: true,
      });
    }
  }, [hydrated, navigate, search.redirect, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await navigate({ to: resolvePostLoginTarget(search.redirect, result.user.role) });
    } catch (loginError) {
      console.error(loginError);
      const message = loginError instanceof Error ? loginError.message.toLowerCase() : "";
      setError(
        message.includes("missing supabase environment")
          ? "O acesso está temporariamente indisponível por uma falha de configuração. Tente novamente em alguns minutos."
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={!clientReady || loading}
                aria-busy={loading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {!clientReady ? "Carregando..." : loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
