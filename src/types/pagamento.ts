export type StatusParcela = "pendente" | "pago" | "atrasado" | "cancelado";
export type StatusPagamento = "aberto" | "parcial" | "quitado" | "cancelado";
export type MetodoPagamento = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto";
export type OrigemPagamento = "ordem_servico" | "contrato";

export type Parcela = {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: StatusParcela;
  pagaEm?: string;
  metodo?: MetodoPagamento;
};

export type Pagamento = {
  id: string;
  /** Número formatado PG-AAAA-NNNNN. */
  numero: string;
  origem: OrigemPagamento;
  ordemServicoId?: string;
  contratoId?: string;
  tutorId: string;
  valorTotal: number;
  status: StatusPagamento;
  parcelas: Parcela[];
  criadoEm: string;
};