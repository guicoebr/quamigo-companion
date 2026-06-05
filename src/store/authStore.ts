import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role, User } from "@/types/auth";

/**
 * authStore — sessão mock persistida em localStorage.
 *
 * TODO(api): substituir `login()` por uma chamada real (createServerFn) e
 * armazenar apenas tokens/claims essenciais. Não persistir dados sensíveis.
 */

type MockCredential = {
  email: string;
  password: string;
  user: User;
};

const MOCK_USERS: MockCredential[] = [
  {
    email: "admin@qamigo.com",
    password: "123456",
    user: { id: "u-admin", nome: "Ana Administradora", email: "admin@qamigo.com", role: "admin", iniciais: "AA" },
  },
  {
    email: "op@qamigo.com",
    password: "123456",
    user: { id: "u-op", nome: "Otávio Operacional", email: "op@qamigo.com", role: "operacional", iniciais: "OO" },
  },
  {
    email: "fin@qamigo.com",
    password: "123456",
    user: { id: "u-fin", nome: "Fernanda Financeiro", email: "fin@qamigo.com", role: "financeiro", iniciais: "FF" },
  },
  {
    email: "rec@qamigo.com",
    password: "123456",
    user: { id: "u-rec", nome: "Renata Recepção", email: "rec@qamigo.com", role: "recepcao", iniciais: "RR" },
  },
];

export const MOCK_LOGIN_HINTS = MOCK_USERS.map((m) => ({
  email: m.email,
  password: m.password,
  role: m.user.role,
  nome: m.user.nome,
}));

type AuthState = {
  user: User | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logout: () => void;
  setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      login: async (email, password) => {
        // Pequeno delay simulando rede.
        await new Promise((r) => setTimeout(r, 250));
        const match = MOCK_USERS.find(
          (m) => m.email.toLowerCase() === email.toLowerCase() && m.password === password,
        );
        if (!match) {
          return { ok: false, error: "E-mail ou senha inválidos." };
        }
        set({ user: match.user });
        return { ok: true, user: match.user };
      },
      logout: () => set({ user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "qamigo.auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** Acesso síncrono fora de componentes (ex.: beforeLoad). */
export function getCurrentRole(): Role | null {
  return useAuthStore.getState().user?.role ?? null;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().user !== null;
}