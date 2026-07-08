// Post-build patch for a nitro/Rollup bundling bug in dist/server/_libs/typeorm.mjs. Two
// symptoms of the same root cause (a mis-chunked self-reference to the typeorm package):
//
// 1. `import { __require } from "typeorm/index.js";` — `__require` isn't a real export of
//    the typeorm package, it's Rollup's own synthetic CJS-interop helper
//    (`createRequire(import.meta.url)`) that got hoisted into an external import instead of
//    being defined locally. Node's ESM/CJS interop rejects it ("Named export '__require' not
//    found"). Fix: define the helper locally — a real `require()` also preserves TypeORM's own
//    try/catch around optional driver requires (e.g. expo-sqlite), unlike a static ESM import.
// 2. `var typeormExports = __require();` — the same helper called with no argument, meant to
//    require the typeorm package itself to build its CJS exports namespace (immediately fed
//    into `getDefaultExportFromCjs` and destructured for DataSource/QueryBuilder/etc., which
//    only makes sense if it's requiring "typeorm"). The specifier string was lost in the same
//    mis-chunking. Fix: restore the argument.
import { readFile, writeFile } from "node:fs/promises";

const target = "dist/server/_libs/typeorm.mjs";

const fixes = [
  {
    broken: 'import { __require } from "typeorm/index.js";',
    fixed: [
      'import { createRequire as __tanstackCreateRequire } from "node:module";',
      "const __require = __tanstackCreateRequire(import.meta.url);",
    ].join("\n"),
  },
  {
    broken: "var typeormExports = __require();",
    fixed: 'var typeormExports = __require("typeorm");',
  },
];

let contents = await readFile(target, "utf8");
let patched = 0;
for (const { broken, fixed } of fixes) {
  if (contents.includes(broken)) {
    contents = contents.replace(broken, fixed);
    patched++;
  }
}

if (patched === 0) {
  console.log(`patch-dist: "${target}" já não contém os imports quebrados — nada a fazer.`);
} else {
  await writeFile(target, contents);
  console.log(`patch-dist: ${patched}/${fixes.length} correções aplicadas em ${target}.`);
}
