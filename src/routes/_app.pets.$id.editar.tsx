import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPet, updatePet } from "@/lib/api/pets.functions";
import { listTutores } from "@/lib/api/tutores.functions";
import { listEspecies, listRacas } from "@/lib/api/lookups.functions";
import { cn } from "@/lib/utils";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";

const schema = z.object({
  tutorId: z.string().min(1, "Selecione o tutor responsável."),
  nome: z.string().min(1, "Informe o nome do pet."),
  especieId: z.string().optional().or(z.literal("")),
  racaId: z.string().optional().or(z.literal("")),
  sexo: z.enum(["macho", "femea"], {
    errorMap: () => ({ message: "Selecione o sexo." }),
  }),
  cor: z.string().optional().or(z.literal("")),
  pesoKg: z.coerce
    .number({ invalid_type_error: "Peso inválido." })
    .positive("Peso deve ser número positivo.")
    .optional(),
  dataNascimento: z.string().optional().or(z.literal("")),
  dataFalecimento: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

const FIELD_ORDER = [
  "tutorId",
  "nome",
  "especieId",
  "racaId",
  "sexo",
  "cor",
  "pesoKg",
  "dataNascimento",
  "dataFalecimento",
] as const;
type FieldName = (typeof FIELD_ORDER)[number];

const LABELS: Record<FieldName, string> = {
  tutorId: "Tutor responsável",
  nome: "Nome do pet",
  especieId: "Espécie",
  racaId: "Raça",
  sexo: "Sexo",
  cor: "Cor",
  pesoKg: "Peso",
  dataNascimento: "Data de nascimento",
  dataFalecimento: "Data de falecimento",
};

export const Route = createFileRoute("/_app/pets/$id/editar")({
  head: ({ params }) => ({ meta: [{ title: `Editar pet ${params.id} — +QAmigo` }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const pet = await getPet({ data: { id: params.id } });
    if (!pet) throw notFound();
    return { pet };
  },
  notFoundComponent: () => (
    <>
      <PageHeader title="Pet não encontrado" />
      <Button asChild variant="outline">
        <Link to="/pets">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>
    </>
  ),
  component: EditarPetPage,
});

function EditarPetPage() {
  const { pet } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: especies = [] } = useQuery({
    queryKey: ["especies"],
    queryFn: () => listEspecies(),
  });
  const { data: racas = [] } = useQuery({ queryKey: ["racas"], queryFn: () => listRacas() });
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const triggerRefs = useRef<Partial<Record<FieldName, HTMLButtonElement | null>>>({});

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: {
      tutorId: pet.tutorId,
      nome: pet.nome,
      especieId: pet.especieId ?? "",
      racaId: pet.racaId ?? "",
      sexo: pet.sexo,
      cor: pet.cor ?? "",
      pesoKg: pet.pesoKg ?? undefined,
      dataNascimento: pet.dataNascimento ?? "",
      dataFalecimento: pet.dataFalecimento ?? "",
    },
  });

  const especieId = watch("especieId");
  const racasFiltradas = useMemo(
    () => racas.filter((r) => !especieId || r.especieId === especieId),
    [racas, especieId],
  );

  const errorLabels = FIELD_ORDER
    .filter((field) => Boolean(errors[field]))
    .map((field) => LABELS[field])
    .filter((label): label is string => Boolean(label));

  async function onValid(values: FormValues) {
    try {
      await updatePet({
        data: {
          id: pet.id,
          patch: {
            tutorId: values.tutorId,
            nome: values.nome,
            especieId: values.especieId || pet.especieId,
            racaId: values.racaId || pet.racaId,
            sexo: values.sexo,
            cor: values.cor || "",
            pesoKg: values.pesoKg ?? pet.pesoKg,
            dataNascimento: values.dataNascimento || undefined,
            dataFalecimento: values.dataFalecimento || undefined,
          },
        },
      });
      toast.success("Pet atualizado.");
      setHasSubmitAttempted(false);
      navigate({ to: "/pets/$id", params: { id: pet.id } });
    } catch {
      toast.error("Não foi possível atualizar o pet.");
    }
  }

  function onInvalid() {
    setHasSubmitAttempted(true);
    const first = FIELD_ORDER.find((f) => Boolean(errors[f])) as FieldName | undefined;
    if (!first) return;
    requestAnimationFrame(() => {
      if (first === "tutorId" || first === "especieId" || first === "racaId" || first === "sexo") {
        const trigger = triggerRefs.current[first];
        trigger?.focus();
        trigger?.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      setFocus(first);
      const el = document.getElementById(first);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  const invalidClass =
    "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

  return (
    <>
      <PageHeader
        title={`Editar ${pet.nome}`}
        description="Atualize os dados do pet."
        actions={
          <Button asChild variant="outline">
            <Link to="/pets/$id" params={{ id: pet.id }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card className="rounded-[12px]">
        <CardContent className="p-6">
          {hasSubmitAttempted && <FormErrorSummary labels={errorLabels} />}
          <form
            onSubmit={handleSubmit(onValid, onInvalid)}
            noValidate
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Field id="tutorId" label="Tutor*" error={errors.tutorId?.message}>
              <Select
                value={watch("tutorId")}
                onValueChange={(v) => setValue("tutorId", v, { shouldValidate: true })}
              >
                <SelectTrigger
                  id="tutorId"
                  ref={(el) => {
                    triggerRefs.current.tutorId = el;
                  }}
                  className={invalidClass}
                  aria-invalid={Boolean(errors.tutorId) || undefined}
                  aria-describedby={errors.tutorId ? "tutorId-error" : undefined}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tutores.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="nome" label="Nome*" error={errors.nome?.message}>
              <Input
                id="nome"
                {...register("nome")}
                className={invalidClass}
                aria-invalid={Boolean(errors.nome) || undefined}
                aria-describedby={errors.nome ? "nome-error" : undefined}
              />
            </Field>
            <Field id="especieId" label="Espécie" error={errors.especieId?.message}>
              <Select
                value={watch("especieId") || undefined}
                onValueChange={(v) => {
                  setValue("especieId", v, { shouldValidate: true });
                  setValue("racaId", "", { shouldValidate: true });
                }}
              >
                <SelectTrigger
                  id="especieId"
                  ref={(el) => {
                    triggerRefs.current.especieId = el;
                  }}
                  className={invalidClass}
                  aria-invalid={Boolean(errors.especieId) || undefined}
                  aria-describedby={errors.especieId ? "especieId-error" : undefined}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {especies
                    .filter((e) => e.ativo)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="racaId" label="Raça" error={errors.racaId?.message}>
              <Select
                value={watch("racaId") || undefined}
                onValueChange={(v) => setValue("racaId", v, { shouldValidate: true })}
              >
                <SelectTrigger
                  id="racaId"
                  ref={(el) => {
                    triggerRefs.current.racaId = el;
                  }}
                  className={invalidClass}
                  aria-invalid={Boolean(errors.racaId) || undefined}
                  aria-describedby={errors.racaId ? "racaId-error" : undefined}
                >
                  <SelectValue
                    placeholder={especieId ? "Selecione" : "Escolha a espécie primeiro"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {racasFiltradas
                    .filter((r) => r.ativo)
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="sexo" label="Sexo*" error={errors.sexo?.message}>
              <Select
                value={watch("sexo")}
                onValueChange={(v) => setValue("sexo", v as "macho" | "femea", { shouldValidate: true })}
              >
                <SelectTrigger
                  id="sexo"
                  ref={(el) => {
                    triggerRefs.current.sexo = el;
                  }}
                  className={invalidClass}
                  aria-invalid={Boolean(errors.sexo) || undefined}
                  aria-describedby={errors.sexo ? "sexo-error" : undefined}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="femea">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="cor" label="Cor" error={errors.cor?.message}>
              <Input
                id="cor"
                {...register("cor")}
                className={invalidClass}
                aria-invalid={Boolean(errors.cor) || undefined}
                aria-describedby={errors.cor ? "cor-error" : undefined}
              />
            </Field>
            <Field id="pesoKg" label="Peso (kg)" error={errors.pesoKg?.message}>
              <Input
                id="pesoKg"
                type="number"
                step="0.1"
                {...register("pesoKg")}
                className={invalidClass}
                aria-invalid={Boolean(errors.pesoKg) || undefined}
                aria-describedby={errors.pesoKg ? "pesoKg-error" : undefined}
              />
            </Field>
            <Field id="dataNascimento" label="Data de nascimento" error={errors.dataNascimento?.message}>
              <Input
                id="dataNascimento"
                type="date"
                {...register("dataNascimento")}
                className={invalidClass}
                aria-invalid={Boolean(errors.dataNascimento) || undefined}
                aria-describedby={errors.dataNascimento ? "dataNascimento-error" : undefined}
              />
            </Field>
            <Field id="dataFalecimento" label="Data de falecimento" error={errors.dataFalecimento?.message}>
              <Input
                id="dataFalecimento"
                type="date"
                {...register("dataFalecimento")}
                className={invalidClass}
                aria-invalid={Boolean(errors.dataFalecimento) || undefined}
                aria-describedby={errors.dataFalecimento ? "dataFalecimento-error" : undefined}
              />
            </Field>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" /> Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Silence unused import warning for `cn` when not needed.
void cn;
