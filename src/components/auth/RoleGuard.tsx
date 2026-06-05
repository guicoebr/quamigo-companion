import type { ReactNode } from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import type { Permission, Role } from "@/types/auth";

type RoleGuardProps = {
  /** Permite renderizar somente se o usuário tiver um dos roles. */
  roles?: Role[];
  /** Permite renderizar somente se o usuário tiver a permissão. */
  permission?: Permission;
  /** Conteúdo alternativo quando negado (default: null). */
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Renderiza `children` apenas quando o usuário atende aos critérios.
 * Não bloqueia roteamento (isso é responsabilidade do beforeLoad do `_app`).
 */
export function RoleGuard({ roles, permission, fallback = null, children }: RoleGuardProps) {
  const { role, can, hasAnyRole } = useRoleGuard();
  if (!role) return <>{fallback}</>;
  if (roles && !hasAnyRole(roles)) return <>{fallback}</>;
  if (permission && !can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}