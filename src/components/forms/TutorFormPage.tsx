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
  isValidCep,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
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

  // ===== ViaCEP: lookup automático de endereço =====
  const abortRef = useRef<AbortController | null>(null);
  const activeLookupCepRef = useRef<string | null>(null);
  const hasHydratedExistingRef = useRef(mode === "novo");
  const [cepStatus, setCepStatus] = useState<
    "idle" | "loading" | "not_found" | "network_error"
  >("idle");
  const [lastLookedUpCep, setLastLookedUpCep] = useState<string | null>(null);

  // Hidratação inicial (modo editar): registra o CEP salvo como já "consultado"
  // para bloquear o disparo automático durante o load do tutor existente.
  useEffect(() => {
    if (hasHydratedExistingRef.current) return;
    if (!existing) return;
    const d = unformatCep(existing.endereco.cep);
    if (d.length === 8) setLastLookedUpCep(d);
    hasHydratedExistingRef.current = true;
  }, [existing]);

  // Cleanup ao desmontar: aborta qualquer requisição pendente.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function runLookup(cep8: string, opts: { force: boolean }) {
    if (!hasHydratedExistingRef.current) return;
    if (!opts.force && cepStatus === "loading") return;
    if (!opts.force && cep8 === lastLookedUpCep) return;

    // Cancela qualquer consulta anterior.
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    activeLookupCepRef.current = cep8;
    setCepStatus("loading");

    try {
      const r = await fetchViaCep(cep8, ac.signal);
      // Guard contra resposta obsoleta ou consulta cancelada.
      if (abortRef.current !== ac || ac.signal.aborted) return;
      if (r.status === "aborted") return;

      if (r.status === "ok") {
        if (r.logradouro)
          setValue("logradouro", r.logradouro, { shouldDirty: true });
        if (r.bairro) setValue("bairro", r.bairro, { shouldDirty: true });
        if (r.cidade) setValue("cidade", r.cidade, { shouldDirty: true });
        if (r.uf) setValue("uf", r.uf.toUpperCase(), { shouldDirty: true });
        setLastLookedUpCep(cep8);
        setCepStatus("idle");
        setFocus("numero");
      } else if (r.status === "not_found") {
        setLastLookedUpCep(cep8);
        setCepStatus("not_found");
      } else {
        // erro real (timeout/rede/HTTP inválido) — não fixa lastLookedUpCep,
        // permitindo retry pelo botão "Buscar novamente".
        setCepStatus("network_error");
      }
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
        activeLookupCepRef.current = null;
      }
    }
  }

  // Observa mudanças no CEP: dispara consulta ao completar 8 dígitos e cancela
  // consultas em andamento quando o valor difere do que está sendo consultado.
  const cepValue = watch("cep");
  useEffect(() => {
    if (!hasHydratedExistingRef.current) return;
    const d = unformatCep(cepValue ?? "");

    // Se há uma consulta em andamento para outro CEP, cancela imediatamente.
    if (
      activeLookupCepRef.current !== null &&
      d !== activeLookupCepRef.current
    ) {
      abortRef.current?.abort();
      abortRef.current = null;
      activeLookupCepRef.current = null;
      setCepStatus("idle");
    }

    if (d.length === 8) {
      if (d !== lastLookedUpCep && cepStatus !== "loading") {
        void runLookup(d, { force: false });
      }
    } else {
      // Menos de 8 dígitos: limpa mensagens antigas mas mantém campos preenchidos.
      if (lastLookedUpCep !== null && d !== lastLookedUpCep) {
        setLastLookedUpCep(null);
      }
      if (cepStatus === "not_found" || cepStatus === "network_error") {
        setCepStatus("idle");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue]);


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
        if (createdTutorId) return;
        const novo = await createTutor({ data: payload });
        toast.success("Tutor cadastrado com sucesso.");
        setCreatedTutorId(novo.id);
      }
    } catch {
      toast.error("Não foi possível salvar o tutor.");
    }
  }

  const handleCadastrarPet = () => {
    if (!createdTutorId) return;
    actionNavigationRef.current = true;
    navigate({ to: "/pets/novo", search: { tutorId: createdTutorId } });
  };

  const handleVerTutor = () => {
    if (!createdTutorId) return;
    actionNavigationRef.current = true;
    navigate({ to: "/tutores/$id", params: { id: createdTutorId } });
  };

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
              <div className="flex gap-2">
                <div className="flex-1">
                  <MaskedInput
                    control={control}
                    name="cep"
                    mask={formatCep}
                    placeholder="00000-000"
                    inputMode="numeric"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={unformatCep(cepValue ?? "").length !== 8}
                  onClick={() =>
                    void runLookup(unformatCep(getValues("cep") ?? ""), {
                      force: true,
                    })
                  }
                >
                  <Search className="mr-1.5 h-3.5 w-3.5" />
                  {cepStatus === "loading" ? "Buscar novamente" : "Buscar CEP"}
                </Button>
              </div>
              {cepStatus === "loading" && (
                <p className="text-xs text-muted-foreground">Buscando endereço…</p>
              )}
              {cepStatus === "not_found" && (
                <p className="text-xs text-destructive">
                  CEP não encontrado. Verifique os números informados ou preencha o endereço manualmente.
                </p>
              )}
              {cepStatus === "network_error" && (
                <p className="text-xs text-destructive">
                  Não foi possível consultar o CEP agora. Preencha o endereço manualmente ou tente novamente.
                </p>
              )}
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