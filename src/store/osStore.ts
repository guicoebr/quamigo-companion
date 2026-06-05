import { create } from "zustand";
import type { OrdemServico } from "@/types/ordemServico";

/**
 * Armazena OS criadas em runtime pelo stepper de óbito (Bloco 6).
 * TODO(api): substituir por mutação real via createServerFn e invalidar
 * a query de listagem de OS.
 */
type OSState = {
  novas: OrdemServico[];
  addOS: (os: OrdemServico) => void;
};

export const useOSStore = create<OSState>((set) => ({
  novas: [],
  addOS: (os) => set((s) => ({ novas: [os, ...s.novas] })),
}));