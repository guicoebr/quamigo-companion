import { useMemo } from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
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
import { useDataStore } from "@/store/dataStore";
import { findPet, useMockData } from "@/hooks/useMockData";

const schema = z.object({
  tutorId: z.string().min(1, "Tutor obrigatório."),
  nome: z.string().min(1, "Nome obrigatório."),
  especieId: z.string().optional().or(z.literal("")),
  racaId: z.string().optional().or(z.literal("")),
  sexo: z.enum(["macho", "femea"]),
  cor: z.string().optional().or(z.literal("")),
  pesoKg: z.coerce
    .number({ invalid_type_error: "Peso inválido." })
    .positive("Peso deve ser número positivo.")
    .optional(),
  dataNascimento: z.string().optional().or(z.literal("")),
  dataFalecimento: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/pets/$id/editar")({
  head: ({ params }) => ({ meta: [{ title: `Editar pet ${params.id} — +QAmigo` }] }),
  loader: ({ params }) => {
    const pet = findPet(params.id);
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
  const { tutores, especies, racas } = useMockData();
  const updatePet = useDataStore((s) => s.updatePet);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  function onSubmit(values: FormValues) {
    updatePet(pet.id, {
      tutorId: values.tutorId,
      nome: values.nome,
      especieId: values.especieId || pet.especieId,
      racaId: values.racaId || pet.racaId,
      sexo: values.sexo,
      cor: values.cor || "",
      pesoKg: values.pesoKg ?? pet.pesoKg,
      dataNascimento: values.dataNascimento || undefined,
      dataFalecimento: values.dataFalecimento || undefined,
    });
    toast.success("Pet atualizado.");
    navigate({ to: "/pets/$id", params: { id: pet.id } });
    // TODO(api): substituir por createServerFn (updatePet).
  }

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
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tutor*" error={errors.tutorId?.message}>
              <Select
                value={watch("tutorId")}
                onValueChange={(v) => setValue("tutorId", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {tutores.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nome*" error={errors.nome?.message}>
              <Input {...register("nome")} />
            </Field>
            <Field label="Espécie" error={errors.especieId?.message}>
              <Select
                value={watch("especieId") || undefined}
                onValueChange={(v) => { setValue("especieId", v); setValue("racaId", ""); }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {especies.filter((e) => e.ativo).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Raça" error={errors.racaId?.message}>
              <Select
                value={watch("racaId") || undefined}
                onValueChange={(v) => setValue("racaId", v)}
              >
                <SelectTrigger><SelectValue placeholder={especieId ? "Selecione" : "Escolha a espécie primeiro"} /></SelectTrigger>
                <SelectContent>
                  {racasFiltradas.filter((r) => r.ativo).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sexo*" error={errors.sexo?.message}>
              <Select
                value={watch("sexo")}
                onValueChange={(v) => setValue("sexo", v as "macho" | "femea")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="femea">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cor" error={errors.cor?.message}>
              <Input {...register("cor")} />
            </Field>
            <Field label="Peso (kg)" error={errors.pesoKg?.message}>
              <Input type="number" step="0.1" {...register("pesoKg")} />
            </Field>
            <Field label="Data de nascimento" error={errors.dataNascimento?.message}>
              <Input type="date" {...register("dataNascimento")} />
            </Field>
            <Field label="Data de falecimento" error={errors.dataFalecimento?.message}>
              <Input type="date" {...register("dataFalecimento")} />
            </Field>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit"><Save className="mr-2 h-4 w-4" /> Salvar alterações</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}