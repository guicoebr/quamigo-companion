Migração completa do backend: Postgres da Railway + TypeORM + auth próprio → Lovable Cloud (Supabase) + Supabase Auth. Entrega única.

## Resumo do que muda

- Banco: Railway → Supabase (mesma modelagem, mesmos UUIDs, políticas RLS por role).
- Auth: `usuarios` + bcrypt + cookie selado → Supabase Auth (email/senha) + tabelas `profiles` e `user_roles`.
- Server functions: TypeORM `Repository` → Supabase client (`requireSupabaseAuth`).
- Runtime: some do `pg`, `pg-cloudflare`, `typeorm`, `bcryptjs`, stubs `patch-dist`, alias custom em `vite.config.ts`, `SESSION_SECRET`, `DATABASE_URL`.

## Fase 1 — Schema no Supabase (uma migration)

Criar no `public`:

- Enum `app_role` = `admin | operacional | financeiro | recepcao`.
- `profiles` (id = `auth.users.id`, nome, ativo, criado_em). Trigger `handle_new_user()` em `auth.users` cria a profile automaticamente.
- `user_roles` (user_id → auth.users, role app_role, unique(user_id, role)).
- Função `has_role(_user_id uuid, _role app_role)` `security definer`.
- Domínio: `especies`, `racas`, `modalidades_servico`, `servicos_produtos`, `tutores`, `pets`, `ordens_servico`, `os_itens`, `historico_status_os`, `contratos`, `contrato_pets`, `contrato_servicos`, `ordens_pagamento`, `parcelas`, `sequencias` — colunas/tipos/FKs idênticos à migration TypeORM atual (`1783015793967-InitialSchema.ts`).
- Referências a "usuário responsável" (ex.: `historico_status_os.usuario_id`) apontam para `auth.users(id)`.
- GRANTs em todas as tabelas para `authenticated` e `service_role` (sem `anon`).
- RLS habilitado em todas. Políticas iniciais:
  - Leitura: qualquer usuário autenticado (as 4 roles precisam ver dados).
  - Escrita: `has_role(auth.uid(), 'admin')` OR a role específica do módulo (ex.: `operacional` para OS, `financeiro` para pagamento, `recepcao` para tutores/pets), refletindo a matriz de `src/lib/permissions.ts`.
- Trigger `updated_at` onde já existia.

## Fase 2 — Exportar Railway e importar Supabase

Feito no sandbox (a Railway ainda responde de fora do Worker):

1. `pg_dump`-livre: script `psql` na Railway usando `\copy ... to csv` para cada tabela na ordem topológica.
2. Para cada linha de `usuarios` (Railway): criar usuário correspondente no Supabase Auth via `supabaseAdmin.auth.admin.createUser({ id: <mesmo uuid>, email, password: <random>, email_confirm: true })`. Trigger cria a profile; inserir a role em `user_roles`.
3. Inserir demais tabelas via `supabase--insert` preservando UUIDs e ordem de FK.
4. Enviar e-mail de "definir senha" (`supabase.auth.admin.generateLink({ type: 'recovery' })`) para cada usuário migrado — ou instruir que usem "Esqueci a senha" na primeira entrada. Confirmar com você qual dos dois.

## Fase 3 — Reescrita das server functions

Substituir todo `getDataSource().getRepository(X)` por chamadas Supabase:

- `src/lib/api/auth.functions.ts` → deletar; login/logout passam a usar `supabase.auth.signInWithPassword` / `signOut` direto no client. `me()` vira `supabase.auth.getUser()` + join com `profiles` e `user_roles`.
- Cada `*.functions.ts` (tutores, pets, ordens-servico, pagamentos, contratos, servicos-produtos, lookups, usuarios) reescrito para usar `requireSupabaseAuth` e `context.supabase.from(...)`. Filtros/paginação/ordenação convertidos para o builder do Supabase.
- Numeração (`numbering.server.ts`) vira função Postgres `next_sequence(tipo text) returns int` chamada via `rpc`.
- Regras de permissão continuam sendo validadas no server (`context.supabase.rpc('has_role', ...)`), além do RLS.

## Fase 4 — Client / store / rotas

- `src/store/authStore.ts` reescrito em cima de `supabase.auth` + `onAuthStateChange` (listener registrado no `__root.tsx`, filtrado como recomendado).
- `src/routes/login.tsx` chama `supabase.auth.signInWithPassword`. Mantém olhinho de senha e mensagens de erro.
- Rotas protegidas migradas para o layout `_authenticated/` gerenciado (com `ssr: false`), removendo o gate atual em `_app.tsx`.
- `Topbar` e `useRoleGuard` leem role via `user_roles`/profile hidratados no login.

## Fase 5 — Limpeza (mesma entrega)

- Remover: `src/server/entities/`, `src/server/data-source.ts`, `src/server/scripts/`, `src/server/seeds/`, `src/server/migrations/`, `src/server/stubs/`, `src/server/session.server.ts`, `src/server/auth.server.ts`, `src/server/numbering.server.ts` (vira RPC), `patch-dist.mjs`, `Dockerfile`, `docker-compose.yml`, `docker/`.
- `package.json`: remover `typeorm`, `pg`, `pg-cloudflare`, `bcryptjs`, `reflect-metadata`, `typeorm-naming-strategies`, `@types/bcryptjs`, `@types/pg`.
- `vite.config.ts`: remover aliases `typeorm`/`tinyglobby`/`pg-cloudflare`, remover `nitro.nodeCompat` extra se não for mais necessário.
- Secrets: `DATABASE_URL` e `SESSION_SECRET` deixam de ser usados (posso removê-los ao final ou você remove pela UI).
- `.env.example` reduzido.

## Riscos e mitigação

- **Perda de dados**: faço dump CSV completo da Railway antes de qualquer INSERT e guardo em `/mnt/documents/` para você baixar.
- **Roles/permissões**: matriz atual (`src/lib/permissions.ts`) vira políticas RLS + `has_role`. Se alguma tela quebrar por RLS restritiva demais, ajusto política em migration.
- **Numeração de OS/pagamento**: `sequencias` migrada, `next_sequence()` implementa o mesmo lock por nome.
- **Sessão em iframe do preview**: o cookie custom com `SameSite=None; Partitioned` sai; a sessão passa a ser do Supabase (localStorage), padrão do template.
- **Publicado**: fim da dependência de TCP para Railway → o erro `Connection terminated unexpectedly` desaparece por construção.

## Ordem real de execução

1. Migration Fase 1 (você aprova).
2. Dump CSV da Railway + criação dos auth users + inserts (relato o resultado).
3. Reescrita de código (Fases 3 e 4) num único conjunto de edits.
4. Limpeza (Fase 5).
5. Typecheck + login de teste no preview.
6. Publicar.

Confirma que posso avançar assim? A migration da Fase 1 vai aparecer para você aprovar antes de rodar.