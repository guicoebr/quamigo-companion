import { cn } from "@/lib/utils";

/**
 * Badge de status genérica do design system.
 * As cores específicas dos status de OS serão centralizadas em
 * `src/mocks/status_os.ts` no Bloco 3 e consumidas aqui via prop `color`.
 */
export type StatusTone = "neutral" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/15 text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-destructive/10 text-destructive",
  info: "bg-accent text-accent-foreground",
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  /** Cor explícita (hex) — sobrepõe `tone`. Útil para os status de OS. */
  color?: string;
  className?: string;
};

export function StatusBadge({ label, tone = "neutral", color, className }: StatusBadgeProps) {
  const style = color
    ? { backgroundColor: `${color}1A`, color }
    : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        !color && toneClasses[tone],
        className,
      )}
      style={style}
    >
      <span
        className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
        style={color ? { backgroundColor: color } : undefined}
      />
      {label}
    </span>
  );
}