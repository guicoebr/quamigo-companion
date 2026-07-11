import type { EntityManager } from "typeorm";
import { Sequencia, type TipoSequencia } from "./entities";

/**
 * Gera o próximo número formatado (OS-AAAA-NNNNN / CT-AAAA-NNNNN / PG-AAAA-NNNNN)
 * usando o contador atômico da tabela `sequencias`.
 *
 * Deve ser chamado SEMPRE dentro de uma transação (`manager` transacional):
 * o `SELECT ... FOR UPDATE` segura o lock da linha (tipo, ano) até o commit,
 * eliminando corrida entre duas requisições simultâneas no mesmo ano.
 */
export async function nextNumero(manager: EntityManager, tipo: TipoSequencia): Promise<string> {
  const ano = new Date().getFullYear();

  // Garante a linha do ano corrente sem falhar se outra transação a criou primeiro.
  await manager.query(
    `INSERT INTO sequencias (tipo, ano, ultimo_numero) VALUES ($1, $2, 0)
     ON CONFLICT (tipo, ano) DO NOTHING`,
    [tipo, ano],
  );

  const seq = await manager
    .getRepository(Sequencia)
    .createQueryBuilder("s")
    .setLock("pessimistic_write")
    .where("s.tipo = :tipo AND s.ano = :ano", { tipo, ano })
    .getOneOrFail();

  seq.ultimoNumero += 1;
  await manager.getRepository(Sequencia).save(seq);

  return `${tipo}-${ano}-${String(seq.ultimoNumero).padStart(5, "0")}`;
}
