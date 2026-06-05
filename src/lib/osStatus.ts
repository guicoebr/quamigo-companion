/**
 * Re-export utilitário para manter a importação consistente em
 * componentes que tratam a lógica de status sem ler os mocks.
 */
export {
  STATUS_OS_FLOW,
  STATUS_OS_META,
  nextStatus,
  prevStatus,
} from "@/mocks/status_os";
export type { StatusOS } from "@/mocks/status_os";