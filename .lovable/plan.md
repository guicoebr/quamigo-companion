## Diagnóstico confirmado

O erro atual **não é causado pelo PostgreSQL**. Os logs da publicação mostram:

```text
POST /_serverFn/login → 500
Server function info not found for login
```

Isso acontece antes de `getDataSource()` e antes de qualquer consulta ao usuário. Não há erro de conexão com o banco nos logs recentes. A tela agora exibe a mensagem genérica porque o tratamento visual foi corrigido, mas a função de login ainda não chega ao backend.

O código atual também ainda registra `attachSupabaseAuth` globalmente, apesar de este projeto autenticar com PostgreSQL/TypeORM e cookie próprio. Essa composição interfere no fluxo das funções de servidor e precisa ser removida de fato.

## Plano de correção

1. **Corrigir o registro das funções de servidor**
   - Remover do bootstrap a importação e o registro global de `attachSupabaseAuth`.
   - Manter apenas o middleware global de tratamento de erros.
   - Confirmar no bundle de produção que `login` e `me` constam no manifesto das funções.

2. **Validar o endpoint antes do banco**
   - Testar a publicação e confirmar que o `POST` deixa de retornar `Server function info not found`.
   - Garantir que qualquer falha continue liberando o botão e exibindo mensagem ao usuário.

3. **Testar PostgreSQL separadamente**
   - Depois que o handler for alcançado, verificar nos logs se `DATABASE_URL` está disponível e se a conexão Railway aceita a consulta.
   - Confirmar que o usuário `admin@qamigo.com` existe, está ativo e que a senha é validada, sem expor credenciais ou hashes.
   - Se houver falha nessa etapa, corrigir somente a conexão/configuração correspondente, sem migrar nem alterar dados.

4. **Validar o fluxo completo publicado**
   - Entrar pela URL publicada, confirmar criação/persistência do cookie e chegada ao Dashboard.
   - Recarregar o Dashboard para comprovar que a sessão permanece válida.

<presentation-actions>
  <presentation-open-history>Ver histórico</presentation-open-history>
  <presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Documentação de solução de problemas</presentation-link>
</presentation-actions>