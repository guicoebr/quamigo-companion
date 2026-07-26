// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro,
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const publicBackendUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  "https://aoecbjfxsmaaeneddtwz.supabase.co";

const publicBackendKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_1qGUcpkyejwCpNMaT2mofA_F4HSgoas";

// A persistência agora vive 100% no Lovable Cloud (Supabase) via HTTP,
// então não precisamos mais dos workarounds de TypeORM/pg no bundle da Worker.
export default defineConfig({
  vite: {
    // Production exposes only these publishable values to the browser. Keeping
    // the fallback here prevents a deployment without VITE_* aliases from
    // producing a login screen that cannot initialize the auth client.
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicBackendUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publicBackendKey),
    },
  },
});
