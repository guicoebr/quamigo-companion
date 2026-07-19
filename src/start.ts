import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    // Re-throw errors that TanStack should propagate to the client as-is
    // (HTTP-shaped errors with statusCode, our own AuthError with a `status`,
    // and any server-fn call so the client gets the real message instead of
    // a blank 500 HTML page).
    if (error != null && typeof error === "object" && ("statusCode" in error || "status" in error)) {
      throw error;
    }
    if (request?.url && new URL(request.url).pathname.startsWith("/_serverFn/")) {
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
