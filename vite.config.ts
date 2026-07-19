// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only; auto-detects Lovable
//     sandbox and defaults to cloudflare-module there — forced on with the "node" preset below since
//     we self-host on Railway as a plain Node process),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The Lovable sandbox forcibly overrides Nitro to `cloudflare-module`, which cannot
// bundle typeorm/pg (native TCP driver, no worker/browser exports condition). We deploy
// on Railway using the Dockerfile pipeline (npm run build) OUTSIDE the sandbox, so
// disable Nitro entirely here to keep the sandbox harness green while dev (`vite dev`)
// continues to run the full Node-based server for the preview.
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  nitro: false,
  vite: {
    resolve: {
      alias: {
        // TypeORM's ESM build unconditionally imports "expo-sqlite" (its React Native driver).
        // Alias it to a no-op stub so the SSR bundle can load without a real Expo dependency.
        "expo-sqlite": new URL("./src/server/stubs/expo-sqlite.ts", import.meta.url).pathname,
      },
    },
    ssr: {
      resolve: {
        conditions: ["node", "import", "module", "default"],
        externalConditions: ["node", "import", "module", "default"],
      },
    },
  },
});
