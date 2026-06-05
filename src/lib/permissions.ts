import type { Permission, Role } from "@/types/auth";
import { ALL_ROLES } from "@/types/auth";

/**
 * Matriz de permissões do +QAmigo.
 *
 * - `ROUTE_ACCESS` controla quais roles podem entrar em cada rota.
 * - `PERMISSIONS` controla ações granulares (botões, atalhos, etc.).
 *
 * TODO(api): migrar para uma matriz vinda do backend quando houver
 * controle de papéis dinâmico.
 */

/** Match exato; rotas dinâmicas usam padrão `/tutores/:id`. */
export const ROUTE_ACCESS: Array<{ pattern: RegExp; roles: Role[] }> = [
  // Dashboard e listagens — todos os roles
  { pattern: /^\/dashboard$/, roles: ALL_ROLES },
  { pattern: /^\/tutores$/, roles: ALL_ROLES },
  { pattern: /^\/tutores\/novo$/, roles: ["admin", "operacional", "recepcao"] },
  { pattern: /^\/tutores\/[^/]+\/editar$/, roles: ["admin", "operacional"] },
  { pattern: /^\/tutores\/[^/]+$/, roles: ALL_ROLES },

  { pattern: /^\/pets$/, roles: ALL_ROLES },
  { pattern: /^\/pets\/novo$/, roles: ["admin", "operacional", "recepcao"] },
  { pattern: /^\/pets\/[^/]+\/editar$/, roles: ["admin", "operacional"] },
  { pattern: /^\/pets\/[^/]+$/, roles: ALL_ROLES },

  { pattern: /^\/obitos\/novo$/, roles: ["admin", "operacional"] },

  { pattern: /^\/ordens-servico$/, roles: ALL_ROLES },
  { pattern: /^\/ordens-servico\/nova$/, roles: ["admin", "operacional"] },
  { pattern: /^\/ordens-servico\/[^/]+$/, roles: ALL_ROLES },

  { pattern: /^\/servicos-produtos(\/.*)?$/, roles: ["admin", "financeiro"] },
  { pattern: /^\/contratos(\/.*)?$/, roles: ["admin", "financeiro"] },
  { pattern: /^\/pagamentos(\/.*)?$/, roles: ["admin", "financeiro"] },

  { pattern: /^\/configuracoes(\/.*)?$/, roles: ["admin"] },

  // Páginas auxiliares acessíveis a todos os autenticados
  { pattern: /^\/brand-book$/, roles: ALL_ROLES },
];

export function canAccessRoute(pathname: string, role: Role | null): boolean {
  if (!role) return false;
  const match = ROUTE_ACCESS.find((r) => r.pattern.test(pathname));
  if (!match) return true; // rotas não mapeadas são liberadas a autenticados
  return match.roles.includes(role);
}

/** Matriz de permissões granulares por role. */
export const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "tutor.criar",
    "tutor.editar",
    "pet.criar",
    "pet.editar",
    "obito.registrar",
    "os.criar",
    "os.avancar_status",
    "os.regredir_status",
    "servico.gerenciar",
    "contrato.gerenciar",
    "pagamento.gerenciar",
    "pagamento.registrar_recebimento",
    "config.gerenciar",
  ],
  operacional: [
    "tutor.criar",
    "tutor.editar",
    "pet.criar",
    "pet.editar",
    "obito.registrar",
    "os.criar",
    "os.avancar_status",
  ],
  financeiro: [
    "servico.gerenciar",
    "contrato.gerenciar",
    "pagamento.gerenciar",
    "pagamento.registrar_recebimento",
  ],
  recepcao: ["tutor.criar", "pet.criar"],
};

export function hasPermission(role: Role | null, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role].includes(permission);
}

export function hasAnyRole(role: Role | null, roles: Role[]): boolean {
  if (!role) return false;
  return roles.includes(role);
}

/** Rota inicial após login por role (todos vão ao dashboard por padrão). */
export function defaultRouteForRole(_role: Role): string {
  return "/dashboard";
}