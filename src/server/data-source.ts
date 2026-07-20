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

// No runtime Cloudflare Workers, `require('pg-native')` é resolvido para um
// stub em vez de lançar MODULE_NOT_FOUND. Isso faz o getter `native` do `pg`
// escapar do próprio try/catch e o TypeORM tenta `new Native(...)` durante
// `PostgresDriver.loadDependencies()`, gerando "Native is not a constructor".
// Passamos ao TypeORM um Proxy que esconde exclusivamente a propriedade
// `native`, sem alterar nenhuma outra API do pacote.
const pgDriver: typeof pg = new Proxy(pg, {
  get(target, property) {
    if (property === "native") return undefined;
    return Reflect.get(target, property, target);
  },
});
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
  driver: pgDriver,
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

// ============================================================================
// DIAG-ONLY (temporário). Não altera lógica. Não reseta initPromise.
// ============================================================================
function _diagNormalizeCause(cause: unknown): unknown {
  if (cause instanceof Error) return { name: cause.name, message: cause.message, stack: cause.stack };
  if (typeof cause === "string") return cause;
  return cause == null ? null : String(cause);
}
function diag(step: string, extra: Record<string, unknown> = {}) {
  try { console.log(JSON.stringify({ diag: "login", ts: new Date().toISOString(), step, ...extra })); }
  catch { try { console.error("diag-log-failed", step); } catch { /* noop */ } }
}
function diagErr(step: string, err: unknown) {
  try {
    const e = err as {
      name?: string; message?: string; code?: unknown; cause?: unknown;
      severity?: unknown; routine?: unknown; detail?: unknown; schema?: unknown;
      table?: unknown; constraint?: unknown; sqlState?: unknown; state?: unknown;
      errno?: unknown; syscall?: unknown; address?: unknown; port?: unknown;
      hostname?: unknown; stack?: unknown;
    } | null | undefined;
    console.error(JSON.stringify({
      diag: "login", ts: new Date().toISOString(), step,
      err: {
        name: e?.name ?? null, message: e?.message ?? String(err),
        code: e?.code ?? null, cause: _diagNormalizeCause(e?.cause),
        severity: e?.severity ?? null, routine: e?.routine ?? null,
        detail: e?.detail ?? null, schema: e?.schema ?? null,
        table: e?.table ?? null, constraint: e?.constraint ?? null,
        sqlState: e?.sqlState ?? e?.state ?? null,
        errno: e?.errno ?? null, syscall: e?.syscall ?? null,
        address: e?.address ?? null, port: e?.port ?? null, hostname: e?.hostname ?? null,
        stack: e?.stack ?? null,
      },
    }));
  } catch { try { console.error("diag-err-log-failed", step); } catch { /* noop */ } }
}
// ============================================================================

/** Inicializa a conexão uma única vez por processo (reaproveitada entre server functions). */
export function getDataSource(): Promise<DataSource> {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);
  if (!initPromise) {
    diag("initialize ANTES");
    initPromise = AppDataSource.initialize()
      .then((ds) => { diag("initialize DEPOIS", { isInitialized: ds.isInitialized }); return ds; })
      .catch((error) => {
        diagErr("initialize FAIL", error);
        diag("initialize state", {
          isInitialized: AppDataSource.isInitialized,
          initPromiseNull: initPromise === null,
        });
        throw error;
      });
  } else {
    diag("initPromise CACHED (skip initialize)");
  }
  return initPromise;
}

