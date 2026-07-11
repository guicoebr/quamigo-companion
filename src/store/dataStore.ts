import { create } from "zustand";
import type { UsuarioMock } from "@/mocks/usuarios";

/**
 * Resquício do store mockado: só a tela de usuários (Configurações) ainda vive
 * em memória — CRUD real de usuários (senha, role) fica para a próxima rodada.
 * Todo o resto (tutores, pets, OS, contratos, pagamentos, lookups) já é
 * persistido via server functions + TanStack Query.
 *
 * TODO(api): CRUD de usuários via createServerFn e remover este store.
 */

type Overrides<T> = Record<string, Partial<T>>;

type DataState = {
  usuariosNovos: UsuarioMock[];
  usuariosOverrides: Overrides<UsuarioMock>;

  addUsuario: (u: UsuarioMock) => void;
  updateUsuario: (id: string, patch: Partial<UsuarioMock>) => void;
};

function mergeOverride<T>(map: Overrides<T>, id: string, patch: Partial<T>): Overrides<T> {
  return { ...map, [id]: { ...(map[id] ?? {}), ...patch } };
}

export const useDataStore = create<DataState>((set) => ({
  usuariosNovos: [],
  usuariosOverrides: {},

  addUsuario: (u) => set((s) => ({ usuariosNovos: [u, ...s.usuariosNovos] })),
  updateUsuario: (id, patch) =>
    set((s) => {
      const novo = s.usuariosNovos.find((x) => x.id === id);
      if (novo) {
        return {
          usuariosNovos: s.usuariosNovos.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        };
      }
      return { usuariosOverrides: mergeOverride(s.usuariosOverrides, id, patch) };
    }),
}));
