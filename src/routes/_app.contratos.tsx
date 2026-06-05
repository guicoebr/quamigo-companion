import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Plus, Search } from "lucide-react";
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
import { FileSignature, CheckCircle2 } from "lucide-react";
import type { StatusContrato } from "@/types/contrato";

const STATUS_LABEL: Record<StatusContrato, { label: string; tone: "success" | "warning" | "neutral" }> = {
  ativo: { label: "Ativo", tone: "success" },
  suspenso: { label: "Suspenso", tone: "warning" },
  encerrado: { label: "Encerrado", tone: "neutral" },
};

export const Route = createFileRoute("/_app/contratos")({
  head: () => ({ meta: [{ title: "Contratos — +QAmigo" }] }),
  component: ContratosPage,
});

function ContratosPage() {
  const { contratos } = useMockData();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  const ativos = contratos.filter((c) => c.status === "ativo");
  const receitaMensal = ativos.reduce((a, c) => a + c.valorMensal, 0);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return contratos.filter((c) => {
      const tutor = findTutor(c.tutorId);
      const matchTexto =
        !t ||
        c.numero.toLowerCase().includes(t) ||
        (tutor?.nome.toLowerCase().includes(t) ?? false);
      const matchStatus = statusFiltro === "todos" || c.status === statusFiltro;
      return matchTexto && matchStatus;
    });
  }, [contratos, busca, statusFiltro]);

  return (
    <>
      <PageHeader
        title="Contratos"
        description={`${filtrados.length} de ${contratos.length} contrato(s).`}
        actions={
          <RoleGuard roles={["admin", "financeiro"]}>
            <Button disabled title="Cadastro disponível em bloco futuro">
              <Plus className="mr-2 h-4 w-4" /> Novo contrato
            </Button>
          </RoleGuard>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Contratos ativos" value={ativos.length} icon={FileSignature} tone="success" />
        <StatCard label="Receita mensal estimada" value={formatBRL(receitaMensal)} icon={CheckCircle2} tone="primary" />
        <StatCard label="Total de contratos" value={contratos.length} />
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
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead className="text-center">Pets</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead className="text-right">Mensalidade</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((c) => {
                  const tutor = findTutor(c.tutorId);
                  const meta = STATUS_LABEL[c.status];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.numero}</TableCell>
                      <TableCell>{tutor?.nome ?? "—"}</TableCell>
                      <TableCell className="text-center">{c.petsIds.length}</TableCell>
                      <TableCell className="capitalize">{c.periodicidade}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(c.valorMensal)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(c.inicioVigencia)}
                        {c.fimVigencia ? ` → ${formatDate(c.fimVigencia)}` : ""}
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </TableCell>
                      <TableCell>
                        <Button asChild size="icon" variant="ghost">
                          <Link to="/contratos/$id" params={{ id: c.id }} aria-label={`Ver ${c.numero}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum contrato encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* TODO(api): listagem + filtros via createServerFn. */}
        </CardContent>
      </Card>
    </>
  );
}