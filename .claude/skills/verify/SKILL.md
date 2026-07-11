---
name: verify
description: Como buildar, rodar e dirigir o app +QAmigo neste WSL para verificar mudanças end-to-end.
---

# Verificar o +QAmigo neste ambiente

## Ambiente (gotchas primeiro)
- **Não há bun/node/npx no PATH deste WSL.** Baixe o bun standalone:
  `curl -fsSL -o bun.zip https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip`
  e extraia com `python3 -c "import zipfile; zipfile.ZipFile('bun.zip').extractall('.')"` (não há `unzip`).
- `bun install` falha no postinstall do puppeteer — use `PUPPETEER_SKIP_DOWNLOAD=true bun install`.
- O Postgres de dev geralmente já está de pé via docker (`docker ps` → `qamigo-pet-care-db-1`,
  porta 5432; o container `app` ocupa a 3000). Senão: `docker compose up -d db`.
- Dev server: `bun run dev --port 3001` (evita conflito com o container na 3000). O `.env`
  do repo já aponta para o Postgres local.

## Login
Usuários do seed (senha `123456` para todos): `admin@qamigo.com`, `op@qamigo.com`,
`fin@qamigo.com`, `rec@qamigo.com`.

## Dirigir a UI (headless)
- Sem chrome no sistema. Baixe o chrome-headless-shell manualmente (o installer do
  puppeteer falha por falta de `unzip`): pegue a versão pinada em
  `~/.cache/puppeteer/chrome-headless-shell/linux-<ver>/` de
  `https://storage.googleapis.com/chrome-for-testing-public/<ver>/linux64/chrome-headless-shell-linux64.zip`,
  extraia com python zipfile (restaurando permissões via `external_attr`).
- Faltam `libnspr4`, `libnss3` e `libasound2t64`: `apt-get download` (não precisa de root) +
  `dpkg -x` para um dir local, e rode com `LD_LIBRARY_PATH=<dir>/usr/lib/x86_64-linux-gnu`.
- Puppeteer: `puppeteer.launch({ headless: "shell", args: ["--no-sandbox"] })`.

## Seletores que funcionam
- Forms (react-hook-form): `input[name="nome"]` etc. Os labels NÃO têm `htmlFor`.
- CUIDADO: o topbar tem `placeholder="Buscar tutor, pet ou OS..."` — seletores com
  `placeholder*=` casam nele antes do campo do form. Use match exato
  (`input[placeholder="Buscar tutor"]`) ou `input[placeholder^=...]` específico.
- Os nomes do seed demo são completos ("Gustavo Henrique Martins") — busque por
  substring real, não por nome inventado.
- Para trocar de usuário logado: `Network.clearBrowserCookies` via CDP antes de ir
  ao /login (com sessão ativa, /login redireciona ao dashboard).
- Selects shadcn/radix: clique no `button[role="combobox"]` e depois em `[role="option"]`.
- Cards de seleção de tutor/pet (wizard de óbito, form de pet): `button p` com o texto do nome.

## Gotcha crítico de fluxo
OS e pagamentos criados no app vivem só em stores zustand **em memória** (sem persist).
Qualquer `page.goto` (reload) os apaga. Para verificar telas que exibem uma OS/pagamento
recém-criado (dashboard, /pagamentos), navegue **client-side** clicando nos links do
sidebar, nunca com `goto`.

## Limpeza
Dados de teste vão para o Postgres real de dev. Apague depois:
`docker exec qamigo-pet-care-db-1 psql -U qamigo -d qamigo -c "DELETE FROM pets WHERE ...; DELETE FROM tutores WHERE ...;"`
(pets antes de tutores, por FK).
