import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { OrdemPagamento } from "./ordem-pagamento.entity";
import { decimalTransformer } from "./decimal.transformer";

export type StatusParcela = "pendente" | "pago" | "atrasado" | "cancelado";
export type MetodoPagamento = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto";

@Entity("parcelas")
export class Parcela extends UuidBaseEntity {
  @Column("uuid")
  ordemPagamentoId: string;

  @ManyToOne(() => OrdemPagamento, (p) => p.parcelas, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ordem_pagamento_id" })
  pagamento: OrdemPagamento;

  @Column("int")
  numero: number;

  @Column("int")
  totalParcelas: number;

  @Column("numeric", { precision: 10, scale: 2, transformer: decimalTransformer })
  valor: number;

  @Column("varchar", { length: 30, nullable: true })
  formaPagamento: MetodoPagamento | null;

  @Column("varchar", { length: 20, default: "pendente" })
  status: StatusParcela;

  @Column("date")
  dataVencimento: string;

  @Column("date", { nullable: true })
  dataRecebimento: string | null;

  @Column("text", { nullable: true })
  observacao: string | null;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;
}
