import { PrimaryColumn } from "typeorm";

/** PK UUID compartilhada por todas as entidades (gen_random_uuid(), extensão pgcrypto). */
export abstract class UuidBaseEntity {
  @PrimaryColumn("uuid", { default: () => "gen_random_uuid()" })
  id: string;
}
