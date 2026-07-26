## Contexto

O erro de login no `www` vem do driver `pg` falhando handshake TLS contra o proxy da Railway no runtime da Cloudflare (já diagnosticado nas rodadas anteriores). Como o schema e todos os dados **já foram migrados** para o Lovable Cloud (Fases 1 e 2 concluídas nesta sessão) e os 4 usuários já existem no Auth com os mesmos UUIDs, o próximo passo é substituir o código que ainda fala com Railway/pg pelo cliente Supabase. Isso remove o driver problemático e o login volta a funcionar em preview **e** publicado.

## Escopo desta entrega

Reescrever a camada de dados e de autenticação para Supabase, sem alterar UI/regras de negócio visíveis ao usuário. Nada muda na aparência das telas.

### 1. Autenticação (destrava o login no www)
- `src/store/authStore.ts`: `login`/`logout`/`hydrate` passam a usar `supabase.auth.signInWithPassword`, `signOut`, `getSession` + leitura de `profiles` e `user_roles` para montar o `User` (id, nome, email, role).
- `src/routes/login.tsx`: chamar diretamente `supabase.auth.signInWithPassword`; remover dependência da server function customizada.
- `src/routes/__root.tsx` / `src/routes/_app.tsx`: hidratar sessão via `supabase.auth.getSession()` e escutar `onAuthStateChange` para invalidar rotas.
- Sair de vez do fluxo de cookie httpOnly custom (`src/server/auth.server.ts`, `session.server.ts`) — a sessão passa a ser gerida pelo Supabase no `localStorage`.

### 2. Reescrever `src/lib/api/*.functions.ts` (10 arquivos)
Cada função deixa de importar `getDataSource()`/repositórios TypeORM e passa a usar `context.supabase` via `.middleware([requireSupabaseAuth])`. Ordem de execução:

1. `auth.functions.ts` — `me()` lê `profiles` + `user_roles` do usuário logado.
2. `lookups.functions.ts` — espécies, raças, modalidades, serviços/produtos (leituras simples).
3. `tutores.functions.ts` — lista, detalhe, criar, editar, excluir; manter tradução do erro de CPF duplicado (`23505`).
4. `pets.functions.ts` — CRUD + registro de óbito.
5. `servicos-produtos.functions.ts` — CRUD.
6. `ordens-servico.functions.ts` — CRUD, transições de status (histórico), gerar `numero` via RPC `next_sequence`.
7. `contratos.functions.ts` — CRUD com `contrato_pets` e `contrato_servicos`.
8. `pagamentos.functions.ts` — geração de ordens/parcelas, baixa de recebimento.
9. `usuarios.functions.ts` — listar/atualizar via `profiles` + `user_roles` (criar novo usuário fica desabilitado nesta entrega; tratamento abaixo).

As regras de acesso (quem pode fazer o quê) já estão nas policies RLS criadas na Fase 1 — o código apenas propaga o erro do Supabase quando um perfil não autorizado tenta escrever.

### 3. Limpeza (segurança e tamanho do bundle)
- Remover `src/server/entities/`, `src/server/migrations/`, `src/server/data-source.ts`, `numbering.server.ts`, `auth.server.ts`, `session.server.ts`, `scripts/patch-dist.mjs`, `stubs/`.
- Remover `src/start.ts` do meio do caminho de auth Supabase (já está); manter apenas `errorMiddleware`.
- Reverter `vite.config.ts` (tirar alias `typeorm`, alias `tinyglobby`, `nitro.nodeCompat`) — não é mais necessário sem `pg`/`typeorm`.
- `bun remove typeorm pg pg-cloudflare bcryptjs reflect-metadata` (+ tipos).
- Apagar `DATABASE_URL` e `SESSION_SECRET` das secrets após deploy.

### 4. Cadastro de novos usuários — decisão desta entrega
A tela de "Novo usuário" precisa criar conta no Auth (exige service role). Nesta entrega vou **manter a tela desabilitada com aviso** ("cadastro de novo usuário indisponível temporariamente — solicite ao admin"). Se quiser, na entrega seguinte eu implemento via uma server function admin (`.handler` com `supabaseAdmin` importado dinamicamente) que valida `has_role('admin')` antes de chamar `admin.createUser`.

## Comportamento após a entrega

- Login funciona no preview **e** no publicado com as contas atuais (`admin@qamigo.com`, `op@qamigo.com`, `fin@qamigo.com`, `rec@qamigo.com`) usando a senha temporária **`Qamigo@123`**.
- Todos os dados históricos (tutores, pets, OS, histórico, contrato, pagamentos) continuam visíveis com os mesmos IDs.
- Numeração (`OS-2026-NNNNN`, `OP-2026-NNNNN`) continua sequencial a partir do último valor da Railway (as sequências foram importadas).
- Sem mais erros "Connection terminated unexpectedly", React #418 ou "Missing Supabase environment".

## Verificação antes de encerrar

1. Build local sem erros.
2. Login em preview com `admin@qamigo.com` → dashboard carrega, listagens de tutores/pets/OS mostram os dados migrados.
3. Publicar e repetir o teste no `www` (Playwright).
4. Criar 1 tutor de teste e apagar, garantindo escrita/RLS ok.

## Detalhes técnicos

- `requireSupabaseAuth` middleware já existe (`@/integrations/supabase/auth-middleware`) e devolve `context.supabase` já autenticado como o usuário — respeita as RLS criadas na Fase 1.
- `attachSupabaseAuth` precisa voltar em `src/start.ts` porque agora as server fns usam `requireSupabaseAuth`. Não é mais um problema como antes, porque agora o cliente Supabase tem credenciais válidas (não é mais placeholder).
- `next_sequence(tipo, ano)` é chamada via `supabase.rpc('next_sequence', { _tipo, _ano })`.
- Nenhuma migration nova de schema é necessária — a Fase 1 já cobriu tudo.

## Fora de escopo (fica para depois se você quiser)

- Fluxo real de "esqueci a senha" com e-mail SMTP configurado.
- Cadastro de novos usuários pela UI (item 4 acima).
- Ajustar warnings de `search_path` nas funções `SECURITY DEFINER` (são warnings, não bloqueiam).
