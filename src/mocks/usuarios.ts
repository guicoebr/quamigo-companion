import type { Role } from "@/types/auth";

/**
 * Usuários administráveis (CRUD em /configuracoes/usuarios no Bloco 9).
 * Os 4 primeiros correspondem aos logins mock do authStore.
 */
export type UsuarioMock = {
  id: string;
  nome: string;
  email: string;
  role: Role;
  ativo: boolean;
  criadoEm: string;
};

export const usuariosMock: UsuarioMock[] = [
  { id: "u-admin", nome: "Ana Administradora", email: "admin@qamigo.com", role: "admin", ativo: true, criadoEm: "2025-01-10T09:00:00Z" },
  { id: "u-op", nome: "Otávio Operacional", email: "op@qamigo.com", role: "operacional", ativo: true, criadoEm: "2025-01-12T09:00:00Z" },
  { id: "u-fin", nome: "Fernanda Financeiro", email: "fin@qamigo.com", role: "financeiro", ativo: true, criadoEm: "2025-01-12T09:00:00Z" },
  { id: "u-rec", nome: "Renata Recepção", email: "rec@qamigo.com", role: "recepcao", ativo: true, criadoEm: "2025-01-15T09:00:00Z" },
  { id: "u-op2", nome: "Bruno Carvalho", email: "bruno.carvalho@qamigo.com", role: "operacional", ativo: true, criadoEm: "2025-03-04T09:00:00Z" },
  { id: "u-rec2", nome: "Camila Duarte", email: "camila.duarte@qamigo.com", role: "recepcao", ativo: false, criadoEm: "2025-04-22T09:00:00Z" },
];