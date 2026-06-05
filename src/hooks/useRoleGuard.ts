import { useAuthStore } from "@/store/authStore";
import { hasPermission, hasAnyRole } from "@/lib/permissions";
import type { Permission, Role } from "@/types/auth";

/**
 * Hook utilitário para consultar permissões do usuário autenticado.
 * Usar em componentes para esconder/desabilitar ações.
 */
export function useRoleGuard() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? null;

  return {
    user,
    role,
    isRole: (r: Role) => role === r,
    hasAnyRole: (roles: Role[]) => hasAnyRole(role, roles),
    can: (permission: Permission) => hasPermission(role, permission),
  };
}