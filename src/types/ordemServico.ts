import type { StatusOS } from "@/mocks/status_os";

export type ItemOS = {
  id: string;
  servicoProdutoId: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
};

export type HistoricoStatusOS = {
  status: StatusOS;
  ocorridoEm: string;
  usuarioId: string;
  usuarioNome: string;
  observacao?: string;
};

export type OrdemServico = {
  id: string;
  /** Número formatado OS-AAAA-NNNNN. */
  numero: string;
  tutorId: string;
  petId: string;
  modalidadeId: string;
  status: StatusOS;
  itens: ItemOS[];
  /** Soma dos itens. */
  total: number;
  /** Pagamento vinculado, se houver. */
  pagamentoId?: string;
  /** Data do óbito do pet, quando aplicável. */
  dataFalecimento?: string;
  observacoes?: string;
  historico: HistoricoStatusOS[];
  criadoEm: string;
  atualizadoEm: string;
};