import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createFileRoute, Link, useNavigate, useParams, notFound } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/store/dataStore";
import { findTutor } from "@/hooks/useMockData";
import type { Tutor } from "@/types/tutor";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório."),
  cpf: z.string().optional().or(z.literal("")),
  rne: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /\S+@\S+\.\S+/.test(v), { message: "E-mail inválido." }),
  contato1: z.string().min(1, "Informe ao menos um contato."),
  contato2: z.string().optional().or(z.literal("")),
  contato3: z.string().optional().or(z.literal("")),
  cep: z.string().optional().or(z.literal("")),
  logradouro: z.string().optional().or(z.literal("")),
  numero: z.string().optional().or(z.literal("")),
  bairro: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  uf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || v.length === 2, { message: "UF com 2 letras." }),
  observacoes: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function TutorFormPage({ mode }: { mode: "novo" | "editar" }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const existing = mode === "editar" && params.id ? findTutor(params.id) : undefined;
  if (mode === "editar" && !existing) throw notFound();

  const addTutor = useDataStore((s) => s.addTutor);
  const updateTutor = useDataStore((s) => s.updateTutor);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          nome: existing.nome,
          cpf: existing.cpf,
          rne: "",
          email: existing.email,
          contato1: existing.telefone,
          contato2: "",
          contato3: "",
          cep: existing.endereco.cep,
          logradouro: existing.endereco.logradouro,
          numero: existing.endereco.numero,
          bairro: existing.endereco.bairro,
          cidade: existing.endereco.cidade,
          uf: existing.endereco.uf,
          observacoes: existing.observacoes ?? "",
        }
      : { contato1: "", nome: "" },
  });

  function onSubmit(values: FormValues) {
    const endereco = {
      cep: (values.cep ?? "").replace(/\D/g, ""),
      logradouro: values.logradouro ?? "",
      numero: values.numero ?? "",
      bairro: values.bairro ?? "",
      cidade: values.cidade ?? "",
      uf: (values.uf ?? "").toUpperCase(),
    };
    if (mode === "editar" && existing) {
      updateTutor(existing.id, {
        nome: values.nome,
        cpf: values.cpf ?? "",
        email: values.email ?? "",
        telefone: values.contato1,
        endereco,
        observacoes: values.observacoes || undefined,
      });
      toast.success("Tutor atualizado.");
      navigate({ to: "/tutores/$id", params: { id: existing.id } });
      return;
    }
    const novo: Tutor = {
      id: `tut-new-${Date.now()}`,
      nome: values.nome,
      cpf: values.cpf ?? "",
      email: values.email ?? "",
      telefone: values.contato1,
      endereco,
      observacoes: values.observacoes || undefined,
      criadoEm: new Date().toISOString(),
    };
    addTutor(novo);
    toast.success("Tutor criado.");
    navigate({ to: "/tutores/$id", params: { id: novo.id } });
    // TODO(api): substituir por createServerFn (createTutor / updateTutor).
  }

  return (
    <>
      <PageHeader
        title={mode === "novo" ? "Novo tutor" : "Editar tutor"}
        description={mode === "novo" ? "Cadastre um tutor para vincular pets e OS." : `Editando ${existing?.nome}.`}
        actions={
          <Button asChild variant="outline">
            <Link to="/tutores">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card className="rounded-[12px]">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nome*" error={errors.nome?.message}>
              <Input {...register("nome")} />
            </Field>
            <Field label="CPF" error={errors.cpf?.message}>
              <Input {...register("cpf")} placeholder="000.000.000-00" />
            </Field>
            <Field label="RNE" error={errors.rne?.message}>
              <Input {...register("rne")} />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Contato 1*" error={errors.contato1?.message}>
              <Input {...register("contato1")} placeholder="(11) 99999-0000" />
            </Field>
            <Field label="Contato 2" error={errors.contato2?.message}>
              <Input {...register("contato2")} />
            </Field>
            <Field label="Contato 3" error={errors.contato3?.message}>
              <Input {...register("contato3")} />
            </Field>
            <Field label="CEP" error={errors.cep?.message}>
              <Input {...register("cep")} placeholder="00000-000" />
            </Field>
            <Field label="Endereço" error={errors.logradouro?.message}>
              <Input {...register("logradouro")} />
            </Field>
            <Field label="Número" error={errors.numero?.message}>
              <Input {...register("numero")} />
            </Field>
            <Field label="Bairro" error={errors.bairro?.message}>
              <Input {...register("bairro")} />
            </Field>
            <Field label="Cidade" error={errors.cidade?.message}>
              <Input {...register("cidade")} />
            </Field>
            <Field label="UF" error={errors.uf?.message}>
              <Input {...register("uf")} maxLength={2} placeholder="SP" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Observações" error={errors.observacoes?.message}>
                <Textarea rows={3} {...register("observacoes")} />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Re-export para reaproveitar `createFileRoute` por consumidores se necessário.
export { createFileRoute };