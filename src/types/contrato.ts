export type StatusContrato = "ativo" | "suspenso" | "encerrado";
export type PeriodicidadeContrato = "mensal" | "trimestral" | "anual";

export type Contrato = {
  id: string;
  numero: string;
  tutorId: string;
  petsIds: string[];
  servicosIds: string[];
  modalidadeId: string;
  status: StatusContrato;
  valorMensal: number;
  periodicidade: PeriodicidadeContrato;
  inicioVigencia: string;
  fimVigencia?: string;
  observacoes?: string;
  criadoEm: string;
};