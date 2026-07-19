import { useEffect, useRef, useState } from "react";
import { useForm, Controller, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  formatCpf,
  unformatCpf,
  isValidCpf,
  formatPhone,
  unformatPhone,
  formatCep,
  unformatCep,
} from "@/lib/formatters";
import { fetchViaCep } from "@/lib/viacep";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useParams, notFound } from "@tanstack/react-router";
import { ArrowLeft, Save, Search } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getTutor, createTutor, updateTutor } from "@/lib/api/tutores.functions";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório."),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => {
      const d = unformatCpf(v ?? "");
      return d.length < 11 || isValidCpf(d);
    }, { message: "CPF inválido. Verifique os números informados." }),
  rne: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /\S+@\S+\.\S+/.test(v), { message: "E-mail inválido." }),
  contato1: z
    .string()
    .refine((v) => unformatPhone(v).length >= 10, { message: "Informe ao menos um contato." }),
  contato2: z.string().optional().or(z.literal("")),
  contato3: z.string().optional().or(z.literal("")),
  cep: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => {
        const d = unformatCep(v ?? "");
        return d.length === 0 || isValidCep(d);
      },
      { message: "CEP inválido. Informe os 8 dígitos." },
    ),
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
  const { data: existing, isLoading } = useQuery({
    queryKey: ["tutor", params.id],
    queryFn: () => getTutor({ data: { id: params.id! } }),
    enabled: mode === "editar" && !!params.id,
  });
  if (mode === "editar" && !isLoading && !existing) throw notFound();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing
      ? {
          nome: existing.nome,
          cpf: formatCpf(existing.cpf),
          rne: "",
          email: existing.email,
          contato1: formatPhone(existing.telefone),
          contato2: "",
          contato3: "",
          cep: formatCep(existing.endereco.cep),
          logradouro: existing.endereco.logradouro,
          numero: existing.endereco.numero,
          bairro: existing.endereco.bairro,
          cidade: existing.endereco.cidade,
          uf: existing.endereco.uf,
          observacoes: existing.observacoes ?? "",
        }
      : undefined,
    defaultValues: { contato1: "", nome: "" },
  });

  async function onSubmit(values: FormValues) {
    const endereco = {
      cep: unformatCep(values.cep ?? ""),
      logradouro: values.logradouro ?? "",
      numero: values.numero ?? "",
      bairro: values.bairro ?? "",
      cidade: values.cidade ?? "",
      uf: (values.uf ?? "").toUpperCase(),
    };
    const payload = {
      nome: values.nome,
      cpf: unformatCpf(values.cpf ?? ""),
      email: values.email ?? "",
      telefone: unformatPhone(values.contato1),
      endereco,
      observacoes: values.observacoes || undefined,
    };
    try {
      if (mode === "editar" && existing) {
        await updateTutor({ data: { id: existing.id, patch: payload } });
        toast.success("Tutor atualizado.");
        navigate({ to: "/tutores/$id", params: { id: existing.id } });
      } else {
        const novo = await createTutor({ data: payload });
        toast.success("Tutor criado.");
        navigate({ to: "/tutores/$id", params: { id: novo.id } });
      }
    } catch {
      toast.error("Não foi possível salvar o tutor.");
    }
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
              <MaskedInput
                control={control}
                name="cpf"
                mask={formatCpf}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </Field>
            <Field label="RNE" error={errors.rne?.message}>
              <Input {...register("rne")} />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Contato 1*" error={errors.contato1?.message}>
              <MaskedInput
                control={control}
                name="contato1"
                mask={formatPhone}
                placeholder="(11) 99999-0000"
                inputMode="tel"
              />
            </Field>
            <Field label="Contato 2" error={errors.contato2?.message}>
              <MaskedInput
                control={control}
                name="contato2"
                mask={formatPhone}
                inputMode="tel"
              />
            </Field>
            <Field label="Contato 3" error={errors.contato3?.message}>
              <MaskedInput
                control={control}
                name="contato3"
                mask={formatPhone}
                inputMode="tel"
              />
            </Field>
            <Field label="CEP" error={errors.cep?.message}>
              <MaskedInput
                control={control}
                name="cep"
                mask={formatCep}
                placeholder="00000-000"
                inputMode="numeric"
              />
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

type MaskedInputProps = {
  control: Control<FormValues>;
  name: FieldPath<FormValues>;
  mask: (v: string) => string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

function MaskedInput({ control, name, mask, placeholder, inputMode }: MaskedInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Input
          value={mask(field.value ?? "")}
          onChange={(e) => field.onChange(mask(e.target.value))}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          placeholder={placeholder}
          inputMode={inputMode}
        />
      )}
    />
  );
}

// Re-export para reaproveitar `createFileRoute` por consumidores se necessário.
export { createFileRoute };