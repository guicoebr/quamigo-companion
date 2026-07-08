import { useMemo, useState } from "react";
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

const schema = z.object({
  tutorId: z.string().min(1, "Selecione o tutor."),
  nome: z.string().min(1, "Nome obrigatório."),
  especieId: z.string().min(1, "Espécie obrigatória."),
  racaId: z.string().min(1, "Raça obrigatória."),
  sexo: z.enum(["macho", "femea"]),
  cor: z.string().min(1, "Cor obrigatória."),
  pesoKg: z.coerce.number().min(0, "Peso inválido."),
  dataNascimento: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/pets/novo")({
  head: () => ({ meta: [{ title: "Novo pet — +QAmigo" }] }),
  component: NovoPetPage,
});

function NovoPetPage() {
  const navigate = useNavigate();
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: especies = [] } = useQuery({ queryKey: ["especies"], queryFn: () => listEspecies() });
  const { data: racas = [] } = useQuery({ queryKey: ["racas"], queryFn: () => listRacas() });
  const [buscaTutor, setBuscaTutor] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
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
    if (!t) return tutores.slice(0, 6);
    return tutores.filter(
      (x) => x.nome.toLowerCase().includes(t) || x.email.toLowerCase().includes(t),
    );
  }, [tutores, buscaTutor]);

  async function onSubmit(values: FormValues) {
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
      navigate({ to: "/pets/$id", params: { id: novo.id } });
    } catch {
      toast.error("Não foi possível cadastrar o pet.");
    }
  }

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
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Tutor*</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={buscaTutor}
                onChange={(e) => setBuscaTutor(e.target.value)}
                placeholder="Buscar tutor por nome ou e-mail"
                className="pl-9"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {tutoresFiltrados.map((t) => {
                const sel = tutorId === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setValue("tutorId", t.id, { shouldValidate: true })}
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
            {errors.tutorId && <p className="text-xs text-destructive">{errors.tutorId.message}</p>}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nome*" error={errors.nome?.message}>
              <Input {...register("nome")} />
            </Field>
            <Field label="Sexo*" error={errors.sexo?.message}>
              <Select defaultValue="macho" onValueChange={(v) => setValue("sexo", v as "macho" | "femea")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="femea">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Espécie*" error={errors.especieId?.message}>
              <Select onValueChange={(v) => { setValue("especieId", v, { shouldValidate: true }); setValue("racaId", ""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {especies.filter((e) => e.ativo).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Raça*" error={errors.racaId?.message}>
              <Select value={watch("racaId") || undefined} onValueChange={(v) => setValue("racaId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder={especieId ? "Selecione" : "Escolha a espécie primeiro"} /></SelectTrigger>
                <SelectContent>
                  {racasFiltradas.filter((r) => r.ativo).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cor*" error={errors.cor?.message}>
              <Input {...register("cor")} />
            </Field>
            <Field label="Peso (kg)*" error={errors.pesoKg?.message}>
              <Input type="number" step="0.1" {...register("pesoKg")} />
            </Field>
            <Field label="Data de nascimento" error={errors.dataNascimento?.message}>
              <Input type="date" {...register("dataNascimento")} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Observações" error={errors.observacoes?.message}>
                <Textarea rows={3} {...register("observacoes")} />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit"><Save className="mr-2 h-4 w-4" /> Salvar</Button>
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