import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Tutor } from "./tutor.entity";
import { ModalidadeServico } from "./modalidade-servico.entity";
import { ContratoPet } from "./contrato-pet.entity";
import { ContratoServico } from "./contrato-servico.entity";
import { decimalTransformer } from "./decimal.transformer";

export type StatusContrato = "ativo" | "suspenso" | "encerrado";
export type PeriodicidadeContrato = "mensal" | "trimestral" | "anual";

@Entity("contratos")
export class Contrato extends UuidBaseEntity {
  @Column("varchar", { length: 20, unique: true })
  numero: string;

  @Column("uuid")
  tutorId: string;

  @ManyToOne(() => Tutor, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "tutor_id" })
  tutor: Tutor;

  @Column("uuid")
  modalidadeId: string;

  @ManyToOne(() => ModalidadeServico, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "modalidade_id" })
  modalidade: ModalidadeServico;

  @Column("varchar", { length: 20, default: "ativo" })
  status: StatusContrato;

  @Column("numeric", { precision: 10, scale: 2, transformer: decimalTransformer })
  valorMensal: number;

  @Column("varchar", { length: 20, default: "mensal" })
  periodicidade: PeriodicidadeContrato;

  @Column("date")
  inicioVigencia: string;

  @Column("date", { nullable: true })
  fimVigencia: string | null;

  @Column("text", { nullable: true })
  observacoes: string | null;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;

  @OneToMany(() => ContratoPet, (cp) => cp.contrato)
  contratoPets: ContratoPet[];

  @OneToMany(() => ContratoServico, (cs) => cs.contrato)
  contratoServicos: ContratoServico[];
}
