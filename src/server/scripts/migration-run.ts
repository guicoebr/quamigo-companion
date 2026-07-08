import { getDataSource } from "../data-source";

const ds = await getDataSource();
const applied = await ds.runMigrations({ transaction: "each" });
console.log(`${applied.length} migration(s) aplicada(s).`);
for (const m of applied) console.log(` - ${m.name}`);
await ds.destroy();
