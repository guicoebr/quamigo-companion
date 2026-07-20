// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only; auto-detects Lovable
//     sandbox and defaults to cloudflare-module there — forced on with the "node" preset below since
//     we self-host on Railway as a plain Node process),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Keep the deploy adapter enabled. Published Lovable Cloud builds need Nitro to collect
// every server dependency (including TanStack's aliased `h3-v2` package) into the Worker
// bundle. Disabling it leaves bare server imports that are unavailable at runtime.
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  nitro: {
    cloudflare: {
      nodeCompat: true,
    },
  },
  vite: {
    plugins: [
      {
        // Nitro's Worker build has no matching condition for TypeORM's package
        // root. Resolve it to the real CommonJS entry only while building, when
        // Rollup's CommonJS transform is active. Applying this during `vite dev`
        // makes Vite's ESM module runner execute the file without `exports`.
        name: "qamigo:resolve-typeorm-worker-entry",
        apply: "build",
        enforce: "pre",
        resolveId(source) {
          if (source !== "typeorm") return null;
          return new URL("./node_modules/typeorm/index.js", import.meta.url).pathname;
        },
      },
    ],
    resolve: {
      alias: [
        {
          // TypeORM's ESM build unconditionally imports "expo-sqlite" (its React Native driver).
          // Alias it to a no-op stub so the SSR bundle can load without a real Expo dependency.
          find: "expo-sqlite",
          replacement: new URL("./src/server/stubs/expo-sqlite.ts", import.meta.url).pathname,
        },
        {
          // tinyglobby ships named-only ESM; TypeORM's CJS DirectoryExportedClassesLoader
          // is bundled as `import def from "tinyglobby"` by Rollup, which fails since there
          // is no default export. Alias to a shim that also provides a default.
          find: /^tinyglobby$/,
          replacement: new URL("./src/server/stubs/tinyglobby.mjs", import.meta.url).pathname,
        },
        {
          // pg's CommonJS stream adapter requires pg-cloudflare as a default
          // object, while the package's Worker ESM entry only exports the
          // named CloudflareSocket class. Normalize both export shapes.
          find: /^pg-cloudflare$/,
          replacement: new URL(
            "./src/server/stubs/pg-cloudflare.mjs",
            import.meta.url,
          ).pathname,
        },
      ],
    },
    ssr: {
      // Workers do not have a runtime node_modules directory. Bundle the
      // PostgreSQL driver and the packages it loads with the server output.
      noExternal: [
        "pg",
        "pg-protocol",
        "pg-types",
        "pg-connection-string",
        "pgpass",
      ],
      resolve: {
        conditions: ["node", "import", "module", "default"],
        externalConditions: ["node", "import", "module", "default"],
      },
    },
  },
});
