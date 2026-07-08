// One-off helper to drive TypeORM's migration:generate programmatically via `tsx`,
// since the CLI's own `typeorm-ts-node-esm` wrapper hard-requires ts-node (not installed —
// we use tsx everywhere else in this project). Usage: tsx src/server/scripts/generate-migration.ts <Name>
import { readdir, readFile, writeFile } from "node:fs/promises";
import { MigrationGenerateCommand } from "typeorm/commands/MigrationGenerateCommand.js";

const name = process.argv[2];
if (!name) {
  console.error("Uso: tsx src/server/scripts/generate-migration.ts <NomeDaMigration>");
  process.exit(1);
}

const migrationsDir = "src/server/migrations";
const before = new Set(await readdir(migrationsDir));

const command = new MigrationGenerateCommand();
await command.handler({
  path: `${migrationsDir}/${name}`,
  dataSource: "src/server/data-source.ts",
  p: false,
  o: false,
  esm: true,
  dr: false,
  ch: false,
  t: false,
  $0: "",
  _: [],
} as never);

// TypeORM's own template emits `import { MigrationInterface, QueryRunner } from "typeorm"` —
// both used only as types here, but Vite's per-file dev transform doesn't always erase that
// (throws "does not provide an export named 'MigrationInterface'" at runtime). Fix it up.
const after = await readdir(migrationsDir);
const generated = after.find((f) => !before.has(f));
if (generated) {
  const filePath = `${migrationsDir}/${generated}`;
  const contents = await readFile(filePath, "utf8");
  await writeFile(
    filePath,
    contents.replace(
      'import { MigrationInterface, QueryRunner } from "typeorm";',
      'import type { MigrationInterface, QueryRunner } from "typeorm";',
    ),
  );
}
