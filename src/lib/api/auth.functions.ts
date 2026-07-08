import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import { Usuario } from "@/server/entities";
import { verifyPassword, createUserSession, destroyUserSession } from "@/server/auth.server";
import { getCurrentUser } from "@/server/session.server";
import type { User } from "@/types/auth";

export const login = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), senha: z.string().min(1) }))
  .handler(async ({ data }): Promise<{ ok: true; user: User } | { ok: false; error: string }> => {
    const ds = await getDataSource();
    const usuario = await ds
      .getRepository(Usuario)
      .findOne({ where: { email: data.email.toLowerCase() } });

    if (!usuario || !usuario.ativo) {
      return { ok: false, error: "E-mail ou senha inválidos." };
    }

    const valid = await verifyPassword(data.senha, usuario.senhaHash);
    if (!valid) {
      return { ok: false, error: "E-mail ou senha inválidos." };
    }

    await createUserSession(usuario.id);
    const user = await getCurrentUser();
    return { ok: true, user: user! };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await destroyUserSession();
});

/** Reidrata a sessão no boot da SPA — substitui o `persist` em localStorage do mock. */
export const me = createServerFn({ method: "GET" }).handler(async (): Promise<User | null> => {
  return getCurrentUser();
});
