import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Pencil, Plus, Power, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status/StatusBadge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  listEspecies,
  createEspecie,
  updateEspecie as updateEspecieFn,
  listRacas,
  createRaca,
  updateRaca as updateRacaFn,
} from "@/lib/api/lookups.functions";
import type { Especie, Raca } from "@/types/lookup";

const especiesRouteApi = getRouteApi("/_app/configuracoes/especies");

/**
 * Normaliza texto para comparação: trim, remove acentos (NFD),
 * baixa a caixa em pt-BR. Usada APENAS para comparação — o valor
 * persistido continua o que o usuário digitou.
 */
const normalizeLookupText = (value: string) =>
  value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

const DUP_ERROR_TYPE = "duplicate";

const especieSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da espécie."),
});
type EspecieForm = z.infer<typeof especieSchema>;

const racaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da raça."),
  especieId: z.string().min(1, "Selecione a espécie."),
});
type RacaForm = z.infer<typeof racaSchema>;

export function EspeciesRacasTab() {
  const especiesQuery = useQuery({ queryKey: ["especies"], queryFn: () => listEspecies() });
  const racasQuery = useQuery({ queryKey: ["racas"], queryFn: () => listRacas() });

  const especies = especiesQuery.data ?? [];
  const racas = racasQuery.data ?? [];

  const search = especiesRouteApi.useSearch();
  const navigate = especiesRouteApi.useNavigate();
  const especieId = search.especieId;

  // Se o especieId da URL não existir mais na lista, limpa (sem fallback automático).
  useEffect(() => {
    if (!especiesQuery.isSuccess || !especieId) return;
    if (!especies.some((e) => e.id === especieId)) {
      navigate({ to: "/configuracoes/especies", search: { especieId: undefined }, replace: true });
    }
  }, [especieId, especies, especiesQuery.isSuccess, navigate]);

  const selecionarEspecie = (id: string) => {
    navigate({ search: { especieId: id } });
  };
  const voltarParaLista = () => {
    navigate({ search: { especieId: undefined } });
  };

  const especieSelecionada = especies.find((e) => e.id === especieId) ?? null;

  // Contagem por espécie (todas as raças — ativas e inativas — coerente com a lista).
  const contagemPorEspecie = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of racas) map.set(r.especieId, (map.get(r.especieId) ?? 0) + 1);
    return map;
  }, [racas]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
      {/* Lista de espécies — some no mobile quando há espécie selecionada */}
      <section className={cn("lg:block", especieId ? "hidden" : "block")}>
        <EspeciesPanel
          especies={especies}
          racas={racas}
          contagemPorEspecie={contagemPorEspecie}
          especieSelecionadaId={especieId}
          onSelecionar={selecionarEspecie}
        />
      </section>

      {/* Painel de raças — some no mobile quando não há seleção */}
      <section className={cn("lg:block", especieId ? "block" : "hidden")}>
        <RacasPanel
          especies={especies}
          racas={racas}
          especieSelecionada={especieSelecionada}
          onVoltar={voltarParaLista}
        />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------
// Painel de espécies
// ---------------------------------------------------------------

function EspeciesPanel({
  especies,
  racas,
  contagemPorEspecie,
  especieSelecionadaId,
  onSelecionar,
}: {
  especies: Especie[];
  racas: Raca[];
  contagemPorEspecie: Map<string, number>;
  especieSelecionadaId?: string;
  onSelecionar: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Especie | null>(null);

  const form = useForm<EspecieForm>({
    resolver: zodResolver(especieSchema),
    defaultValues: { nome: "" },
  });
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors } } = form;

  const hasEspecieDuplicada = (nome: string, editandoId?: string) => {
    const normalizado = normalizeLookupText(nome);
    if (!normalizado) return false;
    return especies.some(
      (e) => e.id !== editandoId && normalizeLookupText(e.nome) === normalizado,
    );
  };

  const salvar = useMutation({
    mutationFn: (v: { nome: string; editandoId?: string }) =>
      v.editandoId
        ? updateEspecieFn({ data: { id: v.editandoId, patch: { nome: v.nome } } })
        : createEspecie({ data: { nome: v.nome } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["especies"] });
      toast.success(editando ? "Espécie atualizada." : "Espécie criada.");
      setDialogAberto(false);
      setEditando(null);
      reset({ nome: "" });
    },
    onError: () => toast.error("Não foi possível salvar a espécie."),
  });

  const toggleAtivo = useMutation({
    mutationFn: (e: Especie) => updateEspecieFn({ data: { id: e.id, patch: { ativo: !e.ativo } } }),
    onSuccess: (_, e) => {
      queryClient.invalidateQueries({ queryKey: ["especies"] });
      toast.success(e.ativo ? "Espécie inativada." : "Espécie reativada.");
    },
    onError: () => toast.error("Não foi possível alterar o status."),
  });

  function abrirNovo() {
    setEditando(null);
    reset({ nome: "" });
    clearErrors();
    setDialogAberto(true);
  }
  function abrirEdicao(e: Especie) {
    setEditando(e);
    reset({ nome: e.nome });
    clearErrors();
    setDialogAberto(true);
  }
  function onOpenChange(open: boolean) {
    setDialogAberto(open);
    if (!open) {
      setEditando(null);
      reset({ nome: "" });
      clearErrors();
    }
  }

  function onSubmit(v: EspecieForm) {
    if (hasEspecieDuplicada(v.nome, editando?.id)) {
      setError("nome", { type: DUP_ERROR_TYPE, message: "Já existe uma espécie com este nome." });
      return;
    }
    salvar.mutate({ nome: v.nome, editandoId: editando?.id });
  }

  // Revalida duplicidade sempre que o nome muda, sem apagar erros do schema.
  const nomeAtual = form.watch("nome");
  useEffect(() => {
    const erro = form.formState.errors.nome;
    if (erro && erro.type !== DUP_ERROR_TYPE) return; // não mexe em erro de schema
    if (hasEspecieDuplicada(nomeAtual ?? "", editando?.id)) {
      if (!erro || erro.type !== DUP_ERROR_TYPE) {
        setError("nome", { type: DUP_ERROR_TYPE, message: "Já existe uma espécie com este nome." });
      }
    } else if (erro?.type === DUP_ERROR_TYPE) {
      clearErrors("nome");
    }
    // hasEspecieDuplicada muda quando `especies` muda — inclui-se via nomeAtual
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeAtual, especies, editando?.id]);

  const especiesFiltradas = useMemo(() => {
    const termo = normalizeLookupText(busca);
    if (!termo) return especies;
    return especies.filter((e) => normalizeLookupText(e.nome).includes(termo));
  }, [busca, especies]);

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h3 className="min-w-0 truncate text-sm font-semibold">
            Espécies ({especies.length})
          </h3>
          <RoleGuard permission="config.gerenciar">
            <Button size="sm" onClick={abrirNovo}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nova espécie
            </Button>
          </RoleGuard>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar espécie…"
            className="pl-8"
            aria-label="Buscar espécie"
          />
        </div>

        {especies.length === 0 ? (
          <EmptyState title="Nenhuma espécie cadastrada." />
        ) : especiesFiltradas.length === 0 ? (
          <EmptyState title="Nenhuma espécie corresponde à busca." />
        ) : (
          <ul className="flex flex-col gap-1">
            {especiesFiltradas.map((e) => {
              const selecionada = e.id === especieSelecionadaId;
              const totalRacas = contagemPorEspecie.get(e.id) ?? 0;
              return (
                <li
                  key={e.id}
                  className={cn(
                    "flex items-center gap-1 rounded-[10px] border border-transparent px-1",
                    selecionada
                      ? "border-primary/40 bg-accent"
                      : "hover:bg-muted/60",
                  )}
                >
                  {/* Botão de seleção (área principal) — sem outros botões dentro */}
                  <button
                    type="button"
                    onClick={() => onSelecionar(e.id)}
                    aria-pressed={selecionada}
                    aria-label={`Ver raças de ${e.nome}`}
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[8px] px-2 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{e.nome}</span>
                        {!e.ativo && (
                          <StatusBadge label="Inativa" tone="neutral" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {totalRacas} {totalRacas === 1 ? "raça" : "raças"}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground lg:hidden" />
                  </button>

                  {/* Ações — separadas do botão de seleção */}
                  <RoleGuard permission="config.gerenciar">
                    <div className="flex shrink-0 items-center gap-1 pr-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => abrirEdicao(e)}
                        aria-label={`Editar espécie ${e.nome}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleAtivo.mutate(e)}
                        disabled={toggleAtivo.isPending}
                        aria-label={e.ativo ? `Inativar espécie ${e.nome}` : `Reativar espécie ${e.nome}`}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </RoleGuard>
                </li>
              );
            })}
          </ul>
        )}

        {/* Suprime warning: usamos `racas` só no cálculo de contagem no pai */}
        <span className="hidden" aria-hidden>{racas.length}</span>
      </CardContent>

      <Dialog open={dialogAberto} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar espécie" : "Nova espécie"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input {...register("nome")} autoFocus />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending || !!errors.nome}>
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------
// Painel de raças
// ---------------------------------------------------------------

function RacasPanel({
  especies,
  racas,
  especieSelecionada,
  onVoltar,
}: {
  especies: Especie[];
  racas: Raca[];
  especieSelecionada: Especie | null;
  onVoltar: () => void;
}) {
  const queryClient = useQueryClient();
  const { can } = useRoleGuard();
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Raca | null>(null);

  const form = useForm<RacaForm>({
    resolver: zodResolver(racaSchema),
    defaultValues: { nome: "", especieId: "" },
  });
  const {
    register, handleSubmit, reset, setValue, watch, setError, clearErrors, getValues,
    formState: { errors },
  } = form;

  const hasRacaDuplicada = (nome: string, especieId: string, editandoId?: string) => {
    const normalizado = normalizeLookupText(nome);
    if (!normalizado || !especieId) return false;
    return racas.some(
      (r) => r.id !== editandoId && r.especieId === especieId && normalizeLookupText(r.nome) === normalizado,
    );
  };

  const salvar = useMutation({
    mutationFn: (v: { nome: string; especieId: string; editandoId?: string }) =>
      v.editandoId
        ? updateRacaFn({ data: { id: v.editandoId, patch: { nome: v.nome, especieId: v.especieId } } })
        : createRaca({ data: { nome: v.nome, especieId: v.especieId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racas"] });
      toast.success(editando ? "Raça atualizada." : "Raça criada.");
      setDialogAberto(false);
      setEditando(null);
      reset({ nome: "", especieId: "" });
    },
    onError: () => toast.error("Não foi possível salvar a raça."),
  });

  const toggleAtivo = useMutation({
    mutationFn: (r: Raca) => updateRacaFn({ data: { id: r.id, patch: { ativo: !r.ativo } } }),
    onSuccess: (_, r) => {
      queryClient.invalidateQueries({ queryKey: ["racas"] });
      toast.success(r.ativo ? "Raça inativada." : "Raça reativada.");
    },
    onError: () => toast.error("Não foi possível alterar o status."),
  });

  function abrirNovo() {
    if (!especieSelecionada) return;
    setEditando(null);
    reset({ nome: "", especieId: especieSelecionada.id });
    clearErrors();
    setDialogAberto(true);
  }
  function abrirEdicao(r: Raca) {
    setEditando(r);
    reset({ nome: r.nome, especieId: r.especieId });
    clearErrors();
    setDialogAberto(true);
  }
  function onOpenChange(open: boolean) {
    if (salvar.isPending) return; // impede fechar durante mutação
    setDialogAberto(open);
    if (!open) {
      setEditando(null);
      reset({ nome: "", especieId: "" });
      clearErrors();
    }
  }

  function onSubmit(v: RacaForm) {
    if (hasRacaDuplicada(v.nome, v.especieId, editando?.id)) {
      setError("nome", { type: DUP_ERROR_TYPE, message: "Já existe uma raça com este nome nesta espécie." });
      return;
    }
    salvar.mutate({ nome: v.nome, especieId: v.especieId, editandoId: editando?.id });
  }

  // Recalcula duplicidade quando nome, espécie ou base de raças muda —
  // sem apagar erros vindos do schema.
  const nomeAtual = watch("nome");
  const especieAtual = watch("especieId");
  useEffect(() => {
    const erro = form.formState.errors.nome;
    if (erro && erro.type !== DUP_ERROR_TYPE) return;
    if (hasRacaDuplicada(nomeAtual ?? "", especieAtual ?? "", editando?.id)) {
      if (!erro || erro.type !== DUP_ERROR_TYPE) {
        setError("nome", {
          type: DUP_ERROR_TYPE,
          message: "Já existe uma raça com este nome nesta espécie.",
        });
      }
    } else if (erro?.type === DUP_ERROR_TYPE) {
      clearErrors("nome");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomeAtual, especieAtual, racas, editando?.id]);

  const racasDaEspecie = useMemo(() => {
    if (!especieSelecionada) return [];
    return racas.filter((r) => r.especieId === especieSelecionada.id);
  }, [racas, especieSelecionada]);

  const racasFiltradas = useMemo(() => {
    const termo = normalizeLookupText(busca);
    if (!termo) return racasDaEspecie;
    return racasDaEspecie.filter((r) => normalizeLookupText(r.nome).includes(termo));
  }, [busca, racasDaEspecie]);

  if (!especieSelecionada) {
    return (
      <Card className="rounded-[12px]">
        <CardContent className="p-8">
          <EmptyState title="Selecione uma espécie à esquerda para ver as raças." />
        </CardContent>
      </Card>
    );
  }

  const podeGerenciar = can("config.gerenciar");
  const nomeEspecieAtualNoForm =
    especies.find((e) => e.id === getValues("especieId"))?.nome ?? "";

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 lg:hidden">
          <Button size="sm" variant="ghost" onClick={onVoltar} className="-ml-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para espécies
          </Button>
        </div>

        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">
              Raças de {especieSelecionada.nome} ({racasDaEspecie.length})
            </h3>
            {!especieSelecionada.ativo && (
              <div className="mt-1">
                <StatusBadge label="Espécie inativa" tone="neutral" />
              </div>
            )}
          </div>
          <RoleGuard permission="config.gerenciar">
            <Button size="sm" onClick={abrirNovo}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nova raça
            </Button>
          </RoleGuard>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Buscar raça em ${especieSelecionada.nome}…`}
            className="pl-8"
            aria-label="Buscar raça"
          />
        </div>

        {racasDaEspecie.length === 0 ? (
          <div className="rounded-[10px] border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma raça cadastrada para esta espécie.
            </p>
            {podeGerenciar && (
              <Button size="sm" className="mt-3" onClick={abrirNovo}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Cadastrar raça
              </Button>
            )}
          </div>
        ) : racasFiltradas.length === 0 ? (
          <EmptyState title="Nenhuma raça corresponde à busca." />
        ) : (
          <ul className="flex flex-col gap-1">
            {racasFiltradas.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-1 rounded-[10px] border border-transparent px-1 hover:bg-muted/60"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2">
                  <span className="truncate text-sm font-medium">{r.nome}</span>
                  {!r.ativo && <StatusBadge label="Inativa" tone="neutral" />}
                </div>
                <RoleGuard permission="config.gerenciar">
                  <div className="flex shrink-0 items-center gap-1 pr-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => abrirEdicao(r)}
                      aria-label={`Editar raça ${r.nome}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleAtivo.mutate(r)}
                      disabled={toggleAtivo.isPending}
                      aria-label={r.ativo ? `Inativar raça ${r.nome}` : `Reativar raça ${r.nome}`}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </RoleGuard>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialogAberto} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar raça" : "Nova raça"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="text-xs">Espécie *</Label>
              <Select
                value={watch("especieId") || undefined}
                onValueChange={(v) => setValue("especieId", v, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a espécie">
                    {nomeEspecieAtualNoForm || "Selecione a espécie"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {especies.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}{!e.ativo ? " (inativa)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.especieId && (
                <p className="text-xs text-destructive">{errors.especieId.message}</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input {...register("nome")} autoFocus />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending || !!errors.nome || !!errors.especieId}>
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------
// Auxiliar
// ---------------------------------------------------------------

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-[10px] border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
