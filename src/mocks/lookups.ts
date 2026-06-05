import type { Especie, ModalidadeServico, Raca, ServicoProduto } from "@/types/lookup";

export const especiesMock: Especie[] = [
  { id: "esp-1", nome: "Cão", ativo: true },
  { id: "esp-2", nome: "Gato", ativo: true },
  { id: "esp-3", nome: "Coelho", ativo: true },
  { id: "esp-4", nome: "Ave", ativo: false },
];

export const racasMock: Raca[] = [
  // Cães
  { id: "raca-1", especieId: "esp-1", nome: "SRD", ativo: true },
  { id: "raca-2", especieId: "esp-1", nome: "Golden Retriever", ativo: true },
  { id: "raca-3", especieId: "esp-1", nome: "Labrador", ativo: true },
  { id: "raca-4", especieId: "esp-1", nome: "Yorkshire", ativo: true },
  { id: "raca-5", especieId: "esp-1", nome: "Pinscher", ativo: true },
  { id: "raca-6", especieId: "esp-1", nome: "Bulldog Francês", ativo: true },
  // Gatos
  { id: "raca-7", especieId: "esp-2", nome: "SRD", ativo: true },
  { id: "raca-8", especieId: "esp-2", nome: "Persa", ativo: true },
  { id: "raca-9", especieId: "esp-2", nome: "Siamês", ativo: true },
  { id: "raca-10", especieId: "esp-2", nome: "Maine Coon", ativo: true },
  // Coelho
  { id: "raca-11", especieId: "esp-3", nome: "Holandês", ativo: true },
];

export const modalidadesMock: ModalidadeServico[] = [
  { id: "mod-1", nome: "Cremação individual", descricao: "Cinzas devolvidas ao tutor.", ativo: true },
  { id: "mod-2", nome: "Cremação coletiva", descricao: "Sem devolução de cinzas.", ativo: true },
  { id: "mod-3", nome: "Sepultamento", descricao: "Sepultamento em jazigo conveniado.", ativo: true },
  { id: "mod-4", nome: "Velório", descricao: "Sala de velório por 2 horas.", ativo: true },
];

export const servicosProdutosMock: ServicoProduto[] = [
  { id: "sp-1", nome: "Cremação individual até 10kg", tipo: "servico", preco: 480, ativo: true },
  { id: "sp-2", nome: "Cremação individual 10–25kg", tipo: "servico", preco: 720, ativo: true },
  { id: "sp-3", nome: "Cremação individual acima de 25kg", tipo: "servico", preco: 980, ativo: true },
  { id: "sp-4", nome: "Cremação coletiva", tipo: "servico", preco: 280, ativo: true },
  { id: "sp-5", nome: "Coleta domiciliar (até 20km)", tipo: "servico", preco: 120, ativo: true },
  { id: "sp-6", nome: "Velório 2h", tipo: "servico", preco: 350, ativo: true },
  { id: "sp-7", nome: "Urna decorativa madeira", tipo: "produto", preco: 220, ativo: true },
  { id: "sp-8", nome: "Urna biodegradável", tipo: "produto", preco: 160, ativo: true },
  { id: "sp-9", nome: "Placa memorial gravada", tipo: "produto", preco: 95, ativo: true },
  { id: "sp-10", nome: "Pata em resina", tipo: "produto", preco: 75, ativo: true },
];