import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Tutor } from "./tutor.entity";
import { Especie } from "./especie.entity";
import { Raca } from "./raca.entity";
import { decimalTransformer } from "./decimal.transformer";

export type SexoPet = "macho" | "femea";

@Entity("pets")
export class Pet extends UuidBaseEntity {
  @Column("uuid")
  tutorId: string;

  @ManyToOne(() => Tutor, (tutor) => tutor.pets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tutor_id" })
  tutor: Tutor;

  @Column("uuid", { nullable: true })
  especieId: string | null;

  @ManyToOne(() => Especie, (especie) => especie.pets, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "especie_id" })
  especie: Especie | null;

  @Column("uuid", { nullable: true })
  racaId: string | null;

  @ManyToOne(() => Raca, (raca) => raca.pets, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "raca_id" })
  raca: Raca | null;

  @Column("varchar", { length: 100 })
  nome: string;

  @Column("varchar", { length: 10 })
  sexo: SexoPet;

  @Column("varchar", { length: 80 })
  cor: string;

  @Column("numeric", { precision: 6, scale: 2, transformer: decimalTransformer })
  pesoKg: number;

  @Column("date", { nullable: true })
  dataNascimento: string | null;

  /** Preenchida pelo backend ao registrar o óbito (criarObito), em sincronia com a OS. */
  @Column("date", { nullable: true })
  dataFalecimento: string | null;

  @Column("text", { nullable: true })
  observacoes: string | null;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;
}
