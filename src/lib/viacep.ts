/**
 * Consulta ViaCEP com timeout e cancelamento.
 * Sem dependências externas — apenas fetch + AbortController nativos.
 */

export type ViaCepResult =
  | {
      status: "ok";
      logradouro: string;
      bairro: string;
      cidade: string;
      uf: string;
    }
  | { status: "not_found" }
  | { status: "aborted" }
  | { status: "error" };

const TIMEOUT_MS = 6000;

export async function fetchViaCep(
  cep8: string,
  externalSignal?: AbortSignal,
): Promise<ViaCepResult> {
  if (externalSignal?.aborted) return { status: "aborted" };

  const internal = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    internal.abort();
  }, TIMEOUT_MS);

  const handleExternalAbort = () => internal.abort();
  externalSignal?.addEventListener("abort", handleExternalAbort, { once: true });

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep8}/json/`, {
      signal: internal.signal,
    });
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data?.erro) return { status: "not_found" };
    return {
      status: "ok",
      logradouro: (data.logradouro ?? "").trim(),
      bairro: (data.bairro ?? "").trim(),
      cidade: (data.localidade ?? "").trim(),
      uf: (data.uf ?? "").trim(),
    };
  } catch (err) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError");
    if (isAbort && !timedOut) return { status: "aborted" };
    return { status: "error" };
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", handleExternalAbort);
  }
}
