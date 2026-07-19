import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  title?: string;
  labels: string[];
};

export function FormErrorSummary({
  title = "Não foi possível salvar o pet. Revise os campos destacados abaixo.",
  labels,
}: Props) {
  const unique = Array.from(new Set(labels.filter((l): l is string => Boolean(l))));
  if (unique.length === 0) return null;
  return (
    <Alert variant="destructive" aria-live="assertive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p className="mt-1 text-sm">Campos que precisam de atenção:</p>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {unique.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
