import { Column, Entity } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import type { Role } from "@/types/auth";

export type { Role };

@Entity("usuarios")
export class Usuario extends UuidBaseEntity {
  @Column("varchar", { length: 200 })
  nome: string;

  @Column("varchar", { length: 200, unique: true })
  email: string;

  @Column("text")
  senhaHash: string;

  @Column("varchar", { length: 20, default: "recepcao" })
  role: Role;

  @Column("boolean", { default: true })
  ativo: boolean;

  @Column("timestamptz", { default: () => "now()" })
  criadoEm: Date;
}
