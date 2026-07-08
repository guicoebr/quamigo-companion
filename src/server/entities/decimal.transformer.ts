import type { ValueTransformer } from "typeorm";

/** node-postgres retorna NUMERIC como string (evita perda de precisão); os tipos do
 * frontend esperam `number` em todos os campos monetários — converte nos dois sentidos. */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number) => value,
  from: (value?: string) => (value === null || value === undefined ? value : parseFloat(value)),
};
