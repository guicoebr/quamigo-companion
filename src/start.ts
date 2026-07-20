import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
// (removido) import de attachSupabaseAuth — não usar; o projeto não tem credenciais Supabase.
// Supabase auth is not used in this project (auth is handled by TypeORM/Postgres).
// The Supabase bearer middleware must not be registered here: it would try to
// instantiate the Supabase client on every Server Function call and fail because
// the project has no Supabase credentials configured.


// ============================================================================
// DIAG-ONLY (temporário). Observação secundária: o erro pode ser encapsulado
// no envelope Seroval pela server-fn antes de chegar aqui. Nunca lança.
// ============================================================================
function _diagNormalizeCause(cause: unknown): unknown {
  if (cause instanceof Error) return { name: cause.name, message: cause.message, stack: cause.stack };
  if (typeof cause === "string") return cause;
  return cause == null ? null : String(cause);
}
function diagMwErr(url: string | undefined, err: unknown) {
  try {
    const e = err as {
      constructor?: { name?: string };
      name?: string; message?: string; code?: unknown; cause?: unknown; stack?: unknown;
      severity?: unknown; routine?: unknown; detail?: unknown; schema?: unknown;
      table?: unknown; constraint?: unknown; sqlState?: unknown; state?: unknown;
      errno?: unknown; syscall?: unknown; address?: unknown; port?: unknown;
      hostname?: unknown;
    } | null | undefined;
    console.error(JSON.stringify({
      diag: "login",
      ts: new Date().toISOString(),
      step: "errorMiddleware CAUGHT",
      requestUrl: url ?? null,
      err: {
        constructorName: e?.constructor?.name ?? null,
        name: e?.name ?? null,
        message: e?.message ?? String(err),
        code: e?.code ?? null,
        cause: _diagNormalizeCause(e?.cause),
        stack: e?.stack ?? null,
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
      },
    }));
  } catch {
    try { console.error("diag-mw-log-failed"); } catch { /* noop */ }
  }
}
// ============================================================================

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    const isServerFn =
      !!request?.url && new URL(request.url).pathname.startsWith("/_serverFn/");

    // For server-fn RPC calls, return a proper JSON error response with the
    // right status so the client createServerFn wrapper throws a normal Error
    // (and, for 401s, the UI can react) — instead of the fallback HTML page.
    if (isServerFn) {
      const status =
        (error as { status?: number; statusCode?: number })?.status ??
        (error as { status?: number; statusCode?: number })?.statusCode ??
        500;
      const message =
        error instanceof Error ? error.message : String(error ?? "Unknown error");
      if (status >= 500) console.error(error);
      // DIAG-ONLY: observação estruturada adicional; não altera a resposta.
      diagMwErr(request?.url, error);
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [],
  requestMiddleware: [errorMiddleware],
}));
