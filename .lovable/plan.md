## Diagnóstico confirmado

No site publicado, o botão de login não envia nenhuma requisição de autenticação. O navegador registra que `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` estão ausentes no bundle do cliente. No preview, a mesma autenticação retorna sucesso. Portanto, e-mail e senha estão corretos; o problema é a configuração do build publicado.

## Implementação

1. Ajustar a configuração do Vite/TanStack para garantir que a URL e a chave **publicável** do Lovable Cloud sejam injetadas no bundle do navegador durante o build de produção, mantendo chaves privadas exclusivamente no servidor.
2. Preservar o cliente de autenticação gerenciado e o middleware `attachSupabaseAuth`; não alterar usuários, senha, papéis, políticas ou dados.
3. Melhorar a falha de inicialização do login para apresentar uma mensagem clara caso a configuração pública do backend volte a faltar, em vez de deixar a tela aparentemente imóvel.
4. Validar localmente que o bundle de produção recebe as configurações e que o fluxo continua funcionando no preview.
5. Publicar a correção e testar diretamente no endereço publicado: confirmar requisição de autenticação `200`, criação da sessão e navegação para o dashboard.