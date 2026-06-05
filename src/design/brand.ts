/**
 * +QAmigo — Brand tokens
 *
 * Fonte única de verdade para a identidade visual.
 * Todos os componentes devem consumir essas constantes em vez de cores
 * hardcoded. Os mesmos valores são espelhados em src/styles.css via
 * `@theme inline`, expondo utilitários Tailwind (bg-primary, text-sidebar, ...).
 *
 * TODO(api): caso a marca passe a ser configurável por tenant, carregar
 * estes valores de uma API e injetar dinamicamente as CSS variables.
 */

export const brandColors = {
  primary: "#1B4F72",
  secondary: "#2E86C1",
  success: "#1E8449",
  warning: "#B7950B",
  error: "#922B21",
  background: "#F4F6F7",
  surface: "#FFFFFF",
  sidebar: "#1B2631",
  sidebarForeground: "#ECF0F1",
  textPrimary: "#1B2631",
  textMuted: "#566573",
  border: "#D5D8DC",
} as const;

export const brandTypography = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const brandRadius = {
  default: "8px",
  card: "12px",
  pill: "9999px",
} as const;

export const brandSpacing = {
  sidebarWidth: "16rem",
  sidebarWidthIcon: "3rem",
  topbarHeight: "3.5rem",
} as const;

export const brand = {
  name: "+QAmigo",
  tagline: "Gestão funerária pet",
  colors: brandColors,
  typography: brandTypography,
  radius: brandRadius,
  spacing: brandSpacing,
} as const;

export type BrandColor = keyof typeof brandColors;
export default brand;