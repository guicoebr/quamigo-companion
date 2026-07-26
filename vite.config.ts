// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro,
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// A persistência agora vive 100% no Lovable Cloud (Supabase) via HTTP,
// então não precisamos mais dos workarounds de TypeORM/pg no bundle da Worker.
export default defineConfig({});
