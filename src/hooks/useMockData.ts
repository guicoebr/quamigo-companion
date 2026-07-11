import { usuariosMock } from "@/mocks/usuarios";
import { useDataStore } from "@/store/dataStore";
import type { UsuarioMock } from "@/mocks/usuarios";

/**
 * Resquício dos mocks: só a tela de usuários (Configurações) ainda consome
 * daqui — o restante migrou para server functions + TanStack Query.
 *
 * TODO(api): CRUD de usuários via createServerFn e remover este hook.
 */
export function useMockData(): { usuarios: UsuarioMock[] } {
  const usuariosNovos = useDataStore((s) => s.usuariosNovos);
  const usuariosOverrides = useDataStore((s) => s.usuariosOverrides);
  const adicionados = usuariosNovos.filter((n) => !usuariosMock.some((b) => b.id === n.id));
  return {
    usuarios: [
      ...adicionados,
      ...usuariosMock.map((u) =>
        usuariosOverrides[u.id] ? { ...u, ...usuariosOverrides[u.id] } : u,
      ),
    ],
  };
}
