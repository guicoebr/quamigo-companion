import { create } from "zustand";
import type { OrdemServico, HistoricoStatusOS } from "@/types/ordemServico";
import type { StatusOS } from "@/mocks/status_os";

/**
 * Armazena OS criadas em runtime pelo stepper de óbito (Bloco 6).
 * TODO(api): substituir por mutação real via createServerFn e invalidar
 * a query de listagem de OS.
 */
type OSState = {
  novas: OrdemServico[];
  /** Overrides aplicados a OS dos mocks (status atual + histórico adicional). */
  overrides: Record<string, { status: StatusOS; historico: HistoricoStatusOS[] }>;
  addOS: (os: OrdemServico) => void;
  applyStatusChange: (
    osId: string,
    baseOS: OrdemServico,
    novoStatus: StatusOS,
    entrada: HistoricoStatusOS,
  ) => void;
};

export const useOSStore = create<OSState>((set) => ({
  novas: [],
  overrides: {},
  addOS: (os) => set((s) => ({ novas: [os, ...s.novas] })),
  applyStatusChange: (osId, baseOS, novoStatus, entrada) =>
    set((s) => {
      // Se a OS está na lista de novas, mutamos diretamente.
      const nova = s.novas.find((o) => o.id === osId);
      if (nova) {
        return {
          novas: s.novas.map((o) =>
            o.id === osId
              ? {
                  ...o,
                  status: novoStatus,
                  historico: [...o.historico, entrada],
                  atualizadoEm: entrada.ocorridoEm,
                }
              : o,
          ),
        };
      }
      const atual = s.overrides[osId];
      const histAnterior = atual?.historico ?? [];
      return {
        overrides: {
          ...s.overrides,
          [osId]: {
            status: novoStatus,
            historico: [...baseOS.historico, ...histAnterior, entrada],
          },
        },
      };
    }),
}));