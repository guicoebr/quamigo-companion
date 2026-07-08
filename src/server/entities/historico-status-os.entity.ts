import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { UuidBaseEntity } from "./base.entity";
import { OrdemServico, type StatusOS } from "./ordem-servico.entity";
import { Usuario } from "./usuario.entity";

@Entity("historico_status_os")
export class HistoricoStatusOS extends UuidBaseEntity {
  @Column("uuid")
  osId: string;

  @ManyToOne(() => OrdemServico, (os) => os.historico, { onDelete: "CASCADE" })
  @JoinColumn({ name: "os_id" })
  os: OrdemServico;

  @Column("varchar", { length: 30 })
  status: StatusOS;

  @Column("timestamptz", { default: () => "now()" })
  ocorridoEm: Date;

  @Column("uuid")
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "usuario_id" })
  usuario: Usuario;

  /** Cópia do nome do usuário no momento da transição (o mock já denormaliza isso). */
  @Column("varchar", { length: 200 })
  usuarioNome: string;

  @Column("text", { nullable: true })
  observacao: string | null;
}
