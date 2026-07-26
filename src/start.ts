import { createStart, createMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    const isServerFn =
      !!request?.url && new URL(request.url).pathname.startsWith("/_serverFn/");

    if (isServerFn) {
      const status =
        (error as { status?: number; statusCode?: number })?.status ??
        (error as { status?: number; statusCode?: number })?.statusCode ??
        500;
      const message =
        error instanceof Error ? error.message : String(error ?? "Unknown error");
      if (status >= 500) console.error(error);
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
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
