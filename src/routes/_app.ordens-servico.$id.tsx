import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status/StatusBadge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { listTutores } from "@/lib/api/tutores.functions";
import { listPets } from "@/lib/api/pets.functions";
import { listModalidades } from "@/lib/api/lookups.functions";
import { getOS, mudarStatusOS } from "@/lib/api/ordens-servico.functions";
import { getPagamento } from "@/lib/api/pagamentos.functions";
import { useAuthStore } from "@/store/authStore";
import { hasPermission } from "@/lib/permissions";
import { STATUS_OS_FLOW, STATUS_OS_META, nextStatus, prevStatus } from "@/lib/osStatus";
import { formatBRL, formatDate, formatDateTime } from "@/lib/formatters";

export const Route = createFileRoute("/_app/ordens-servico/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — +QAmigo` }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const os = await getOS({ data: { id: params.id } }).catch(() => null);
    if (!os) throw notFound();
    return { osId: os.id };
  },
  notFoundComponent: () => (
    <>
      <PageHeader title="OS não encontrada" />
      <Button asChild variant="outline">
        <Link to="/ordens-servico">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>
    </>
  ),
  component: OSDetalhe,
});

function OSDetalhe() {
  const { osId } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { data: os } = useQuery({
    queryKey: ["ordens-servico", osId],
    queryFn: () => getOS({ data: { id: osId } }),
  });
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: pets = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
  const { data: modalidades = [] } = useQuery({
    queryKey: ["modalidades"],
    queryFn: () => listModalidades(),
  });
  const { data: pagamento } = useQuery({
    queryKey: ["pagamentos", os?.pagamentoId],
    queryFn: () => getPagamento({ data: { id: os!.pagamentoId! } }),
    enabled: !!os?.pagamentoId,
  });
  const user = useAuthStore((s) => s.user);

  const statusMutation = useMutation({
    mutationFn: (direcao: "avancar" | "regredir") => mudarStatusOS({ data: { id: osId, direcao } }),
    onSuccess: (atualizada, direcao) => {
      queryClient.setQueryData(["ordens-servico", osId], atualizada);
      queryClient.invalidateQueries({ queryKey: ["ordens-servico"] });
      const verbo = direcao === "avancar" ? "atualizado" : "revertido";
      toast.success(`Status ${verbo} para "${STATUS_OS_META[atualizada.status].label}".`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao mudar status."),
  });

  if (!os) {
    return (
      <>
        <PageHeader title="OS não encontrada" />
        <Button asChild variant="outline">
          <Link to="/ordens-servico">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Link>
        </Button>
      </>
    );
  }

  const tutor = tutores.find((t) => t.id === os.tutorId);
  const pet = pets.find((p) => p.id === os.petId);
  const modalidade = modalidades.find((m) => m.id === os.modalidadeId);
  const meta = STATUS_OS_META[os.status];
  const proximo = nextStatus(os.status);
  const anterior = prevStatus(os.status);
  const stepIndex = STATUS_OS_FLOW.indexOf(os.status);

  function avancar() {
    if (!proximo || statusMutation.isPending) return;
    statusMutation.mutate("avancar");
  }

  function regredir() {
    if (!anterior || statusMutation.isPending) return;
    statusMutation.mutate("regredir");
  }

  return (
    <>
      <PageHeader
        title={`OS ${os.numero}`}
        description={`Criada em ${formatDate(os.criadoEm)} • atualizada em ${formatDate(os.atualizadoEm)}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/ordens-servico">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />

      {/* Barra de status */}
      <Card className="mb-4 rounded-[12px]">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Status atual</span>
              <StatusBadge label={meta.label} color={meta.color} />
            </div>
            <RoleGuard permission="os.avancar_status">
              <div className="flex gap-2">
                <RoleGuard permission="os.regredir_status">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regredir}
                    disabled={!anterior || statusMutation.isPending}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Regredir
                  </Button>
                </RoleGuard>
                <Button size="sm" onClick={avancar} disabled={!proximo || statusMutation.isPending}>
                  Avançar
                  {proximo && <span className="ml-1">→ {STATUS_OS_META[proximo].label}</span>}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </RoleGuard>
          </div>

          {/* Trilho horizontal de status */}
          <ol className="flex w-full items-center gap-1 overflow-x-auto">
            {STATUS_OS_FLOW.map((s, i) => {
              const m = STATUS_OS_META[s];
              const ativo = i === stepIndex;
              const passado = i < stepIndex;
              return (
                <li key={s} className="flex flex-1 items-center gap-1">
                  <div
                    className="h-2 flex-1 rounded-full"
                    style={{
                      backgroundColor: passado || ativo ? m.color : "var(--muted)",
                      opacity: ativo ? 1 : passado ? 0.7 : 0.4,
                    }}
                    title={m.label}
                  />
                  {i === STATUS_OS_FLOW.length - 1 && (
                    <span className="ml-1 whitespace-nowrap text-xs text-muted-foreground">
                      {STATUS_OS_META[STATUS_OS_FLOW[STATUS_OS_FLOW.length - 1]].label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Resumo */}
        <Card className="rounded-[12px] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Tutor">
              {tutor ? (
                <Link
                  to="/tutores/$id"
                  params={{ id: tutor.id }}
                  className="text-primary hover:underline"
                >
                  {tutor.nome}
                </Link>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Pet">
              {pet ? (
                <Link
                  to="/pets/$id"
                  params={{ id: pet.id }}
                  className="text-primary hover:underline"
                >
                  {pet.nome}
                </Link>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Modalidade">{modalidade?.nome ?? "—"}</Field>
            {os.dataFalecimento && (
              <Field label="Data do óbito">{formatDate(os.dataFalecimento)}</Field>
            )}
            <Field label="Pagamento">
              {pagamento ? (
                <Link
                  to="/pagamentos/$id"
                  params={{ id: pagamento.id }}
                  className="text-primary hover:underline"
                >
                  {pagamento.numero}
                </Link>
              ) : (
                "Sem pagamento vinculado"
              )}
            </Field>
            {os.observacoes && <Field label="Observações">{os.observacoes}</Field>}
          </CardContent>
        </Card>

        {/* Itens */}
        <Card className="rounded-[12px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {os.itens.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.descricao}</TableCell>
                    <TableCell className="text-center tabular-nums">{i.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(i.precoUnitario)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(i.precoUnitario * i.quantidade)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold tabular-nums">
                    {formatBRL(os.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Histórico (timeline) */}
      <Card className="mt-4 rounded-[12px]">
        <CardHeader>
          <CardTitle className="text-base">Histórico de status</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {[...os.historico]
              .slice()
              .reverse()
              .map((h, idx) => {
                const m = STATUS_OS_META[h.status];
                return (
                  <li key={`${h.status}-${h.ocorridoEm}-${idx}`} className="relative">
                    <span
                      className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background"
                      style={{ backgroundColor: m.color }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={m.label} color={m.color} />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {formatDateTime(h.ocorridoEm)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      por <strong className="text-foreground">{h.usuarioNome}</strong>
                      {h.observacao && ` — ${h.observacao}`}
                    </p>
                  </li>
                );
              })}
          </ol>
          {!hasPermission(user?.role ?? null, "os.avancar_status") && (
            <p className="mt-4 text-xs text-muted-foreground">
              Você não tem permissão para alterar o status desta OS.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}
