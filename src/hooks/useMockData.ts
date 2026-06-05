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

/**
 * Hook centralizado para acessar os mocks no frontend.
 *
 * TODO(api): substituir por chamadas reais (createServerFn) e mover para
 * TanStack Query usando `queryOptions` por entidade.
 */
export function useMockData() {
  const novasOS = useOSStore((s) => s.novas);
  const overrides = useOSStore((s) => s.overrides);
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
    tutores: tutoresMock,
    pets: petsMock,
    ordensServico,
    pagamentos: pagamentosMock,
    contratos: contratosMock,
    usuarios: usuariosMock,
    especies: especiesMock,
    racas: racasMock,
    modalidades: modalidadesMock,
    servicosProdutos: servicosProdutosMock,
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
  return tutoresMock.find((t) => t.id === id);
}
export function findPet(id: string) {
  return petsMock.find((p) => p.id === id);
}
export function findEspecie(id: string) {
  return especiesMock.find((e) => e.id === id);
}
export function findRaca(id: string) {
  return racasMock.find((r) => r.id === id);
}
export function findModalidade(id: string) {
  return modalidadesMock.find((m) => m.id === id);
}
export function findServicoProduto(id: string) {
  return servicosProdutosMock.find((s) => s.id === id);
}
export function findPagamento(id: string) {
  return pagamentosMock.find((p) => p.id === id);
}
export function petsDoTutor(tutorId: string) {
  return petsMock.filter((p) => p.tutorId === tutorId);
}
export function osDoTutor(tutorId: string) {
  const novas = useOSStore.getState().novas;
  return [...novas, ...ordensServicoMock].filter((os) => os.tutorId === tutorId);
}