import { create } from "zustand";
import type { Tutor } from "@/types/tutor";
import type { Pet } from "@/types/pet";
import type { Contrato } from "@/types/contrato";
import type { Pagamento, Parcela, StatusParcela, StatusPagamento, MetodoPagamento } from "@/types/pagamento";
import type { Especie, Raca, ModalidadeServico, ServicoProduto } from "@/types/lookup";
import type { UsuarioMock } from "@/mocks/usuarios";

/**
 * Store runtime único.
 * Não muta os imports dos mocks: armazena additions (novos) e overrides
 * (campos alterados por id). `useMockData` consolida base + runtime.
 *
 * TODO(api): substituir por chamadas reais (createServerFn) + TanStack Query.
 */

type Overrides<T> = Record<string, Partial<T>>;

type DataState = {
  tutoresNovos: Tutor[];
  tutoresOverrides: Overrides<Tutor>;

  petsNovos: Pet[];
  petsOverrides: Overrides<Pet>;

  servicosProdutosNovos: ServicoProduto[];
  servicosProdutosOverrides: Overrides<ServicoProduto>;

  contratosNovos: Contrato[];
  contratosOverrides: Overrides<Contrato>;

  pagamentosNovos: Pagamento[];
  pagamentosOverrides: Overrides<Pagamento>;

  especiesNovas: Especie[];
  especiesOverrides: Overrides<Especie>;

  racasNovas: Raca[];
  racasOverrides: Overrides<Raca>;

  modalidadesNovas: ModalidadeServico[];
  modalidadesOverrides: Overrides<ModalidadeServico>;

  usuariosNovos: UsuarioMock[];
  usuariosOverrides: Overrides<UsuarioMock>;

  // Tutores
  addTutor: (t: Tutor) => void;
  updateTutor: (id: string, patch: Partial<Tutor>) => void;

  // Pets
  addPet: (p: Pet) => void;
  updatePet: (id: string, patch: Partial<Pet>) => void;

  // Serviços/Produtos
  addServicoProduto: (s: ServicoProduto) => void;
  updateServicoProduto: (id: string, patch: Partial<ServicoProduto>) => void;
  toggleAtivoServicoProduto: (id: string, baseAtivo: boolean) => void;

  // Contratos
  addContrato: (c: Contrato) => void;

  // Pagamentos
  addPagamento: (p: Pagamento) => void;
  darBaixaParcela: (
    pagamentoId: string,
    parcelaId: string,
    metodo: MetodoPagamento,
    base: Pagamento,
  ) => void;

  // Lookups
  addEspecie: (e: Especie) => void;
  updateEspecie: (id: string, patch: Partial<Especie>) => void;
  addRaca: (r: Raca) => void;
  updateRaca: (id: string, patch: Partial<Raca>) => void;
  addModalidade: (m: ModalidadeServico) => void;
  updateModalidade: (id: string, patch: Partial<ModalidadeServico>) => void;

  // Usuários
  addUsuario: (u: UsuarioMock) => void;
  updateUsuario: (id: string, patch: Partial<UsuarioMock>) => void;
};

function mergeOverride<T>(map: Overrides<T>, id: string, patch: Partial<T>): Overrides<T> {
  return { ...map, [id]: { ...(map[id] ?? {}), ...patch } };
}

function recomputePagamentoStatus(parcelas: Parcela[]): StatusPagamento {
  const ativas = parcelas.filter((p) => p.status !== "cancelado");
  if (ativas.length === 0) return "cancelado";
  const pagas = ativas.filter((p) => p.status === "pago").length;
  if (pagas === 0) return "aberto";
  if (pagas === ativas.length) return "quitado";
  return "parcial";
}

export const useDataStore = create<DataState>((set) => ({
  tutoresNovos: [],
  tutoresOverrides: {},
  petsNovos: [],
  petsOverrides: {},
  servicosProdutosNovos: [],
  servicosProdutosOverrides: {},
  contratosNovos: [],
  contratosOverrides: {},
  pagamentosNovos: [],
  pagamentosOverrides: {},
  especiesNovas: [],
  especiesOverrides: {},
  racasNovas: [],
  racasOverrides: {},
  modalidadesNovas: [],
  modalidadesOverrides: {},
  usuariosNovos: [],
  usuariosOverrides: {},

  addTutor: (t) => set((s) => ({ tutoresNovos: [t, ...s.tutoresNovos] })),
  updateTutor: (id, patch) =>
    set((s) => {
      const novo = s.tutoresNovos.find((x) => x.id === id);
      if (novo) {
        return { tutoresNovos: s.tutoresNovos.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      }
      return { tutoresOverrides: mergeOverride(s.tutoresOverrides, id, patch) };
    }),

  addPet: (p) => set((s) => ({ petsNovos: [p, ...s.petsNovos] })),
  updatePet: (id, patch) =>
    set((s) => {
      const novo = s.petsNovos.find((x) => x.id === id);
      if (novo) {
        return { petsNovos: s.petsNovos.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      }
      return { petsOverrides: mergeOverride(s.petsOverrides, id, patch) };
    }),

  addServicoProduto: (sp) => set((s) => ({ servicosProdutosNovos: [sp, ...s.servicosProdutosNovos] })),
  updateServicoProduto: (id, patch) =>
    set((s) => {
      const novo = s.servicosProdutosNovos.find((x) => x.id === id);
      if (novo) {
        return {
          servicosProdutosNovos: s.servicosProdutosNovos.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        };
      }
      return {
        servicosProdutosOverrides: mergeOverride(s.servicosProdutosOverrides, id, patch),
      };
    }),
  toggleAtivoServicoProduto: (id, baseAtivo) =>
    set((s) => {
      const novo = s.servicosProdutosNovos.find((x) => x.id === id);
      if (novo) {
        return {
          servicosProdutosNovos: s.servicosProdutosNovos.map((x) =>
            x.id === id ? { ...x, ativo: !x.ativo } : x,
          ),
        };
      }
      const override = s.servicosProdutosOverrides[id];
      const atual = override?.ativo ?? baseAtivo;
      return {
        servicosProdutosOverrides: mergeOverride(s.servicosProdutosOverrides, id, { ativo: !atual }),
      };
    }),

  addContrato: (c) => set((s) => ({ contratosNovos: [c, ...s.contratosNovos] })),

  addPagamento: (p) => set((s) => ({ pagamentosNovos: [p, ...s.pagamentosNovos] })),
  darBaixaParcela: (pagamentoId, parcelaId, metodo, base) =>
    set((s) => {
      const hoje = new Date().toISOString().slice(0, 10);
      const novo = s.pagamentosNovos.find((x) => x.id === pagamentoId);
      if (novo) {
        return {
          pagamentosNovos: s.pagamentosNovos.map((x) => {
            if (x.id !== pagamentoId) return x;
            const parcelas: Parcela[] = x.parcelas.map((par) =>
              par.id === parcelaId
                ? ({ ...par, status: "pago" as StatusParcela, pagaEm: hoje, metodo })
                : par,
            );
            return { ...x, parcelas, status: recomputePagamentoStatus(parcelas) };
          }),
        };
      }
      const override = s.pagamentosOverrides[pagamentoId];
      const parcelasAtuais: Parcela[] = override?.parcelas ?? base.parcelas;
      const parcelas: Parcela[] = parcelasAtuais.map((par) =>
        par.id === parcelaId
          ? ({ ...par, status: "pago" as StatusParcela, pagaEm: hoje, metodo })
          : par,
      );
      return {
        pagamentosOverrides: mergeOverride(s.pagamentosOverrides, pagamentoId, {
          parcelas,
          status: recomputePagamentoStatus(parcelas),
        }),
      };
    }),

  addEspecie: (e) => set((s) => ({ especiesNovas: [e, ...s.especiesNovas] })),
  updateEspecie: (id, patch) =>
    set((s) => {
      const novo = s.especiesNovas.find((x) => x.id === id);
      if (novo) {
        return { especiesNovas: s.especiesNovas.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      }
      return { especiesOverrides: mergeOverride(s.especiesOverrides, id, patch) };
    }),

  addRaca: (r) => set((s) => ({ racasNovas: [r, ...s.racasNovas] })),
  updateRaca: (id, patch) =>
    set((s) => {
      const novo = s.racasNovas.find((x) => x.id === id);
      if (novo) {
        return { racasNovas: s.racasNovas.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      }
      return { racasOverrides: mergeOverride(s.racasOverrides, id, patch) };
    }),

  addModalidade: (m) => set((s) => ({ modalidadesNovas: [m, ...s.modalidadesNovas] })),
  updateModalidade: (id, patch) =>
    set((s) => {
      const novo = s.modalidadesNovas.find((x) => x.id === id);
      if (novo) {
        return { modalidadesNovas: s.modalidadesNovas.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      }
      return { modalidadesOverrides: mergeOverride(s.modalidadesOverrides, id, patch) };
    }),

  addUsuario: (u) => set((s) => ({ usuariosNovos: [u, ...s.usuariosNovos] })),
  updateUsuario: (id, patch) =>
    set((s) => {
      const novo = s.usuariosNovos.find((x) => x.id === id);
      if (novo) {
        return { usuariosNovos: s.usuariosNovos.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      }
      return { usuariosOverrides: mergeOverride(s.usuariosOverrides, id, patch) };
    }),
}));

/** Helper para consumidores que querem `Pagamento` resolvido. */
export function applyPagamentoOverride(base: Pagamento, ov?: Partial<Pagamento>): Pagamento {
  if (!ov) return base;
  return { ...base, ...ov };
}