import { Column, Entity } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { decimalTransformer } from "./decimal.transformer";

export type TipoServicoProduto = "servico" | "produto";

@Entity("servicos_produtos")
export class ServicoProduto extends UuidBaseEntity {
  @Column("varchar", { length: 200 })
  nome: string;

  @Column("varchar", { length: 30 })
  tipo: TipoServicoProduto;

  @Column("text", { nullable: true })
  descricao: string | null;

  @Column("numeric", { precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  preco: number;

  @Column("boolean", { default: true })
  ativo: boolean;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;
}
