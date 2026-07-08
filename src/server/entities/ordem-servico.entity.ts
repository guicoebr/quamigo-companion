import { Column, Entity, JoinColumn, ManyToOne, OneToMany, UpdateDateColumn } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Tutor } from "./tutor.entity";
import { Pet } from "./pet.entity";
import { Usuario } from "./usuario.entity";
import { ModalidadeServico } from "./modalidade-servico.entity";
import { OSItem } from "./os-item.entity";
import { HistoricoStatusOS } from "./historico-status-os.entity";
import { decimalTransformer } from "./decimal.transformer";

/** Espelha STATUS_OS_FLOW em src/mocks/status_os.ts — progressão linear, sem pular etapas. */
export const STATUS_OS_FLOW = [
  "aguardando_coleta",
  "em_transporte",
  "recebido",
  "em_andamento",
  "concluido",
  "cinzas_disponiveis",
  "encerrado",
] as const;

export type StatusOS = (typeof STATUS_OS_FLOW)[number];

@Entity("ordens_servico")
export class OrdemServico extends UuidBaseEntity {
  @Column("varchar", { length: 20, unique: true })
  numero: string;

  @Column("uuid")
  petId: string;

  @ManyToOne(() => Pet, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "pet_id" })
  pet: Pet;

  @Column("uuid")
  tutorId: string;

  @ManyToOne(() => Tutor, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "tutor_id" })
  tutor: Tutor;

  @Column("uuid")
  usuarioCriadorId: string;

  @ManyToOne(() => Usuario, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "usuario_criador_id" })
  usuarioCriador: Usuario;

  @Column("uuid")
  modalidadeId: string;

  @ManyToOne(() => ModalidadeServico, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "modalidade_id" })
  modalidade: ModalidadeServico;

  @Column("varchar", { length: 30, default: "aguardando_coleta" })
  status: StatusOS;

  @Column("numeric", { precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  total: number;

  @Column("date", { nullable: true })
  dataFalecimento: string | null;

  @Column("text", { nullable: true })
  observacoes: string | null;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  atualizadoEm: Date;

  @OneToMany(() => OSItem, (item) => item.os)
  itens: OSItem[];

  @OneToMany(() => HistoricoStatusOS, (h) => h.os)
  historico: HistoricoStatusOS[];
}
