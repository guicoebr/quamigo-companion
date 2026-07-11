import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/cards/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { StatusBadge } from "@/components/status/StatusBadge";
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
import {
  ClipboardList,
  FileSignature,
  Wallet,
  AlertTriangle,
  PawPrint,
  ArrowRight,
} from "lucide-react";
import { useMockData, findTutor, findPet } from "@/hooks/useMockData";
import { listTutores } from "@/lib/api/tutores.functions";
import { listPets } from "@/lib/api/pets.functions";
import { STATUS_OS_FLOW, STATUS_OS_META } from "@/lib/osStatus";
import { formatBRL, formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — +QAmigo" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { ordensServico, contratos, pagamentos, pets } = useMockData();
  const { data: tutoresDb = [] } = useQuery({
    queryKey: ["tutores"],
    queryFn: () => listTutores(),
  });
  const { data: petsDb = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
  // Registros antigos (mock) referenciam ids dos mocks; os novos referenciam ids do banco.
  const tutorDe = (id: string) => tutoresDb.find((t) => t.id === id) ?? findTutor(id);
  const petDe = (id: string) => petsDb.find((p) => p.id === id) ?? findPet(id);

  const osAbertas = ordensServico.filter((os) => os.status !== "encerrado");
  const contratosAtivos = contratos.filter((c) => c.status === "ativo");

  const parcelasPendentes = pagamentos.flatMap((p) =>
    p.parcelas
      .filter((par) => par.status === "pendente" || par.status === "atrasado")
      .map((par) => ({ pagamento: p, parcela: par })),
  );
  const totalPendente = parcelasPendentes.reduce((acc, x) => acc + x.parcela.valor, 0);
  const parcelasAtrasadas = parcelasPendentes.filter((x) => x.parcela.status === "atrasado");

  // Distribuição por status
  const distribuicao = STATUS_OS_FLOW.map((status) => ({
    status,
    meta: STATUS_OS_META[status],
    total: ordensServico.filter((os) => os.status === status).length,
  }));
  const maxTotal = Math.max(1, ...distribuicao.map((d) => d.total));

  // OS recentes (top 5 por atualizadoEm desc)
  const osRecentes = [...ordensServico]
    .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
    .slice(0, 5);

  // Próximas parcelas a vencer
  const proximasParcelas = parcelasPendentes
    .slice()
    .sort((a, b) => a.parcela.vencimento.localeCompare(b.parcela.vencimento))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação +QAmigo."
        actions={
          <Button asChild>
            <Link to="/obitos/novo">
              <PawPrint className="mr-2 h-4 w-4" />
              Registrar óbito
            </Link>
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="OS em aberto"
          value={osAbertas.length}
          hint={`${ordensServico.length} no total`}
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          label="Contratos ativos"
          value={contratosAtivos.length}
          hint={`${pets.length} pets cadastrados`}
          icon={FileSignature}
          tone="success"
        />
        <StatCard
          label="A receber"
          value={formatBRL(totalPendente)}
          hint={`${parcelasPendentes.length} parcela(s)`}
          icon={Wallet}
          tone="default"
        />
        <StatCard
          label="Parcelas atrasadas"
          value={parcelasAtrasadas.length}
          hint="Requer atenção"
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      {/* Distribuição por status + próximas parcelas */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">OS por status</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/ordens-servico">
                Ver todas <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {distribuicao.map(({ status, meta, total }) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-40 shrink-0">
                  <StatusBadge label={meta.label} color={meta.color} />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(total / maxTotal) * 100}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">
                  {total}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[12px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Próximas parcelas</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/pagamentos">
                Ver todas <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximasParcelas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma parcela pendente.</p>
            )}
            {proximasParcelas.map(({ pagamento, parcela }) => {
              const tutor = tutorDe(pagamento.tutorId);
              return (
                <div
                  key={`${pagamento.id}-${parcela.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {tutor?.nome ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pagamento.numero} • parc. {parcela.numero} • venc.{" "}
                      {formatDate(parcela.vencimento)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatBRL(parcela.valor)}
                    </span>
                    <StatusBadge
                      label={parcela.status === "atrasado" ? "Atrasado" : "Pendente"}
                      tone={parcela.status === "atrasado" ? "error" : "warning"}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* OS recentes */}
      <Card className="mt-6 rounded-[12px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">OS recentes</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/ordens-servico">
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Atualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {osRecentes.map((os) => {
                  const tutor = tutorDe(os.tutorId);
                  const pet = petDe(os.petId);
                  const meta = STATUS_OS_META[os.status];
                  return (
                    <TableRow key={os.id}>
                      <TableCell className="font-medium">{os.numero}</TableCell>
                      <TableCell>{tutor?.nome ?? "—"}</TableCell>
                      <TableCell>{pet?.nome ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} color={meta.color} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(os.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(os.atualizadoEm)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* TODO(api): substituir mocks por chamadas reais via createServerFn + TanStack Query. */}
        </CardContent>
      </Card>
    </>
  );
}