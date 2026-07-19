## Diagnóstico confirmado

- A tela apareceu quando a aba enviou o identificador antigo da função `me` após o servidor reiniciar: `Invalid server function ID`.
- A função atual de sessão já responde normalmente (`200`) e o dashboard está operacional; portanto, não é falha do banco nem perda de autenticação.
- O botão atual de recuperação repete a navegação, mas pode reutilizar o JavaScript antigo da aba e manter o usuário preso.

## Implementação

1. Ajustar somente a ação **“Try again”** da tela global de erro para fazer uma recarga completa do documento (`window.location.reload()`), garantindo que o navegador baixe os identificadores atuais das funções.
2. Manter **“Go home”** como alternativa de saída e preservar o restante do tratamento de erros.
3. Não alterar banco, sessão, login, infraestrutura, rotas ou contratos de API.
4. Validar no preview que o dashboard continua acessível e que a tela de erro permite uma recuperação efetiva após uma falha transitória.