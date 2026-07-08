import { Column, Entity, OneToMany, UpdateDateColumn } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Pet } from "./pet.entity";

@Entity("tutores")
export class Tutor extends UuidBaseEntity {
  @Column("varchar", { length: 200 })
  nome: string;

  @Column("varchar", { length: 11, unique: true })
  cpf: string;

  @Column("varchar", { length: 200 })
  email: string;

  @Column("varchar", { length: 20 })
  telefone: string;

  @Column("varchar", { length: 8 })
  cep: string;

  @Column("varchar", { length: 200 })
  logradouro: string;

  @Column("varchar", { length: 20 })
  numero: string;

  @Column("varchar", { length: 100, nullable: true })
  complemento: string | null;

  @Column("varchar", { length: 100 })
  bairro: string;

  @Column("varchar", { length: 100 })
  cidade: string;

  @Column("char", { length: 2 })
  uf: string;

  @Column("text", { nullable: true })
  observacoes: string | null;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  atualizadoEm: Date;

  @OneToMany(() => Pet, (pet) => pet.tutor)
  pets: Pet[];
}
