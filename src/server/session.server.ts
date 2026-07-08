import { getDataSource } from "./data-source";
import { Usuario } from "./entities";
import { readSessionUserId } from "./auth.server";
import type { Role, Permission, User } from "@/types/auth";
import { hasPermission } from "@/lib/permissions";

function iniciaisDe(nome: string): string {
  const primeiras = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "");
  return primeiras.join("") || "?";
}

/** Sempre relê do banco (não confia em claims persistidas) — pega desativação/troca de role na hora. */
export async function getCurrentUser(): Promise<User | null> {
  const userId = await readSessionUserId();
  if (!userId) return null;

  const ds = await getDataSource();
  const usuario = await ds.getRepository(Usuario).findOne({ where: { id: userId } });
  if (!usuario || !usuario.ativo) return null;

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    iniciais: iniciaisDe(usuario.nome),
  };
}

export class AuthError extends Error {
  status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
  }
}

/** Guard de toda server function protegida — a autorização real vive aqui, não no client
 * (o guard de rota em _app.tsx / RoleGuard é só UX). */
export async function requireAuth(roles?: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Não autenticado.");
  if (roles && !roles.includes(user.role)) {
    throw new AuthError(403, "Sem permissão para esta ação.");
  }
  return user;
}

export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    throw new AuthError(403, "Sem permissão para esta ação.");
  }
  return user;
}
