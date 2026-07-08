import { create } from "zustand";
import type { Role, User } from "@/types/auth";
import { login as loginFn, logout as logoutFn, me as meFn } from "@/lib/api/auth.functions";

/**
 * authStore — sessão real via cookie httpOnly (ver src/server/auth.server.ts).
 *
 * Não persiste `user` em localStorage: a sessão é o cookie selado pelo servidor.
 * `hydrate()` chama a server function `me()` para reidratar o estado no boot da SPA
 * (rotas client-only chamam isso no `beforeLoad` antes de decidir redirects).
 */

type AuthState = {
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrate: async () => {
    const user = await meFn();
    set({ user, hydrated: true });
  },

  login: async (email, password) => {
    const result = await loginFn({ data: { email, senha: password } });
    if (result.ok) {
      set({ user: result.user, hydrated: true });
    }
    return result;
  },

  logout: async () => {
    await logoutFn();
    set({ user: null });
  },
}));

/** Acesso síncrono fora de componentes (ex.: beforeLoad) — chamar hydrate() antes se preciso. */
export function getCurrentRole(): Role | null {
  return useAuthStore.getState().user?.role ?? null;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().user !== null;
}
