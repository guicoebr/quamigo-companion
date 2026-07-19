import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Save, Search } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPet } from "@/lib/api/pets.functions";
import { listTutores } from "@/lib/api/tutores.functions";
import { listEspecies, listRacas } from "@/lib/api/lookups.functions";
import { cn } from "@/lib/utils";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";

const schema = z.object({
  tutorId: z.string().min(1, "Selecione o tutor responsável."),
  nome: z.string().min(1, "Informe o nome do pet."),
  especieId: z.string().min(1, "Selecione a espécie."),
  racaId: z.string().min(1, "Selecione a raça."),
  sexo: z.enum(["macho", "femea"], {
    errorMap: () => ({ message: "Selecione o sexo." }),
  }),
  cor: z.string().min(1, "Informe a cor."),
  pesoKg: z.coerce.number().min(0, "Peso inválido."),
  dataNascimento: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

const FIELD_ORDER = [
  "tutorId",
  "nome",
  "sexo",
  "especieId",
  "racaId",
  "cor",
  "pesoKg",
  "dataNascimento",
] as const;
type FieldName = (typeof FIELD_ORDER)[number];

const LABELS: Record<FieldName, string> = {
  tutorId: "Tutor responsável",
  nome: "Nome do pet",
  sexo: "Sexo",
  especieId: "Espécie",
  racaId: "Raça",
  cor: "Cor",
  pesoKg: "Peso",
  dataNascimento: "Data de nascimento",
};

type PetsNovoSearch = { tutorId?: string };

export const Route = createFileRoute("/_app/pets/novo")({
  head: () => ({ meta: [{ title: "Novo pet — +QAmigo" }] }),
  validateSearch: (search: Record<string, unknown>): PetsNovoSearch => {
    const raw = search.tutorId;
    const tutorId = typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
    return tutorId ? { tutorId } : {};
  },
  component: NovoPetPage,
});

function NovoPetPage() {
  const navigate = useNavigate();
  const { tutorId: preselectTutorId } = Route.useSearch();
  const tutoresQuery = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const tutores = tutoresQuery.data ?? [];
  const { data: especies = [] } = useQuery({ queryKey: ["especies"], queryFn: () => listEspecies() });
  const { data: racas = [] } = useQuery({ queryKey: ["racas"], queryFn: () => listRacas() });
  const [buscaTutor, setBuscaTutor] = useState("");
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const [preselectFailed, setPreselectFailed] = useState(false);
  const appliedPreselectRef = useRef(false);

  const tutorSearchInputRef = useRef<HTMLInputElement | null>(null);
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
    defaultValues: { sexo: "macho", pesoKg: 0 },
  });

  const tutorId = watch("tutorId");
  const especieId = watch("especieId");
  const racasFiltradas = useMemo(
    () => racas.filter((r) => !especieId || r.especieId === especieId),
    [racas, especieId],
  );
  const tutoresFiltrados = useMemo(() => {
    const t = buscaTutor.trim().toLowerCase();
    const base = !t
      ? tutores.slice(0, 6)
      : tutores.filter(
          (x) => x.nome.toLowerCase().includes(t) || x.email.toLowerCase().includes(t),
        );
    // Garante que o tutor selecionado (inclusive vindo da URL) permaneça visível.
    if (tutorId && !base.some((x) => x.id === tutorId)) {
      const sel = tutores.find((x) => x.id === tutorId);
      if (sel) return [sel, ...base];
    }
    return base;
  }, [tutores, buscaTutor, tutorId]);

  useEffect(() => {
    if (!preselectTutorId) return;
    if (appliedPreselectRef.current) return;
    if (!tutoresQuery.isSuccess) return;
    const found = (tutoresQuery.data ?? []).some((t) => t.id === preselectTutorId);
    if (found) {
      setValue("tutorId", preselectTutorId, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
      setPreselectFailed(false);
    } else {
      setPreselectFailed(true);
    }
    appliedPreselectRef.current = true;
  }, [preselectTutorId, tutoresQuery.isSuccess, tutoresQuery.data, setValue]);


  const errorLabels = FIELD_ORDER
    .filter((field) => Boolean(errors[field]))
    .map((field) => LABELS[field])
    .filter((label): label is string => Boolean(label));

  async function onValid(values: FormValues) {
    try {
      const novo = await createPet({
        data: {
          tutorId: values.tutorId,
          nome: values.nome,
          especieId: values.especieId,
          racaId: values.racaId,
          sexo: values.sexo,
          cor: values.cor,
          pesoKg: Number(values.pesoKg),
          dataNascimento: values.dataNascimento || undefined,
          observacoes: values.observacoes || undefined,
        },
      });
      toast.success("Pet cadastrado.");
      setHasSubmitAttempted(false);
      navigate({ to: "/pets/$id", params: { id: novo.id } });
    } catch {
      toast.error("Não foi possível cadastrar o pet.");
    }
  }

  function onInvalid() {
    setHasSubmitAttempted(true);
    const first = FIELD_ORDER.find((f) => Boolean(errors[f])) as FieldName | undefined;
    if (!first) return;
    requestAnimationFrame(() => {
      if (first === "tutorId") {
        const el = tutorSearchInputRef.current;
        el?.focus();
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      if (first === "sexo" || first === "especieId" || first === "racaId") {
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
        title="Novo pet"
        description="Vincule o pet a um tutor existente."
        actions={
          <Button asChild variant="outline">
            <Link to="/pets">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card className="rounded-[12px]">
        <CardContent className="p-6 space-y-6">
          {hasSubmitAttempted && <FormErrorSummary labels={errorLabels} />}

          <div className="space-y-2">
            <Label htmlFor="tutorId" className="text-xs font-medium text-muted-foreground">
              Tutor*
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tutorId"
                ref={tutorSearchInputRef}
                value={buscaTutor}
                onChange={(e) => setBuscaTutor(e.target.value)}
                placeholder="Buscar tutor por nome ou e-mail"
                className={cn("pl-9", invalidClass)}
                aria-invalid={Boolean(errors.tutorId) || undefined}
                aria-describedby={errors.tutorId ? "tutorId-error" : undefined}
              />
            </div>
            {preselectFailed && (
              <p className="text-xs text-muted-foreground">
                Não foi possível pré-selecionar o tutor informado.
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {tutoresFiltrados.map((t) => {
                const sel = tutorId === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setValue("tutorId", t.id, { shouldValidate: true });
                      setPreselectFailed(false);
                    }}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors",
                      sel ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                    )}
                  >
                    <p className="text-sm font-medium">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </button>
                );
              })}
            </div>
            {errors.tutorId && (
              <p id="tutorId-error" role="alert" className="text-xs text-destructive">
                {errors.tutorId.message}
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit(onValid, onInvalid)}
            noValidate
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Field id="nome" label="Nome*" error={errors.nome?.message}>
              <Input
                id="nome"
                {...register("nome")}
                className={invalidClass}
                aria-invalid={Boolean(errors.nome) || undefined}
                aria-describedby={errors.nome ? "nome-error" : undefined}
              />
            </Field>
            <Field id="sexo" label="Sexo*" error={errors.sexo?.message}>
              <Select
                defaultValue="macho"
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
            <Field id="especieId" label="Espécie*" error={errors.especieId?.message}>
              <Select
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
                  {especies.filter((e) => e.ativo).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="racaId" label="Raça*" error={errors.racaId?.message}>
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
                  <SelectValue placeholder={especieId ? "Selecione" : "Escolha a espécie primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {racasFiltradas.filter((r) => r.ativo).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="cor" label="Cor*" error={errors.cor?.message}>
              <Input
                id="cor"
                {...register("cor")}
                className={invalidClass}
                aria-invalid={Boolean(errors.cor) || undefined}
                aria-describedby={errors.cor ? "cor-error" : undefined}
              />
            </Field>
            <Field id="pesoKg" label="Peso (kg)*" error={errors.pesoKg?.message}>
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
            <div className="md:col-span-2">
              <Field id="observacoes" label="Observações" error={errors.observacoes?.message}>
                <Textarea id="observacoes" rows={3} {...register("observacoes")} />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" /> Salvar
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
