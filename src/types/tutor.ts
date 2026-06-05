export type Tutor = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  observacoes?: string;
  criadoEm: string;
};