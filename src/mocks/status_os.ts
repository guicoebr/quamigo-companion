/**
 * Fluxo linear de status da OS e suas cores oficiais.
 * Ordem (linear): aguardando_coleta → em_transporte → recebido →
 * em_andamento → concluido → cinzas_disponiveis → encerrado.
 */

export const STATUS_OS_FLOW = [
  "aguardando_coleta",
  "em_transporte",
  "recebido",
  "em_andamento",
  "concluido",
  "cinzas_disponiveis",
  "encerrado",
] as const;

export type StatusOS = (typeof STATUS_OS_FLOW)[number];

export const STATUS_OS_META: Record<StatusOS, { label: string; color: string }> = {
  aguardando_coleta: { label: "Aguardando coleta", color: "#B7950B" },
  em_transporte: { label: "Em transporte", color: "#2E86C1" },
  recebido: { label: "Recebido", color: "#1B4F72" },
  em_andamento: { label: "Em andamento", color: "#6C3483" },
  concluido: { label: "Concluído", color: "#1E8449" },
  cinzas_disponiveis: { label: "Cinzas disponíveis", color: "#117A65" },
  encerrado: { label: "Encerrado", color: "#717D7E" },
};

export function nextStatus(current: StatusOS): StatusOS | null {
  const idx = STATUS_OS_FLOW.indexOf(current);
  if (idx < 0 || idx === STATUS_OS_FLOW.length - 1) return null;
  return STATUS_OS_FLOW[idx + 1];
}

export function prevStatus(current: StatusOS): StatusOS | null {
  const idx = STATUS_OS_FLOW.indexOf(current);
  if (idx <= 0) return null;
  return STATUS_OS_FLOW[idx - 1];
}