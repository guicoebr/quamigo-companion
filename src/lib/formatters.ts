/** Formatação centralizada (pt-BR). */

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/* ============ CPF ============ */

export function unformatCpf(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(v: string | null | undefined): string {
  const d = unformatCpf(v);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function isValidCpf(v: string | null | undefined): boolean {
  const d = unformatCpf(v);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(d[i], 10) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(d[9], 10) && calc(10) === parseInt(d[10], 10);
}

/** Alias legado — mantém call-sites existentes funcionando. */
export function formatCPF(cpf: string): string {
  return formatCpf(cpf);
}

/* ============ Telefone ============ */

export function unformatPhone(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(v: string | null | undefined): string {
  const d = unformatPhone(v);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Alias legado. */
export function formatTelefone(tel: string): string {
  return formatPhone(tel);
}

/* ============ CEP ============ */

export function unformatCep(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "").slice(0, 8);
}

export function formatCep(v: string | null | undefined): string {
  const d = unformatCep(v);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function isValidCep(v: string | null | undefined): boolean {
  const d = unformatCep(v);
  if (d.length !== 8) return false;
  if (/^(\d)\1{7}$/.test(d)) return false;
  return true;
}

/** Alias legado — mantém call-sites existentes funcionando. */
export function formatCEP(cep: string | null | undefined): string {
  return formatCep(cep);
}

/**
 * Formata cidade e UF preservando a caixa original do texto.
 * - cidade + uf → "Cidade/UF"
 * - só cidade  → "Cidade"
 * - só uf      → "UF"
 * - nenhum     → "—"
 */
export function formatCidadeUf(
  cidade?: string | null,
  uf?: string | null,
): string {
  const c = (cidade ?? "").trim();
  const u = (uf ?? "").trim();
  if (c && u) return `${c}/${u}`;
  if (c) return c;
  if (u) return u;
  return "—";
}
/**
 * Monta um endereço em uma única linha, ignorando partes vazias.
 * Exemplo: "Rua das Flores, 123, Sala 2 — Centro — Araçatuba/SP".
 * Retorna "—" quando não há nenhum dado.
 */
export function formatEnderecoResumido(endereco: {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}): string {
  const logradouro = (endereco.logradouro ?? "").trim();
  const numero = (endereco.numero ?? "").trim();
  const complemento = (endereco.complemento ?? "").trim();
  const bairro = (endereco.bairro ?? "").trim();
  const cidadeUf = formatCidadeUf(endereco.cidade, endereco.uf);

  const enderecoPrincipal = [
    logradouro && numero ? `${logradouro}, ${numero}` : logradouro || numero,
    complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const partes = [
    enderecoPrincipal,
    bairro,
    cidadeUf !== "—" ? cidadeUf : "",
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" — ") : "—";
}

// Numeração de OS/PG/CT agora é atômica no servidor — ver src/server/numbering.server.ts.
