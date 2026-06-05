/**
 * Tipos centrais de autenticação e autorização do +QAmigo.
 */

export type Role = "admin" | "operacional" | "financeiro" | "recepcao";

export const ALL_ROLES: Role[] = ["admin", "operacional", "financeiro", "recepcao"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  operacional: "Operacional",
  financeiro: "Financeiro",
  recepcao: "Recepção",
};

export type User = {
  id: string;
  nome: string;
  email: string;
  role: Role;
  /** Iniciais para o avatar. */
  iniciais: string;
};

/** Ações granulares verificadas via hasPermission. */
export type Permission =
  | "tutor.criar"
  | "tutor.editar"
  | "pet.criar"
  | "obito.registrar"
  | "os.criar"
  | "os.avancar_status"
  | "os.regredir_status"
  | "servico.gerenciar"
  | "contrato.gerenciar"
  | "pagamento.gerenciar"
  | "pagamento.registrar_recebimento"
  | "config.gerenciar";