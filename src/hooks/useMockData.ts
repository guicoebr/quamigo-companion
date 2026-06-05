import { tutoresMock } from "@/mocks/tutores";
import { petsMock } from "@/mocks/pets";
import { ordensServicoMock } from "@/mocks/ordens_servico";
import { pagamentosMock } from "@/mocks/pagamentos";
import { contratosMock } from "@/mocks/contratos";
import { usuariosMock } from "@/mocks/usuarios";
import {
  especiesMock,
  racasMock,
  modalidadesMock,
  servicosProdutosMock,
} from "@/mocks/lookups";
import { useOSStore } from "@/store/osStore";
import { useDataStore } from "@/store/dataStore";
import type { Tutor } from "@/types/tutor";
import type { Pet } from "@/types/pet";
import type { Contrato } from "@/types/contrato";
import type { Pagamento } from "@/types/pagamento";
import type {
  Especie,
  Raca,
  ModalidadeServico,
  ServicoProduto,
} from "@/types/lookup";
import type { UsuarioMock } from "@/mocks/usuarios";

function mergeList<T extends { id: string }>(
  base: T[],
  novos: T[],
  overrides: Record<string, Partial<T>>,
): T[] {
  const adicionados = novos.filter((n) => !base.some((b) => b.id === n.id));
  return [
    ...adicionados,
    ...base.map((b) => (overrides[b.id] ? { ...b, ...overrides[b.id] } : b)),
  ];
}

/**
 * Hook centralizado para acessar os dados consolidados (mocks base +
 * additions/overrides do dataStore + OS overrides do osStore).
 *
 * TODO(api): substituir por chamadas reais (createServerFn) e TanStack Query.
 */
export function useMockData() {
  const novasOS = useOSStore((s) => s.novas);
  const overrides = useOSStore((s) => s.overrides);
  const ds = useDataStore();
  const ordensServico = [
    ...novasOS,
    ...ordensServicoMock.map((o) => {
      const ov = overrides[o.id];
      if (!ov) return o;
      return {
        ...o,
        status: ov.status,
        historico: ov.historico,
        atualizadoEm: ov.historico[ov.historico.length - 1]?.ocorridoEm ?? o.atualizadoEm,
      };
    }),
  ];
  return {
    tutores: mergeList<Tutor>(tutoresMock, ds.tutoresNovos, ds.tutoresOverrides),
    pets: mergeList<Pet>(petsMock, ds.petsNovos, ds.petsOverrides),
    ordensServico,
    pagamentos: mergeList<Pagamento>(pagamentosMock, ds.pagamentosNovos, ds.pagamentosOverrides),
    contratos: mergeList<Contrato>(contratosMock, ds.contratosNovos, ds.contratosOverrides),
    usuarios: mergeList<UsuarioMock>(usuariosMock, ds.usuariosNovos, ds.usuariosOverrides),
    especies: mergeList<Especie>(especiesMock, ds.especiesNovas, ds.especiesOverrides),
    racas: mergeList<Raca>(racasMock, ds.racasNovas, ds.racasOverrides),
    modalidades: mergeList<ModalidadeServico>(
      modalidadesMock,
      ds.modalidadesNovas,
      ds.modalidadesOverrides,
    ),
    servicosProdutos: mergeList<ServicoProduto>(
      servicosProdutosMock,
      ds.servicosProdutosNovos,
      ds.servicosProdutosOverrides,
    ),
  };
}

/** Lookup de OS por id considerando novas + overrides. */
export function findOS(id: string) {
  const { novas, overrides } = useOSStore.getState();
  const nova = novas.find((o) => o.id === id);
  if (nova) return nova;
  const base = ordensServicoMock.find((o) => o.id === id);
  if (!base) return undefined;
  const ov = overrides[id];
  if (!ov) return base;
  return {
    ...base,
    status: ov.status,
    historico: ov.historico,
    atualizadoEm: ov.historico[ov.historico.length - 1]?.ocorridoEm ?? base.atualizadoEm,
  };
}

/** Lookups por id, conveniências usadas nas listagens. */
export function findTutor(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.tutoresNovos.find((t) => t.id === id);
  if (novo) return novo;
  const base = tutoresMock.find((t) => t.id === id);
  if (!base) return undefined;
  const ov = ds.tutoresOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function findPet(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.petsNovos.find((p) => p.id === id);
  if (novo) return novo;
  const base = petsMock.find((p) => p.id === id);
  if (!base) return undefined;
  const ov = ds.petsOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function findEspecie(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.especiesNovas.find((e) => e.id === id);
  if (novo) return novo;
  const base = especiesMock.find((e) => e.id === id);
  if (!base) return undefined;
  const ov = ds.especiesOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function findRaca(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.racasNovas.find((r) => r.id === id);
  if (novo) return novo;
  const base = racasMock.find((r) => r.id === id);
  if (!base) return undefined;
  const ov = ds.racasOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function findModalidade(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.modalidadesNovas.find((m) => m.id === id);
  if (novo) return novo;
  const base = modalidadesMock.find((m) => m.id === id);
  if (!base) return undefined;
  const ov = ds.modalidadesOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function findServicoProduto(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.servicosProdutosNovos.find((s) => s.id === id);
  if (novo) return novo;
  const base = servicosProdutosMock.find((s) => s.id === id);
  if (!base) return undefined;
  const ov = ds.servicosProdutosOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function findPagamento(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.pagamentosNovos.find((p) => p.id === id);
  if (novo) return novo;
  const base = pagamentosMock.find((p) => p.id === id);
  if (!base) return undefined;
  const ov = ds.pagamentosOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function findContrato(id: string) {
  const ds = useDataStore.getState();
  const novo = ds.contratosNovos.find((c) => c.id === id);
  if (novo) return novo;
  const base = contratosMock.find((c) => c.id === id);
  if (!base) return undefined;
  const ov = ds.contratosOverrides[id];
  return ov ? { ...base, ...ov } : base;
}
export function petsDoTutor(tutorId: string) {
  const ds = useDataStore.getState();
  const base = petsMock.map((p) => {
    const ov = ds.petsOverrides[p.id];
    return ov ? { ...p, ...ov } : p;
  });
  return [...ds.petsNovos, ...base].filter((p) => p.tutorId === tutorId);
}
export function osDoTutor(tutorId: string) {
  const novas = useOSStore.getState().novas;
  return [...novas, ...ordensServicoMock].filter((os) => os.tutorId === tutorId);
}

export function nextContratoNumber(existing: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `CT-${year}-`;
  const maxSeq = existing
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(maxSeq + 1).padStart(5, "0")}`;
}