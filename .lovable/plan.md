## Diagnóstico

**1. Por que cai em `/brand-book` após login**

O `login.tsx` faz:
```ts
navigate({ to: search.redirect ?? defaultRouteForRole(result.user.role) });
```

Quando você acessou `/brand-book` sem sessão, o guard do `_app` te mandou para `/login?redirect=/brand-book`. Depois do login, o formulário respeita esse `search.redirect` e te devolve para `/brand-book` — mesmo que o destino padrão da role seja `/dashboard`. Enquanto o parâmetro `redirect=/brand-book` estiver na URL do login, todo login continua caindo lá.

**2. Por que "não vejo o menu"**

Seu viewport atual é 549px (mobile). O `Sidebar` do shadcn nessa largura opera em modo **offcanvas** — fica escondido até você clicar no botão de toggle (ícone de menu) que já existe na `Topbar` (`SidebarTrigger`). Ou seja, o menu está lá, só não abre sozinho no mobile.

## Mudanças propostas

### A. Ignorar `redirect` para `/brand-book` no pós-login
Em `src/routes/login.tsx`, tratar `/brand-book` como não-destino (é uma página informativa, não a home de ninguém). Aplicar em dois pontos:

- `beforeLoad` (quando já está logado e visita `/login`)
- `onSubmit` (após autenticar)

Regra: se `search.redirect` for ausente, `/login`, `/` ou `/brand-book`, usar `defaultRouteForRole(user.role)` (= `/dashboard`).

### B. (opcional) Deixar o botão de menu mais óbvio no mobile
Nada de lógica nova — apenas garantir que o `SidebarTrigger` na `Topbar` tenha rótulo/aria visível em telas pequenas para você localizar o toggle. Sem alterar comportamento.

## Detalhes técnicos

Arquivos afetados:
- `src/routes/login.tsx` — adicionar helper `resolvePostLoginTarget(search.redirect, user.role)` e usar nos dois pontos.
- (opcional) `src/components/layout/Topbar.tsx` — nenhuma mudança de estrutura, só um `aria-label="Abrir menu"` no trigger se ainda não existir.

Sem mudanças de backend, permissões ou rotas.