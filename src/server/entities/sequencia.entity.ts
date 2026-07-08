import { Column, Entity, PrimaryColumn } from "typeorm";

export type TipoSequencia = "OS" | "CT" | "PG";

/**
 * Contador atômico por (tipo, ano) — gera OS-AAAA-NNNNN / CT-AAAA-NNNNN / PG-AAAA-NNNNN.
 * Usar sempre dentro de uma transação com `SELECT ... FOR UPDATE` (ver numbering.server.ts)
 * para evitar corrida entre duas requisições no mesmo ano.
 */
@Entity("sequencias")
export class Sequencia {
  @PrimaryColumn("varchar", { length: 4 })
  tipo: TipoSequencia;

  @PrimaryColumn("int")
  ano: number;

  @Column("int", { default: 0 })
  ultimoNumero: number;
}
