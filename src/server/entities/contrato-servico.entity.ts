import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Contrato } from "./contrato.entity";
import { ServicoProduto } from "./servico-produto.entity";

/** Catálogo do que está incluso no plano — não determina o preço (`contrato.valorMensal` é fixo/negociado). */
@Entity("contrato_servicos")
export class ContratoServico extends UuidBaseEntity {
  @Column("uuid")
  contratoId: string;

  @ManyToOne(() => Contrato, (c) => c.contratoServicos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contrato_id" })
  contrato: Contrato;

  @Column("uuid")
  servicoProdutoId: string;

  @ManyToOne(() => ServicoProduto, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "servico_produto_id" })
  servicoProduto: ServicoProduto;
}
