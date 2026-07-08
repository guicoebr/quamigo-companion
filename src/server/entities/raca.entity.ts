import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Especie } from "./especie.entity";
import { Pet } from "./pet.entity";

@Entity("racas")
export class Raca extends UuidBaseEntity {
  @Column("uuid")
  especieId: string;

  @ManyToOne(() => Especie, (especie) => especie.racas, { onDelete: "CASCADE" })
  @JoinColumn({ name: "especie_id" })
  especie: Especie;

  @Column("varchar", { length: 100 })
  nome: string;

  @Column("boolean", { default: true })
  ativo: boolean;

  @OneToMany(() => Pet, (pet) => pet.raca)
  pets: Pet[];
}
