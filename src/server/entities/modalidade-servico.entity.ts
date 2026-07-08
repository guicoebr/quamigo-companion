import { Column, Entity } from "typeorm";
import { UuidBaseEntity } from "./base.entity";

@Entity("modalidades_servico")
export class ModalidadeServico extends UuidBaseEntity {
  @Column("varchar", { length: 100, unique: true })
  nome: string;

  @Column("text", { nullable: true })
  descricao: string | null;

  @Column("boolean", { default: true })
  ativo: boolean;
}
