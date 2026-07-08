import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { Contrato } from "./contrato.entity";
import { Pet } from "./pet.entity";

/**
 * Junção contrato↔pet (M:N na tabela, mas a regra de negócio "um pet só pode ter um
 * contrato ativo por vez" é validada na camada de serviço ao criar/reativar contrato,
 * não é expressável como constraint simples aqui — status "ativo" vive em `contratos`.
 */
@Entity("contrato_pets")
export class ContratoPet extends UuidBaseEntity {
  @Column("uuid")
  contratoId: string;

  @ManyToOne(() => Contrato, (c) => c.contratoPets, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contrato_id" })
  contrato: Contrato;

  @Column("uuid")
  petId: string;

  @ManyToOne(() => Pet, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pet_id" })
  pet: Pet;
}
