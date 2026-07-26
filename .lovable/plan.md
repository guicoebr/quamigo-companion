Adicionar botão "olhinho" (mostrar/ocultar senha) ao campo de senha da tela de login.

## Mudança

**src/routes/login.tsx**
- Adicionar estado `showPassword` (boolean, inicial `false`).
- Envolver o `Input` da senha em um wrapper `relative`, alterando `type` para `showPassword ? "text" : "password"`, com `pr-10` para dar espaço ao botão.
- Adicionar `<button type="button">` posicionado à direita (absolute), alternando `showPassword` no clique. Ícone `Eye` / `EyeOff` do `lucide-react`, `aria-label` dinâmico ("Mostrar senha" / "Ocultar senha"), `tabIndex={-1}` opcional para não interferir no tab.

Nenhuma outra tela usa campo de senha no momento, então o escopo fica restrito ao login.