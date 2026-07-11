import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status/StatusBadge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useDataStore } from "@/store/dataStore";
import { useMockData, findTutor, findPagamento, findOS, findContrato } from "@/hooks/useMockData";
import { listTutores } from "@/lib/api/tutores.functions";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { MetodoPagamento, StatusParcela, StatusPagamento } from "@/types/pagamento";

const STATUS_PAG: Record<StatusPagamento, { label: string; tone: "warning" | "info" | "success" | "neutral" }> = {
  aberto: { label: "Em aberto", tone: "warning" },
  parcial: { label: "Parcial", tone: "info" },
  quitado: { label: "Quitado", tone: "success" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};
const STATUS_PARC: Record<StatusParcela, { label: string; tone: "warning" | "success" | "error" | "neutral" }> = {
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
  loader: ({ params }) => {
    const p = findPagamento(params.id);
    if (!p) throw notFound();
    return { pagamentoId: p.id };
  },
  notFoundComponent: () => (
    <>
      <PageHeader title="Pagamento não encontrado" />
      <Button asChild variant="outline">
        <Link to="/pagamentos"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
      </Button>
    </>
  ),
  component: PagamentoDetalhe,
});

function PagamentoDetalhe() {
  const { pagamentoId } = Route.useLoaderData();
  // re-resolve a cada render para refletir overrides do store
  useMockData();
  const { data: tutoresDb = [] } = useQuery({
    queryKey: ["tutores"],
    queryFn: () => listTutores(),
  });
  const pag = findPagamento(pagamentoId)!;
  // Pagamentos antigos (mock) referenciam ids dos mocks; os novos referenciam ids do banco.
  const tutor = tutoresDb.find((t) => t.id === pag.tutorId) ?? findTutor(pag.tutorId);
  const os = pag.ordemServicoId ? findOS(pag.ordemServicoId) : undefined;
  const contrato = pag.contratoId ? findContrato(pag.contratoId) : undefined;
  const meta = STATUS_PAG[pag.status];
  const darBaixa = useDataStore((s) => s.darBaixaParcela);
  const [metodos, setMetodos] = useState<Record<string, MetodoPagamento>>({});

  function handleBaixa(parcelaId: string) {
    const metodo = metodos[parcelaId] ?? "pix";
    darBaixa(pag.id, parcelaId, metodo, pag);
    toast.success("Parcela baixada.");
    // TODO(api): registrar baixa via createServerFn.
  }

  return (
    <>
      <PageHeader
        title={pag.numero}
        description={`Tutor: ${tutor?.nome ?? "—"}`}
        actions={
          <Button asChild variant="outline">
            <Link to="/pagamentos"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Status">
              <StatusBadge label={meta.label} tone={meta.tone} />
            </Row>
            <Row label="Valor total">{formatBRL(pag.valorTotal)}</Row>
            <Row label="Origem">{pag.origem === "ordem_servico" ? "Ordem de serviço" : "Contrato"}</Row>
            {os && (
              <Row label="OS vinculada">
                <Link to="/ordens-servico/$id" params={{ id: os.id }} className="text-primary hover:underline font-mono text-xs">
                  {os.numero}
                </Link>
              </Row>
            )}
            {contrato && (
              <Row label="Contrato vinculado">
                <Link to="/contratos/$id" params={{ id: contrato.id }} className="text-primary hover:underline font-mono text-xs">
                  {contrato.numero}
                </Link>
              </Row>
            )}
            <Row label="Criado em">{formatDate(pag.criadoEm)}</Row>
            <Row label="Próximo vencimento">
              {pag.parcelas.find((p) => p.status !== "pago" && p.status !== "cancelado")?.vencimento
                ? formatDate(pag.parcelas.find((p) => p.status !== "pago" && p.status !== "cancelado")!.vencimento)
                : "—"}
            </Row>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Parcelas ({pag.parcelas.length})</CardTitle></CardHeader>
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
                      <TableCell className="text-right tabular-nums">{formatBRL(par.valor)}</TableCell>
                      <TableCell><StatusBadge label={m.label} tone={m.tone} /></TableCell>
                      <TableCell className="text-muted-foreground">{par.pagaEm ? formatDate(par.pagaEm) : "—"}</TableCell>
                      <TableCell>
                        {pagavel && (
                          <RoleGuard permission="pagamento.registrar_recebimento">
                            <div className="flex items-center gap-2">
                              <Select
                                value={metodos[par.id] ?? "pix"}
                                onValueChange={(v) => setMetodos((m) => ({ ...m, [par.id]: v as MetodoPagamento }))}
                              >
                                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {METODOS.map((x) => (
                                    <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => handleBaixa(par.id)}>Dar baixa</Button>
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