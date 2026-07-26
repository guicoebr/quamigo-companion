O número da OS já vem prefixado (ex.: `OS-2026-00001`), e o `PageHeader` acrescenta outro "OS" na frente, resultando em "OS OS-2026-00001".

## Mudanças

**src/routes/_app.ordens-servico.$id.tsx**
- Linha 113: trocar `title={`OS ${os.numero}`}` por `title={os.numero}`.
- Linha 29 (head/title da aba): trocar `` `OS ${params.id} — +QAmigo` `` por `` `${params.id} — +QAmigo` `` para manter consistência.

Nenhuma outra tela é afetada.