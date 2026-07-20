import bcrypt from "bcryptjs";
// Alias: `useSession` is a plain server-side session-manager factory from TanStack Start, not a
// React hook — the "use" prefix otherwise trips eslint-plugin-react-hooks' naming heuristic.
import {
  useSession as getSessionManager,
  getSession,
  clearSession,
  getRequest,
  getRequestHeader,
} from "@tanstack/react-start/server";
import type { SessionConfig } from "@tanstack/react-start/server";

type QamigoSessionData = { userId: string };

/** Sessão selada (criptografada + assinada) via mecanismo nativo do TanStack Start —
 * evita reimplementar JWT/assinatura de cookie na mão. Guarda só o userId; o resto
 * (nome/email/role) é sempre lido fresco do banco em cada request (ver session.server.ts). */
function sessionConfig(): SessionConfig {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET não configurada.");
  const forwardedProtocol = getRequestHeader("x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttps = forwardedProtocol === "https" || new URL(getRequest().url).protocol === "https:";

  return {
    password,
    name: "qamigo_session",
    maxAge: 60 * 60 * 8, // 8h
    cookie: {
      httpOnly: true,
      // The Lovable preview runs inside a cross-site iframe. HTTPS sessions
      // therefore need SameSite=None and a partitioned cookie to survive the
      // login response and accompany subsequent server-function requests.
      sameSite: isHttps ? "none" : "lax",
      secure: isHttps,
      partitioned: isHttps,
      path: "/",
    },
  };
}

// ============================================================================
// DIAG-ONLY (temporário). Locais, não lançam.
// ============================================================================
function _diagNormalizeCause(cause: unknown): unknown {
  if (cause instanceof Error) return { name: cause.name, message: cause.message, stack: cause.stack };
  if (typeof cause === "string") return cause;
  return cause == null ? null : String(cause);
}
function diag(step: string, extra: Record<string, unknown> = {}) {
  try { console.log(JSON.stringify({ diag: "login", ts: new Date().toISOString(), step, ...extra })); }
  catch { try { console.error("diag-log-failed", step); } catch { /* noop */ } }
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
    console.error(JSON.stringify({
      diag: "login", ts: new Date().toISOString(), step,
      err: {
        name: e?.name ?? null, message: e?.message ?? String(err),
        code: e?.code ?? null, cause: _diagNormalizeCause(e?.cause),
        severity: e?.severity ?? null, routine: e?.routine ?? null,
        detail: e?.detail ?? null, schema: e?.schema ?? null,
        table: e?.table ?? null, constraint: e?.constraint ?? null,
        sqlState: e?.sqlState ?? e?.state ?? null,
        errno: e?.errno ?? null, syscall: e?.syscall ?? null,
        address: e?.address ?? null, port: e?.port ?? null, hostname: e?.hostname ?? null,
        stack: e?.stack ?? null,
      },
    }));
  } catch { try { console.error("diag-err-log-failed", step); } catch { /* noop */ } }
}
// ============================================================================

export async function createUserSession(userId: string): Promise<void> {
  diag("createUserSession ANTES");
  try {
    const session = await getSessionManager<QamigoSessionData>(sessionConfig());
    await session.update({ userId });
  } catch (error) {
    diagErr("createUserSession INNER FAIL", error);
    throw error;
  }
  diag("createUserSession DEPOIS");
}

export async function destroyUserSession(): Promise<void> {
  await clearSession(sessionConfig());
}

export async function readSessionUserId(): Promise<string | null> {
  const session = await getSession<QamigoSessionData>(sessionConfig());
  return session.data.userId ?? null;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
