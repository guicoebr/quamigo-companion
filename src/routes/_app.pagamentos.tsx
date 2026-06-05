import { Fragment, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useMockData, findTutor } from "@/hooks/useMockData";
import { formatBRL, formatDate } from "@/lib/formatters";
import { toast } from "sonner";
import { Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import type {
  StatusPagamento,
  StatusParcela,
  MetodoPagamento,
} from "@/types/pagamento";

const STATUS_PAG_LABEL: Record<StatusPagamento, { label: string; tone: "warning" | "info" | "success" | "neutral" }> = {
  aberto: { label: "Em aberto", tone: "warning" },
  parcial: { label: "Parcial", tone: "info" },
  quitado: { label: "Quitado", tone: "success" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

const STATUS_PARC_LABEL: Record<StatusParcela, { label: string; tone: "warning" | "success" | "error" | "neutral" }> = {
  pendente: { label: "Pendente", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  atrasado: { label: "Atrasado", tone: "error" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

const METODO_LABEL: Record<MetodoPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartão crédito",
  cartao_debito: "Cartão débito",
  boleto: "Boleto",
};

export const Route = createFileRoute("/_app/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — +QAmigo" }] }),
  component: PagamentosPage,
});

function PagamentosPage() {
  const { pagamentos, ordensServico, contratos } = useMockData();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [origemFiltro, setOrigemFiltro] = useState<string>("todas");
  const [aberto, setAberto] = useState<string | null>(null);

  const totais = useMemo(() => {
    const todasParcelas = pagamentos.flatMap((p) => p.parcelas);
    return {
      aReceber: todasParcelas
        .filter((par) => par.status === "pendente" || par.status === "atrasado")
        .reduce((a, x) => a + x.valor, 0),
      atrasadas: todasParcelas.filter((par) => par.status === "atrasado").length,
      recebido: todasParcelas
        .filter((par) => par.status === "pago")
        .reduce((a, x) => a + x.valor, 0),
    };
  }, [pagamentos]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return pagamentos
      .filter((p) => {
        const tutor = findTutor(p.tutorId);
        const matchTexto =
          !t ||
          p.numero.toLowerCase().includes(t) ||
          (tutor?.nome.toLowerCase().includes(t) ?? false);
        const matchStatus = statusFiltro === "todos" || p.status === statusFiltro;
        const matchOrigem = origemFiltro === "todas" || p.origem === origemFiltro;
        return matchTexto && matchStatus && matchOrigem;
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [pagamentos, busca, statusFiltro, origemFiltro]);

  function vinculo(p: (typeof pagamentos)[number]) {
    if (p.origem === "ordem_servico" && p.ordemServicoId) {
      const os = ordensServico.find((o) => o.id === p.ordemServicoId);
      return os?.numero ?? p.ordemServicoId;
    }
    if (p.origem === "contrato" && p.contratoId) {
      const c = contratos.find((c) => c.id === p.contratoId);
      return c?.numero ?? p.contratoId;
    }
    return "—";
  }

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description={`${filtrados.length} de ${pagamentos.length} registro(s).`}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="A receber" value={formatBRL(totais.aReceber)} icon={Wallet} tone="warning" />
        <StatCard label="Parcelas atrasadas" value={totais.atrasadas} icon={AlertTriangle} tone="error" />
        <StatCard label="Total recebido" value={formatBRL(totais.recebido)} icon={CheckCircle2} tone="success" />
      </div>

      <Card className="rounded-[12px]">
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por número ou tutor"
                className="pl-9"
              />
            </div>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(STATUS_PAG_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as origens</SelectItem>
                <SelectItem value="ordem_servico">Ordem de serviço</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => {
                  const tutor = findTutor(p.tutorId);
                  const meta = STATUS_PAG_LABEL[p.status];
                  const expandido = aberto === p.id;
                  return (
                    <Fragment key={p.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setAberto(expandido ? null : p.id)}
                      >
                        <TableCell>
                          {expandido ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{p.numero}</TableCell>
                        <TableCell>
                          {tutor ? (
                            <Link
                              to="/tutores/$id"
                              params={{ id: tutor.id }}
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {tutor.nome}
                            </Link>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {p.origem === "ordem_servico" ? "OS" : "Contrato"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{vinculo(p)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatBRL(p.valorTotal)}</TableCell>
                        <TableCell>
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(p.criadoEm)}</TableCell>
                      </TableRow>
                      {expandido && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={8} className="p-4">
                            <ParcelasTable parcelas={p.parcelas} pagamentoId={p.id} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum pagamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* TODO(api): listagem real + ações de baixa via createServerFn. */}
        </CardContent>
      </Card>
    </>
  );
}

function ParcelasTable({
  parcelas,
  pagamentoId,
}: {
  parcelas: Array<{
    id: string;
    numero: number;
    valor: number;
    vencimento: string;
    status: StatusParcela;
    pagaEm?: string;
    metodo?: MetodoPagamento;
  }>;
  pagamentoId: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Parcelas</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Paga em</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcelas.map((par) => {
            const meta = STATUS_PARC_LABEL[par.status];
            return (
              <TableRow key={par.id}>
                <TableCell className="font-medium">{par.numero}</TableCell>
                <TableCell>{formatDate(par.vencimento)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatBRL(par.valor)}</TableCell>
                <TableCell>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </TableCell>
                <TableCell>{par.metodo ? METODO_LABEL[par.metodo] : "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {par.pagaEm ? formatDate(par.pagaEm) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {par.status !== "pago" && par.status !== "cancelado" && (
                    <RoleGuard permission="pagamento.registrar_recebimento">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast.info(
                            `Baixa da parcela ${par.numero} do ${pagamentoId} (mock — backend pendente).`,
                          )
                        }
                      >
                        Dar baixa
                      </Button>
                    </RoleGuard>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}