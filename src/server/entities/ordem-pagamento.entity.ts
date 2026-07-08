import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { OrdemServico } from "./ordem-servico.entity";
import { Contrato } from "./contrato.entity";
import { Tutor } from "./tutor.entity";
import { Parcela } from "./parcela.entity";
import { decimalTransformer } from "./decimal.transformer";

export type OrigemPagamento = "ordem_servico" | "contrato";
export type StatusPagamento = "aberto" | "parcial" | "quitado" | "cancelado";

@Entity("ordens_pagamento")
@Index(["contratoId", "competencia"], { unique: true })
export class OrdemPagamento extends UuidBaseEntity {
  /** PG-AAAA-NNNNN — não existia na tabela da spec original, mas o frontend já espera. */
  @Column("varchar", { length: 20, unique: true })
  numero: string;

  @Column("varchar", { length: 20 })
  origem: OrigemPagamento;

  @Column("uuid", { nullable: true })
  osId: string | null;

  @ManyToOne(() => OrdemServico, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "os_id" })
  os: OrdemServico | null;

  @Column("uuid", { nullable: true })
  contratoId: string | null;

  @ManyToOne(() => Contrato, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "contrato_id" })
  contrato: Contrato | null;

  @Column("uuid")
  tutorId: string;

  @ManyToOne(() => Tutor, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "tutor_id" })
  tutor: Tutor;

  @Column("numeric", { precision: 10, scale: 2, transformer: decimalTransformer })
  valorTotal: number;

  @Column("varchar", { length: 20, default: "aberto" })
  status: StatusPagamento;

  /** Só preenchido para cobranças de contrato — primeiro dia do mês de referência.
   *  Junto com o índice único (contrato_id, competencia) garante 1 cobrança/mês/contrato. */
  @Column("date", { nullable: true })
  competencia: string | null;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;

  @OneToMany(() => Parcela, (p) => p.pagamento)
  parcelas: Parcela[];
}
