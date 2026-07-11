import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PawPrint, Receipt } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
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
import { getContrato, gerarCobrancaContrato } from "@/lib/api/contratos.functions";
import { listPagamentos } from "@/lib/api/pagamentos.functions";
import { listTutores } from "@/lib/api/tutores.functions";
import { listPets } from "@/lib/api/pets.functions";
import { listEspecies, listModalidades } from "@/lib/api/lookups.functions";
import { listServicosProdutos } from "@/lib/api/servicos-produtos.functions";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { StatusParcela } from "@/types/pagamento";

const STATUS_PARC: Record<
  StatusParcela,
  { label: string; tone: "warning" | "success" | "error" | "neutral" }
> = {
  pendente: { label: "Pendente", tone: "warning" },
  pago: { label: "Pago", tone: "success" },
  atrasado: { label: "Atrasado", tone: "error" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

export const Route = createFileRoute("/_app/contratos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Contrato ${params.id} — +QAmigo` }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const c = await getContrato({ data: { id: params.id } }).catch(() => null);
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
  const queryClient = useQueryClient();
  const { data: c } = useQuery({
    queryKey: ["contratos", contratoId],
    queryFn: () => getContrato({ data: { id: contratoId } }),
  });
  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: () => listPagamentos(),
  });
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: todosPets = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
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

  const cobrancaMutation = useMutation({
    mutationFn: () => gerarCobrancaContrato({ data: { contratoId } }),
    onSuccess: (novo) => {
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      toast.success(`Cobrança ${novo.numero} gerada.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao gerar cobrança."),
  });

  if (!c) return null;

  const tutor = tutores.find((t) => t.id === c.tutorId);
  const modalidade = modalidades.find((m) => m.id === c.modalidadeId);
  const pets = c.petsIds
    .map((id) => todosPets.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const servicos = c.servicosIds
    .map((id) => servicosProdutos.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);
  const cobrancas = pagamentos.filter((p) => p.contratoId === c.id);

  function handleGerarCobranca() {
    if (cobrancaMutation.isPending) return;
    cobrancaMutation.mutate();
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
              <Button
                onClick={handleGerarCobranca}
                disabled={c.status !== "ativo" || cobrancaMutation.isPending}
              >
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
                label={
                  c.status === "ativo"
                    ? "Ativo"
                    : c.status === "suspenso"
                      ? "Suspenso"
                      : "Encerrado"
                }
                tone={
                  c.status === "ativo" ? "success" : c.status === "suspenso" ? "warning" : "neutral"
                }
              />
            </Field>
            <Field label="Modalidade">{modalidade?.nome ?? "—"}</Field>
            <Field label="Mensalidade">{formatBRL(c.valorMensal)}</Field>
            <Field label="Periodicidade" className="capitalize">
              {c.periodicidade}
            </Field>
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
                      {especies.find((e) => e.id === p.especieId)?.nome} • {p.pesoKg} kg
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
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(par.valor)}
                      </TableCell>
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
