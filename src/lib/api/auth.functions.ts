/**
 * Compat layer.
 *
 * A autenticação agora é feita 100% no cliente via Supabase Auth
 * (`src/store/authStore.ts`). Este módulo antes exportava as server functions
 * `login`, `logout` e `me` — hoje ele expõe stubs client-side para não quebrar
 * imports antigos.
 */
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/auth";

export async function login(args: { data: { email: string; senha: string } }) {
  return useAuthStore.getState().login(args.data.email, args.data.senha);
}

export async function logout() {
  await useAuthStore.getState().logout();
}

export async function me(): Promise<User | null> {
  const store = useAuthStore.getState();
  if (!store.hydrated) await store.hydrate();
  return useAuthStore.getState().user;
}
