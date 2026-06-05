/** Espécies cadastráveis (lookup gerenciado em /configuracoes/especies). */
export type Especie = {
  id: string;
  nome: string;
  ativo: boolean;
};

/** Raça vinculada a uma espécie. */
export type Raca = {
  id: string;
  especieId: string;
  nome: string;
  ativo: boolean;
};

/** Modalidade de serviço funerário (ex.: Individual, Coletiva). */
export type ModalidadeServico = {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
};

/** Catálogo de serviços e produtos vendáveis. */
export type ServicoProduto = {
  id: string;
  nome: string;
  tipo: "servico" | "produto";
  descricao?: string;
  preco: number;
  ativo: boolean;
};