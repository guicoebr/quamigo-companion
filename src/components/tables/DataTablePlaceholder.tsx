import { Table2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type DataTablePlaceholderProps = {
  title?: string;
  description?: string;
};

/**
 * Placeholder visual para listagens ainda não implementadas.
 * Substituído pelos componentes de TanStack Table reais nos próximos blocos.
 */
export function DataTablePlaceholder({
  title = "Listagem em construção",
  description = "Esta tabela será implementada em um próximo bloco com dados mock.",
}: DataTablePlaceholderProps) {
  return (
    <Card className="rounded-[12px] border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Table2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}