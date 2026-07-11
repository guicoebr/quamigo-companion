import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status/StatusBadge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { listTutores } from "@/lib/api/tutores.functions";
import { darBaixaParcela, getPagamento } from "@/lib/api/pagamentos.functions";
import { getOS } from "@/lib/api/ordens-servico.functions";
import { getContrato } from "@/lib/api/contratos.functions";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { MetodoPagamento, StatusParcela, StatusPagamento } from "@/types/pagamento";

const STATUS_PAG: Record<
  StatusPagamento,
  { label: string; tone: "warning" | "info" | "success" | "neutral" }
> = {
  aberto: { label: "Em aberto", tone: "warning" },
  parcial: { label: "Parcial", tone: "info" },
  quitado: { label: "Quitado", tone: "success" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};
const STATUS_PARC: Record<
  StatusParcela,
  { label: string; tone: "warning" | "success" | "error" | "neutral" }
> = {
  pendente: { label: "Pendente", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  atrasado: { label: "Atrasado", tone: "error" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};
const METODOS: Array<{ value: MetodoPagamento; label: string }> = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão crédito" },
  { value: "cartao_debito", label: "Cartão débito" },
  { value: "boleto", label: "Boleto" },
];

export const Route = createFileRoute("/_app/pagamentos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Pagamento ${params.id} — +QAmigo` }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const p = await getPagamento({ data: { id: params.id } }).catch(() => null);
    if (!p) throw notFound();
    return { pagamentoId: p.id };
  },
  notFoundComponent: () => (
    <>
      <PageHeader title="Pagamento não encontrado" />
      <Button asChild variant="outline">
        <Link to="/pagamentos">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>
    </>
  ),
  component: PagamentoDetalhe,
});

function PagamentoDetalhe() {
  const { pagamentoId } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { data: pag } = useQuery({
    queryKey: ["pagamentos", pagamentoId],
    queryFn: () => getPagamento({ data: { id: pagamentoId } }),
  });
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: os } = useQuery({
    queryKey: ["ordens-servico", pag?.ordemServicoId],
    queryFn: () => getOS({ data: { id: pag!.ordemServicoId! } }),
    enabled: !!pag?.ordemServicoId,
  });
  const { data: contrato } = useQuery({
    queryKey: ["contratos", pag?.contratoId],
    queryFn: () => getContrato({ data: { id: pag!.contratoId! } }),
    enabled: !!pag?.contratoId,
  });
  const [metodos, setMetodos] = useState<Record<string, MetodoPagamento>>({});

  const baixaMutation = useMutation({
    mutationFn: (parcelaId: string) =>
      darBaixaParcela({
        data: { pagamentoId, parcelaId, metodo: metodos[parcelaId] ?? "pix" },
      }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(["pagamentos", pagamentoId], atualizado);
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      toast.success("Parcela baixada.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao dar baixa."),
  });

  if (!pag) return null;
  const tutor = tutores.find((t) => t.id === pag.tutorId);
  const meta = STATUS_PAG[pag.status];

  function handleBaixa(parcelaId: string) {
    if (baixaMutation.isPending) return;
    baixaMutation.mutate(parcelaId);
  }

  return (
    <>
      <PageHeader
        title={pag.numero}
        description={`Tutor: ${tutor?.nome ?? "—"}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/pagamentos">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Status">
              <StatusBadge label={meta.label} tone={meta.tone} />
            </Row>
            <Row label="Valor total">{formatBRL(pag.valorTotal)}</Row>
            <Row label="Origem">
              {pag.origem === "ordem_servico" ? "Ordem de serviço" : "Contrato"}
            </Row>
            {os && (
              <Row label="OS vinculada">
                <Link
                  to="/ordens-servico/$id"
                  params={{ id: os.id }}
                  className="text-primary hover:underline font-mono text-xs"
                >
                  {os.numero}
                </Link>
              </Row>
            )}
            {contrato && (
              <Row label="Contrato vinculado">
                <Link
                  to="/contratos/$id"
                  params={{ id: contrato.id }}
                  className="text-primary hover:underline font-mono text-xs"
                >
                  {contrato.numero}
                </Link>
              </Row>
            )}
            <Row label="Criado em">{formatDate(pag.criadoEm)}</Row>
            <Row label="Próximo vencimento">
              {pag.parcelas.find((p) => p.status !== "pago" && p.status !== "cancelado")?.vencimento
                ? formatDate(
                    pag.parcelas.find((p) => p.status !== "pago" && p.status !== "cancelado")!
                      .vencimento,
                  )
                : "—"}
            </Row>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Parcelas ({pag.parcelas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paga em</TableHead>
                  <TableHead className="w-72">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pag.parcelas.map((par) => {
                  const m = STATUS_PARC[par.status];
                  const pagavel = par.status !== "pago" && par.status !== "cancelado";
                  return (
                    <TableRow key={par.id}>
                      <TableCell className="font-medium">{par.numero}</TableCell>
                      <TableCell>{formatDate(par.vencimento)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(par.valor)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={m.label} tone={m.tone} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {par.pagaEm ? formatDate(par.pagaEm) : "—"}
                      </TableCell>
                      <TableCell>
                        {pagavel && (
                          <RoleGuard permission="pagamento.registrar_recebimento">
                            <div className="flex items-center gap-2">
                              <Select
                                value={metodos[par.id] ?? "pix"}
                                onValueChange={(v) =>
                                  setMetodos((m) => ({ ...m, [par.id]: v as MetodoPagamento }))
                                }
                              >
                                <SelectTrigger className="h-8 w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {METODOS.map((x) => (
                                    <SelectItem key={x.value} value={x.value}>
                                      {x.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                disabled={baixaMutation.isPending}
                                onClick={() => handleBaixa(par.id)}
                              >
                                Dar baixa
                              </Button>
                            </div>
                          </RoleGuard>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
