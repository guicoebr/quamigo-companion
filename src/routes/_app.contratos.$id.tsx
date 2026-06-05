import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, PawPrint, Receipt } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useDataStore } from "@/store/dataStore";
import { pagamentosMock } from "@/mocks/pagamentos";
import { nextPagamentoNumber } from "@/lib/formatters";
import type { Pagamento } from "@/types/pagamento";
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
import {
  useMockData,
  findTutor,
  findPet,
  findEspecie,
  findModalidade,
  findServicoProduto,
} from "@/hooks/useMockData";
import { contratosMock } from "@/mocks/contratos";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { StatusParcela } from "@/types/pagamento";

const STATUS_PARC: Record<StatusParcela, { label: string; tone: "warning" | "success" | "error" | "neutral" }> = {
  pendente: { label: "Pendente", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  atrasado: { label: "Atrasado", tone: "error" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

export const Route = createFileRoute("/_app/contratos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Contrato ${params.id} — +QAmigo` }] }),
  loader: ({ params }) => {
    const c = contratosMock.find((x) => x.id === params.id);
    if (!c) throw notFound();
    return { contratoId: c.id };
  },
  notFoundComponent: () => (
    <>
      <PageHeader title="Contrato não encontrado" />
      <Button asChild variant="outline">
        <Link to="/contratos">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>
    </>
  ),
  component: ContratoDetalhe,
});

function ContratoDetalhe() {
  const { contratoId } = Route.useLoaderData();
  const { contratos, pagamentos } = useMockData();
  const c = contratos.find((x) => x.id === contratoId);
  if (!c) return null;

  const tutor = findTutor(c.tutorId);
  const modalidade = findModalidade(c.modalidadeId);
  const pets = c.petsIds.map(findPet).filter(Boolean) as NonNullable<ReturnType<typeof findPet>>[];
  const servicos = c.servicosIds.map(findServicoProduto).filter(Boolean) as NonNullable<
    ReturnType<typeof findServicoProduto>
  >[];
  const cobrancas = pagamentos.filter((p) => p.contratoId === c.id);

  function handleGerarCobranca() {
    const agora = new Date();
    const yyyy = agora.getFullYear();
    const mm = String(agora.getMonth() + 1).padStart(2, "0");
    const jaExiste = cobrancas.some((p) => {
      const d = new Date(p.criadoEm);
      return d.getFullYear() === yyyy && d.getMonth() === agora.getMonth();
    });
    if (jaExiste) {
      toast.error(`Já existe uma cobrança gerada para ${mm}/${yyyy}.`);
      return;
    }
    const numero = nextPagamentoNumber([
      ...pagamentosMock.map((p) => p.numero),
      ...useDataStore.getState().pagamentosNovos.map((p) => p.numero),
    ]);
    const venc = new Date();
    venc.setDate(venc.getDate() + 7);
    const novo: Pagamento = {
      id: `pag-new-${Date.now()}`,
      numero,
      origem: "contrato",
      contratoId: c.id,
      tutorId: c.tutorId,
      valorTotal: c.valorMensal,
      status: "aberto",
      parcelas: [
        {
          id: `par-${Date.now()}`,
          numero: 1,
          valor: c.valorMensal,
          vencimento: venc.toISOString().slice(0, 10),
          status: "pendente",
        },
      ],
      criadoEm: agora.toISOString(),
    };
    useDataStore.getState().addPagamento(novo);
    toast.success(`Cobrança ${numero} gerada.`);
    // TODO(api): substituir por createServerFn (gerarCobrancaContrato).
  }

  return (
    <>
      <PageHeader
        title={`Contrato ${c.numero}`}
        description={`Tutor: ${tutor?.nome ?? "—"} • criado em ${formatDate(c.criadoEm)}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/contratos">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <RoleGuard roles={["admin", "financeiro"]}>
              <Button onClick={handleGerarCobranca} disabled={c.status !== "ativo"}>
                <Receipt className="mr-2 h-4 w-4" /> Gerar cobrança do mês
              </Button>
            </RoleGuard>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Status">
              <StatusBadge
                label={c.status === "ativo" ? "Ativo" : c.status === "suspenso" ? "Suspenso" : "Encerrado"}
                tone={c.status === "ativo" ? "success" : c.status === "suspenso" ? "warning" : "neutral"}
              />
            </Field>
            <Field label="Modalidade">{modalidade?.nome ?? "—"}</Field>
            <Field label="Mensalidade">{formatBRL(c.valorMensal)}</Field>
            <Field label="Periodicidade" className="capitalize">{c.periodicidade}</Field>
            <Field label="Vigência">
              {formatDate(c.inicioVigencia)}
              {c.fimVigencia ? ` → ${formatDate(c.fimVigencia)}` : " → em vigência"}
            </Field>
            {c.observacoes && <Field label="Observações">{c.observacoes}</Field>}
          </CardContent>
        </Card>

        <Card className="rounded-[12px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pets cobertos ({pets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {pets.map((p) => (
                <Link
                  key={p.id}
                  to="/pets/$id"
                  params={{ id: p.id }}
                  className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-muted"
                >
                  <PawPrint className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {findEspecie(p.especieId)?.nome} • {p.pesoKg} kg
                    </p>
                  </div>
                </Link>
              ))}
              {pets.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum pet vinculado.</p>
              )}
            </div>

            <p className="mt-5 text-sm font-semibold">Serviços inclusos</p>
            <ul className="mt-2 space-y-1 text-sm">
              {servicos.map((s) => (
                <li key={s.id} className="flex justify-between border-b border-border py-1.5">
                  <span>{s.nome}</span>
                  <span className="text-muted-foreground">{formatBRL(s.preco)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-[12px]">
        <CardHeader>
          <CardTitle className="text-base">Cobranças mensais ({cobrancas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paga em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cobrancas.flatMap((p) =>
                p.parcelas.map((par) => {
                  const meta = STATUS_PARC[par.status];
                  return (
                    <TableRow key={`${p.id}-${par.id}`}>
                      <TableCell className="font-medium">
                        <Link
                          to="/pagamentos/$id"
                          params={{ id: p.id }}
                          className="text-primary hover:underline"
                        >
                          {p.numero}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(par.vencimento)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(par.valor)}</TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {par.pagaEm ? formatDate(par.pagaEm) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                }),
              )}
              {cobrancas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma cobrança gerada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* TODO(api): gerar e atualizar cobranças via createServerFn. */}
        </CardContent>
      </Card>
    </>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className={`text-foreground ${className ?? ""}`}>{children}</span>
    </div>
  );
}