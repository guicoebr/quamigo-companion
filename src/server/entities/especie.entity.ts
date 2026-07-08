import { Column, Entity, OneToMany } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Raca } from "./raca.entity";
import { Pet } from "./pet.entity";

@Entity("especies")
export class Especie extends UuidBaseEntity {
  @Column("varchar", { length: 100, unique: true })
  nome: string;

  @Column("boolean", { default: true })
  ativo: boolean;

  @OneToMany(() => Raca, (raca) => raca.especie)
  racas: Raca[];

  @OneToMany(() => Pet, (pet) => pet.especie)
  pets: Pet[];
}
