import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataStore } from "@/store/dataStore";
import { useMockData, petsDoTutor, nextContratoNumber } from "@/hooks/useMockData";
import type { Contrato, PeriodicidadeContrato } from "@/types/contrato";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    tutorId: z.string().min(1, "Selecione o tutor."),
    petsIds: z.array(z.string()).min(1, "Selecione ao menos 1 pet."),
    servicosIds: z.array(z.string()).min(1, "Selecione ao menos 1 serviço."),
    modalidade: z.enum(["recorrente", "vigencia"]),
    valorMensal: z.coerce.number().min(0.01, "Informe o valor mensal."),
    periodicidade: z.enum(["mensal", "trimestral", "anual"]),
    inicioVigencia: z.string().min(1, "Início obrigatório."),
    fimVigencia: z.string().optional().or(z.literal("")),
    descricao: z.string().optional().or(z.literal("")),
  })
  .refine((v) => v.modalidade !== "vigencia" || (v.fimVigencia && v.fimVigencia.length > 0), {
    message: "Fim obrigatório quando a modalidade é vigência.",
    path: ["fimVigencia"],
  });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/contratos/novo")({
  head: () => ({ meta: [{ title: "Novo contrato — +QAmigo" }] }),
  component: NovoContratoPage,
});

function NovoContratoPage() {
  const navigate = useNavigate();
  const { tutores, contratos, servicosProdutos, modalidades } = useMockData();
  const addContrato = useDataStore((s) => s.addContrato);
  const [buscaTutor, setBuscaTutor] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      petsIds: [],
      servicosIds: [],
      modalidade: "recorrente",
      periodicidade: "mensal",
      inicioVigencia: new Date().toISOString().slice(0, 10),
      valorMensal: 0,
    },
  });

  const tutorId = watch("tutorId");
  const petsIds = watch("petsIds") ?? [];
  const servicosIds = watch("servicosIds") ?? [];
  const modalidade = watch("modalidade");

  const tutoresFiltrados = useMemo(() => {
    const t = buscaTutor.trim().toLowerCase();
    if (!t) return tutores.slice(0, 6);
    return tutores.filter((x) => x.nome.toLowerCase().includes(t));
  }, [tutores, buscaTutor]);
  const petsDoSelecionado = useMemo(() => (tutorId ? petsDoTutor(tutorId) : []), [tutorId]);

  /** Pets já cobertos por contratos ativos (qualquer tutor). */
  const petsBloqueados = useMemo(() => {
    const set = new Set<string>();
    contratos
      .filter((c) => c.status === "ativo")
      .forEach((c) => c.petsIds.forEach((id) => set.add(id)));
    return set;
  }, [contratos]);

  function togglePet(id: string) {
    const novo = petsIds.includes(id) ? petsIds.filter((x) => x !== id) : [...petsIds, id];
    setValue("petsIds", novo, { shouldValidate: true });
  }
  function toggleServico(id: string) {
    const novo = servicosIds.includes(id) ? servicosIds.filter((x) => x !== id) : [...servicosIds, id];
    setValue("servicosIds", novo, { shouldValidate: true });
  }

  function onSubmit(values: FormValues) {
    const conflitos = values.petsIds.filter((id) => petsBloqueados.has(id));
    if (conflitos.length > 0) {
      toast.error("Não é possível incluir pets que já possuem contrato ativo.");
      return;
    }
    const numero = nextContratoNumber(contratos.map((c) => c.numero));
    const modalidadeId = modalidades.find((m) => m.ativo)?.id ?? "mod-1";
    const novo: Contrato = {
      id: `con-new-${Date.now()}`,
      numero,
      tutorId: values.tutorId,
      petsIds: values.petsIds,
      servicosIds: values.servicosIds,
      modalidadeId,
      status: "ativo",
      valorMensal: Number(values.valorMensal),
      periodicidade: values.periodicidade as PeriodicidadeContrato,
      inicioVigencia: values.inicioVigencia,
      fimVigencia: values.modalidade === "vigencia" ? values.fimVigencia || undefined : undefined,
      observacoes: values.descricao || undefined,
      criadoEm: new Date().toISOString(),
    };
    addContrato(novo);
    toast.success(`Contrato ${numero} criado.`);
    navigate({ to: "/contratos/$id", params: { id: novo.id } });
    // TODO(api): substituir por createServerFn (createContrato).
  }

  return (
    <>
      <PageHeader
        title="Novo contrato"
        actions={
          <Button asChild variant="outline">
            <Link to="/contratos">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="rounded-[12px]">
          <CardContent className="p-6 space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Tutor*</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={buscaTutor} onChange={(e) => setBuscaTutor(e.target.value)} placeholder="Buscar tutor" className="pl-9" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {tutoresFiltrados.map((t) => {
                const sel = tutorId === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => { setValue("tutorId", t.id, { shouldValidate: true }); setValue("petsIds", []); }}
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
          </CardContent>
        </Card>

        {tutorId && (
          <Card className="rounded-[12px]">
            <CardContent className="p-6 space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Pets cobertos*</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {petsDoSelecionado.map((p) => {
                  const checked = petsIds.includes(p.id);
                  const bloqueado = petsBloqueados.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className={cn(
                        "flex items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                        bloqueado ? "border-destructive/40 bg-destructive/5 opacity-70 cursor-not-allowed" : "border-border hover:bg-muted cursor-pointer",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={bloqueado}
                        onCheckedChange={() => !bloqueado && togglePet(p.id)}
                      />
                      <div>
                        <p className="font-medium">{p.nome}</p>
                        {bloqueado && (
                          <p className="text-xs text-destructive">Já coberto por contrato ativo.</p>
                        )}
                      </div>
                    </label>
                  );
                })}
                {petsDoSelecionado.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tutor sem pets cadastrados.</p>
                )}
              </div>
              {errors.petsIds && <p className="text-xs text-destructive">{errors.petsIds.message}</p>}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-[12px]">
          <CardContent className="p-6 space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">Serviços cobertos*</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {servicosProdutos.filter((s) => s.ativo).map((s) => {
                const checked = servicosIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleServico(s.id)} />
                    <div className="flex-1">
                      <p className="font-medium">{s.nome}</p>
                      <p className="text-xs capitalize text-muted-foreground">{s.tipo}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.servicosIds && <p className="text-xs text-destructive">{errors.servicosIds.message}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-[12px]">
          <CardContent className="p-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Modalidade*" error={errors.modalidade?.message}>
              <Select defaultValue={modalidade} onValueChange={(v) => setValue("modalidade", v as "recorrente" | "vigencia")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                  <SelectItem value="vigencia">Vigência</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Periodicidade*" error={errors.periodicidade?.message}>
              <Select defaultValue="mensal" onValueChange={(v) => setValue("periodicidade", v as "mensal" | "trimestral" | "anual")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor mensal (R$)*" error={errors.valorMensal?.message}>
              <Input type="number" step="0.01" {...register("valorMensal")} />
            </Field>
            <Field label="Início de vigência*" error={errors.inicioVigencia?.message}>
              <Input type="date" {...register("inicioVigencia")} />
            </Field>
            {modalidade === "vigencia" && (
              <Field label="Fim de vigência*" error={errors.fimVigencia?.message}>
                <Input type="date" {...register("fimVigencia")} />
              </Field>
            )}
            <div className="md:col-span-2">
              <Field label="Descrição" error={errors.descricao?.message}>
                <Textarea rows={3} {...register("descricao")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit"><Save className="mr-2 h-4 w-4" /> Criar contrato</Button>
        </div>
      </form>
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