// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only; auto-detects Lovable
//     sandbox and defaults to cloudflare-module there — forced on with the "node" preset below since
//     we self-host on Railway as a plain Node process),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force nitro on (it's otherwise Lovable-sandbox-only) with a standard Node server output,
  // since we deploy on Railway (not Cloudflare Workers) and need TypeORM/pg's native TCP driver.
  nitro: {
    preset: "node",
  },
  // TypeORM's ESM build unconditionally imports "expo-sqlite" (its React Native driver) even
  // though we only ever use the postgres driver. That import is fine at runtime via plain Node
  // resolution (unreachable code path), but the bundler hoists it into a static import that
  // crashes the whole server chunk at module load if the package isn't installed. Alias it to a
  // no-op stub instead of pulling in a real Expo/React Native dependency.
  vite: {
    resolve: {
      alias: {
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
