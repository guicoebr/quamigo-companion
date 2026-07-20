import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import { Usuario } from "@/server/entities";
import { verifyPassword, createUserSession, destroyUserSession } from "@/server/auth.server";
import { getCurrentUser } from "@/server/session.server";
import type { User } from "@/types/auth";

// ============================================================================
// DIAG-ONLY (temporário). Não altera comportamento. Não engole exceções.
// Helpers locais para evitar novo módulo. Nunca lançam.
// ============================================================================
function normalizeCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message, stack: cause.stack };
  }
  if (typeof cause === "string") return cause;
  return cause == null ? null : String(cause);
}
function diag(step: string, extra: Record<string, unknown> = {}) {
  try {
    console.log(
      JSON.stringify({ diag: "login", ts: new Date().toISOString(), step, ...extra }),
    );
  } catch {
    try { console.error("diag-log-failed", step); } catch { /* noop */ }
  }
}
function diagErr(step: string, err: unknown) {
  try {
    const e = err as {
      name?: string; message?: string; code?: unknown; cause?: unknown;
      severity?: unknown; routine?: unknown; detail?: unknown; schema?: unknown;
      table?: unknown; constraint?: unknown; sqlState?: unknown; state?: unknown;
      errno?: unknown; syscall?: unknown; address?: unknown; port?: unknown;
      hostname?: unknown; stack?: unknown;
    } | null | undefined;
    console.error(
      JSON.stringify({
        diag: "login",
        ts: new Date().toISOString(),
        step,
        err: {
          name: e?.name ?? null,
          message: e?.message ?? String(err),
          code: e?.code ?? null,
          cause: normalizeCause(e?.cause),
          severity: e?.severity ?? null,
          routine: e?.routine ?? null,
          detail: e?.detail ?? null,
          schema: e?.schema ?? null,
          table: e?.table ?? null,
          constraint: e?.constraint ?? null,
          sqlState: e?.sqlState ?? e?.state ?? null,
          errno: e?.errno ?? null,
          syscall: e?.syscall ?? null,
          address: e?.address ?? null,
          port: e?.port ?? null,
          hostname: e?.hostname ?? null,
          stack: e?.stack ?? null,
        },
      }),
    );
  } catch {
    try { console.error("diag-err-log-failed", step); } catch { /* noop */ }
  }
}
// ============================================================================

export const login = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), senha: z.string().min(1) }))
  .handler(async ({ data }): Promise<{ ok: true; user: User } | { ok: false; error: string }> => {
    diag("LOGIN START", { emailDomain: data.email.split("@")[1] ?? "invalid" });

    diag("ANTES getDataSource");
    let ds;
    try {
      ds = await getDataSource();
    } catch (error) {
      diagErr("getDataSource FAIL", error);
      throw error;
    }
    diag("DEPOIS getDataSource", { isInitialized: ds.isInitialized });

    diag("ANTES findOne Usuario");
    let usuario;
    try {
      usuario = await ds
        .getRepository(Usuario)
        .findOne({ where: { email: data.email.toLowerCase() } });
    } catch (error) {
      diagErr("findOne FAIL", error);
      throw error;
    }
    diag("DEPOIS findOne", { encontrou: !!usuario });

    if (!usuario || !usuario.ativo) {
      diag("LOGIN END invalid-user");
      return { ok: false, error: "E-mail ou senha inválidos." };
    }

    const valid = await verifyPassword(data.senha, usuario.senhaHash);
    if (!valid) {
      diag("LOGIN END invalid-password");
      return { ok: false, error: "E-mail ou senha inválidos." };
    }

    diag("ANTES createUserSession");
    try {
      await createUserSession(usuario.id);
    } catch (error) {
      diagErr("createUserSession FAIL", error);
      throw error;
    }
    diag("DEPOIS createUserSession");

    diag("ANTES getCurrentUser");
    let user;
    try {
      user = await getCurrentUser();
    } catch (error) {
      diagErr("getCurrentUser FAIL", error);
      throw error;
    }
    diag("DEPOIS getCurrentUser", { encontrou: !!user });

    diag("LOGIN SUCCESS");
    return { ok: true, user: user! };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await destroyUserSession();
});

/** Reidrata a sessão no boot da SPA — substitui o `persist` em localStorage do mock. */
export const me = createServerFn({ method: "GET" }).handler(async (): Promise<User | null> => {
  return getCurrentUser();
});
