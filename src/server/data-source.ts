import "reflect-metadata";
import { DataSource } from "typeorm";
import pg from "pg";

// Node 20.6+ built-in .env loader. Silently no-ops when there's no .env file
// (Docker/Railway inject DATABASE_URL etc. straight into the environment).
try {
  process.loadEnvFile();
} catch {
  // no .env file present — fine outside local dev
}
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

// node-postgres parses DATE columns (OID 1082) into JS Date objects by default, which silently
// disagrees with every `@Column("date")` entity field declared as `string` here (dataNascimento,
// dataFalecimento, inicioVigencia...) and with the frontend's `string` date types. Keep them as
// the raw "YYYY-MM-DD" string Postgres sends — matches the entities/DTOs exactly, no Date-object
// surprises, no timezone conversion to get wrong.
pg.types.setTypeParser(1082, (value) => value);
import {
  Especie,
  Raca,
  ModalidadeServico,
  ServicoProduto,
  Tutor,
  Pet,
  Usuario,
  OrdemServico,
  OSItem,
  HistoricoStatusOS,
  Contrato,
  ContratoPet,
  ContratoServico,
  OrdemPagamento,
  Parcela,
  Sequencia,
} from "./entities";

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada.");
  return url;
}

/** DataSource compartilhado — usado tanto pelos server functions quanto pelos
 * scripts de migration/seed (tsx). `synchronize` é sempre false: schema muda
 * só via migration versionada. */
export const AppDataSource = new DataSource({
  type: "postgres",
  // Pass the statically imported driver explicitly. TypeORM otherwise tries
  // to discover `pg` with a runtime require(), which is unavailable after the
  // production Worker bundle has been assembled.
  driver: pg,
  url: databaseUrl(),
  // Railway's public proxy (rlwy.net) presents a self-signed cert. Accept it
  // when DATABASE_SSL isn't explicitly disabled.
  ssl:
    process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: process.env.NODE_ENV !== "production" && process.env.TYPEORM_LOGGING !== "false",
  entities: [
    Especie,
    Raca,
    ModalidadeServico,
    ServicoProduto,
    Tutor,
    Pet,
    Usuario,
    OrdemServico,
    OSItem,
    HistoricoStatusOS,
    Contrato,
    ContratoPet,
    ContratoServico,
    OrdemPagamento,
    Parcela,
    Sequencia,
  ],
  migrations: ["src/server/migrations/*.ts"],
});

let initPromise: Promise<DataSource> | null = null;

/** Inicializa a conexão uma única vez por processo (reaproveitada entre server functions). */
export function getDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);
  if (!initPromise) initPromise = AppDataSource.initialize();
  return initPromise;
}
