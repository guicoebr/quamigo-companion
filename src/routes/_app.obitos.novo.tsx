import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, PawPrint } from "lucide-react";

import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { listTutores } from "@/lib/api/tutores.functions";
import { listPets } from "@/lib/api/pets.functions";
import { listEspecies, listModalidades } from "@/lib/api/lookups.functions";
import { listServicosProdutos } from "@/lib/api/servicos-produtos.functions";
import { registrarObito } from "@/lib/api/ordens-servico.functions";
import { formatBRL, formatCidadeUf, formatCPF, formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/_app/obitos/novo")({
  head: () => ({ meta: [{ title: "Registrar óbito — +QAmigo" }] }),
  component: RegistrarObitoPage,
});

const STEPS = [
  { id: 1, label: "Tutor" },
  { id: 2, label: "Pet & óbito" },
  { id: 3, label: "Serviços" },
  { id: 4, label: "Resumo" },
] as const;

type FormState = {
  tutorId: string;
  petId: string;
  dataFalecimento: string;
  modalidadeId: string;
  itensIds: string[];
  observacoes: string;
};

const tutorSchema = z.object({ tutorId: z.string().min(1, "Selecione o tutor.") });
const petSchema = z.object({
  petId: z.string().min(1, "Selecione o pet."),
  dataFalecimento: z.string().min(1, "Informe a data do óbito."),
});
const servicosSchema = z.object({
  modalidadeId: z.string().min(1, "Selecione a modalidade."),
  itensIds: z.array(z.string()).min(1, "Selecione ao menos 1 serviço/produto."),
});

function RegistrarObitoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: pets = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
  const { data: especies = [] } = useQuery({
    queryKey: ["especies"],
    queryFn: () => listEspecies(),
  });
  const { data: modalidades = [] } = useQuery({
    queryKey: ["modalidades"],
    queryFn: () => listModalidades(),
  });
  const { data: servicosProdutos = [] } = useQuery({
    queryKey: ["servicos-produtos"],
    queryFn: () => listServicosProdutos(),
  });

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    tutorId: "",
    petId: "",
    dataFalecimento: new Date().toISOString().slice(0, 10),
    modalidadeId: "",
    itensIds: [],
    observacoes: "",
  });
  const [buscaTutor, setBuscaTutor] = useState("");

  const tutorSelecionado = tutores.find((t) => t.id === form.tutorId);
  const petsDisponiveis = useMemo(
    () => pets.filter((p) => p.tutorId === form.tutorId && !p.dataFalecimento),
    [pets, form.tutorId],
  );
  const itensSelecionados = useMemo(
    () => servicosProdutos.filter((s) => form.itensIds.includes(s.id)),
    [servicosProdutos, form.itensIds],
  );
  const total = itensSelecionados.reduce((acc, x) => acc + x.preco, 0);

  const tutoresFiltrados = useMemo(() => {
    const t = buscaTutor.trim().toLowerCase();
    if (!t) return tutores.slice(0, 6);
    return tutores.filter(
      (x) =>
        x.nome.toLowerCase().includes(t) ||
        x.cpf.includes(t.replace(/\D/g, "")) ||
        x.email.toLowerCase().includes(t),
    );
  }, [tutores, buscaTutor]);

  function validate(current: number): boolean {
    const schema =
      current === 1
        ? tutorSchema
        : current === 2
          ? petSchema
          : current === 3
            ? servicosSchema
            : null;
    if (!schema) return true;
    const res = schema.safeParse(form);
    if (!res.success) {
      const e: Record<string, string> = {};
      for (const issue of res.error.issues) e[String(issue.path[0])] = issue.message;
      setErrors(e);
      return false;
    }
    setErrors({});
    return true;
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  const confirmarMutation = useMutation({
    mutationFn: () =>
      registrarObito({
        data: {
          tutorId: form.tutorId,
          petId: form.petId,
          modalidadeId: form.modalidadeId,
          dataFalecimento: form.dataFalecimento,
          itensIds: form.itensIds,
          observacoes: form.observacoes || undefined,
        },
      }),
    onSuccess: ({ os, numeroPagamento }) => {
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success(`Óbito registrado. ${os.numero} criada e pagamento ${numeroPagamento} gerado.`);
      navigate({ to: "/ordens-servico/$id", params: { id: os.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao registrar óbito."),
  });

  function confirmar() {
    if (!validate(3)) return;
    confirmarMutation.mutate();
  }

  return (
    <>
      <PageHeader
        title="Registrar óbito"
        description="Preencha os 4 passos para criar a Ordem de Serviço."
      />

      {/* Stepper visual */}
      <ol className="mb-6 flex w-full items-center gap-2 overflow-x-auto">
        {STEPS.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-success text-success-foreground",
                  active && "bg-primary text-primary-foreground",
                  !active && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-sm",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
            </li>
          );
        })}
      </ol>

      <Card className="rounded-[12px]">
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label>Buscar tutor</Label>
              <Input
                value={buscaTutor}
                onChange={(e) => setBuscaTutor(e.target.value)}
                placeholder="Nome, CPF ou e-mail"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {tutoresFiltrados.map((t) => {
                  const sel = form.tutorId === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setForm((f) => ({ ...f, tutorId: t.id, petId: "" }))}
                      className={cn(
                        "rounded-md border p-3 text-left transition-colors",
                        sel ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                      )}
                    >
                      <p className="text-sm font-medium">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCPF(t.cpf)} • {t.endereco.cidade}/{t.endereco.uf}
                      </p>
                    </button>
                  );
                })}
                {tutoresFiltrados.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum tutor encontrado.</p>
                )}
              </div>
              {errors.tutorId && <p className="text-sm text-destructive">{errors.tutorId}</p>}
              {/* TODO(api): formulário "Novo tutor" + busca no backend. */}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {!tutorSelecionado && (
                <p className="text-sm text-muted-foreground">
                  Selecione um tutor no passo anterior.
                </p>
              )}
              {tutorSelecionado && (
                <>
                  <div>
                    <Label className="mb-2 block">
                      Pet falecido — tutor: {tutorSelecionado.nome}
                    </Label>
                    {petsDisponiveis.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Este tutor não possui pets vivos cadastrados.
                      </p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {petsDisponiveis.map((p) => {
                          const sel = form.petId === p.id;
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => setForm((f) => ({ ...f, petId: p.id }))}
                              className={cn(
                                "flex items-center gap-3 rounded-md border p-3 text-left transition-colors",
                                sel
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted",
                              )}
                            >
                              <PawPrint className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{p.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {especies.find((e) => e.id === p.especieId)?.nome} • {p.pesoKg} kg
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {errors.petId && (
                      <p className="mt-2 text-sm text-destructive">{errors.petId}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dataFalecimento">Data do óbito</Label>
                    <Input
                      id="dataFalecimento"
                      type="date"
                      value={form.dataFalecimento}
                      onChange={(e) => setForm((f) => ({ ...f, dataFalecimento: e.target.value }))}
                      className="mt-1 max-w-xs"
                    />
                    {errors.dataFalecimento && (
                      <p className="mt-2 text-sm text-destructive">{errors.dataFalecimento}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label>Modalidade</Label>
                <Select
                  value={form.modalidadeId}
                  onValueChange={(v) => setForm((f) => ({ ...f, modalidadeId: v }))}
                >
                  <SelectTrigger className="mt-1 max-w-md">
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalidades
                      .filter((m) => m.ativo)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.modalidadeId && (
                  <p className="mt-2 text-sm text-destructive">{errors.modalidadeId}</p>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Serviços e produtos</Label>
                <div className="space-y-2">
                  {servicosProdutos
                    .filter((s) => s.ativo)
                    .map((s) => {
                      const checked = form.itensIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors",
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) =>
                                setForm((f) => ({
                                  ...f,
                                  itensIds: v
                                    ? [...f.itensIds, s.id]
                                    : f.itensIds.filter((x) => x !== s.id),
                                }))
                              }
                            />
                            <div>
                              <p className="text-sm font-medium">{s.nome}</p>
                              <p className="text-xs uppercase text-muted-foreground">{s.tipo}</p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatBRL(s.preco)}
                          </span>
                        </label>
                      );
                    })}
                </div>
                {errors.itensIds && (
                  <p className="mt-2 text-sm text-destructive">{errors.itensIds}</p>
                )}
                <div className="mt-3 flex items-center justify-end gap-3 border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Total estimado</span>
                  <span className="text-lg font-semibold tabular-nums">{formatBRL(total)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="obs">Observações (opcional)</Label>
                <Textarea
                  id="obs"
                  value={form.observacoes}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                  placeholder="Detalhes da coleta, preferências do tutor..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-sm">
              <Resumo
                label="Tutor"
                value={
                  tutorSelecionado
                    ? `${tutorSelecionado.nome} — ${formatCPF(tutorSelecionado.cpf)}`
                    : "—"
                }
              />
              <Resumo label="Pet" value={pets.find((p) => p.id === form.petId)?.nome ?? "—"} />
              <Resumo label="Data do óbito" value={formatDate(form.dataFalecimento)} />
              <Resumo
                label="Modalidade"
                value={modalidades.find((m) => m.id === form.modalidadeId)?.nome ?? "—"}
              />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Itens</p>
                <ul className="mt-2 divide-y divide-border rounded-md border border-border">
                  {itensSelecionados.map((i) => (
                    <li key={i.id} className="flex justify-between p-2.5">
                      <span>{i.nome}</span>
                      <span className="tabular-nums">{formatBRL(i.preco)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between bg-muted p-2.5 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatBRL(total)}</span>
                  </li>
                </ul>
              </div>
              {form.observacoes && <Resumo label="Observações" value={form.observacoes} />}
              <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Ao confirmar, será criada uma OS no status <strong>Aguardando coleta</strong>.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={back} disabled={step === 1}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            {step < 4 ? (
              <Button onClick={next}>
                Avançar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={confirmar} disabled={confirmarMutation.isPending}>
                <Check className="mr-1 h-4 w-4" />
                {confirmarMutation.isPending ? "Registrando..." : "Confirmar registro"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Resumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
