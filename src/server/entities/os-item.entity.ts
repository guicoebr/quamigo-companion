import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { OrdemServico } from "./ordem-servico.entity";
import { ServicoProduto } from "./servico-produto.entity";
import { decimalTransformer } from "./decimal.transformer";

@Entity("os_itens")
export class OSItem extends UuidBaseEntity {
  @Column("uuid")
  osId: string;

  @ManyToOne(() => OrdemServico, (os) => os.itens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "os_id" })
  os: OrdemServico;

  @Column("uuid", { nullable: true })
  servicoProdutoId: string | null;

  @ManyToOne(() => ServicoProduto, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "servico_produto_id" })
  servicoProduto: ServicoProduto | null;

  /** Cópia do nome do serviço/produto no momento da venda — não segue mudanças no catálogo. */
  @Column("varchar", { length: 200 })
  descricao: string;

  @Column("int", { default: 1 })
  quantidade: number;

  /** Cópia do preço no momento da venda. */
  @Column("numeric", { precision: 10, scale: 2, transformer: decimalTransformer })
  precoUnitario: number;

  /** Coluna GENERATED (quantidade * preco_unitario) criada na migration — somente leitura aqui. */
  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    insert: false,
    update: false,
    transformer: decimalTransformer,
  })
  subtotal: number;
}
