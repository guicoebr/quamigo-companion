import { create } from "zustand";
import type { Role, User } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * authStore — sessão gerida pelo Lovable Cloud (Supabase Auth).
 *
 * `hydrate()` lê a sessão do Supabase e monta o objeto User (nome via profiles,
 * role via user_roles). Não persistimos nada extra em localStorage — o supabase
 * client já cuida disso.
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

function iniciaisFromNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

async function buildUserFromSession(userId: string, email: string): Promise<User | null> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("nome, email").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const nome = profile?.nome?.trim() || email.split("@")[0];
  const role = (roles?.[0]?.role ?? null) as Role | null;
  if (!role) return null;
  return {
    id: userId,
    nome,
    email: profile?.email || email,
    role,
    iniciais: iniciaisFromNome(nome),
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) {
      set({ user: null, hydrated: true });
      return;
    }
    const user = await buildUserFromSession(session.user.id, session.user.email ?? "");
    set({ user, hydrated: true });
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const msg = error?.message?.toLowerCase() ?? "";
      const traduzido = msg.includes("invalid login credentials")
        ? "E-mail ou senha incorretos."
        : error?.message || "Não foi possível entrar.";
      return { ok: false, error: traduzido };
    }
    const user = await buildUserFromSession(data.user.id, data.user.email ?? email);
    if (!user) {
      await supabase.auth.signOut();
      return { ok: false, error: "Seu usuário não tem papel atribuído. Contate o administrador." };
    }
    set({ user, hydrated: true });
    return { ok: true, user };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, hydrated: true });
  },
}));

// Mantém o store em sincronia se o Supabase renovar/limpar a sessão em outra aba.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session?.user) {
      useAuthStore.setState({ user: null, hydrated: true });
      return;
    }
    if (event === "TOKEN_REFRESHED") return; // já validado
    void buildUserFromSession(session.user.id, session.user.email ?? "").then((user) => {
      useAuthStore.setState({ user, hydrated: true });
    });
  });
}

/** Acesso síncrono fora de componentes (ex.: beforeLoad). */
export function getCurrentRole(): Role | null {
  return useAuthStore.getState().user?.role ?? null;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().user !== null;
}
