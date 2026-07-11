import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, PawPrint, Search } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
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
import { useMockData, findTutor, findPet } from "@/hooks/useMockData";
import { listTutores } from "@/lib/api/tutores.functions";
import { listPets } from "@/lib/api/pets.functions";
import { STATUS_OS_FLOW, STATUS_OS_META } from "@/lib/osStatus";
import { formatBRL, formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/_app/ordens-servico/")({
  head: () => ({ meta: [{ title: "Ordens de serviço — +QAmigo" }] }),
  component: OrdensServicoPage,
});

function OrdensServicoPage() {
  const { ordensServico } = useMockData();
  const { data: tutoresDb = [] } = useQuery({
    queryKey: ["tutores"],
    queryFn: () => listTutores(),
  });
  const { data: petsDb = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  // OS antigas (mock) referenciam ids dos mocks; as novas referenciam ids do banco.
  const tutorDaOS = (id: string) => tutoresDb.find((t) => t.id === id) ?? findTutor(id);
  const petDaOS = (id: string) => petsDb.find((p) => p.id === id) ?? findPet(id);

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return ordensServico
      .filter((os) => {
        const tutor = tutorDaOS(os.tutorId);
        const pet = petDaOS(os.petId);
        const matchTexto =
          !t ||
          os.numero.toLowerCase().includes(t) ||
          (tutor?.nome.toLowerCase().includes(t) ?? false) ||
          (pet?.nome.toLowerCase().includes(t) ?? false);
        const matchStatus = statusFiltro === "todos" || os.status === statusFiltro;
        return matchTexto && matchStatus;
      })
      .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordensServico, busca, statusFiltro, tutoresDb, petsDb]);

  return (
    <>
      <PageHeader
        title="Ordens de serviço"
        description={`${filtradas.length} de ${ordensServico.length} OS.`}
        actions={
          <RoleGuard roles={["admin", "operacional"]}>
            <Button asChild>
              <Link to="/obitos/novo">
                <PawPrint className="mr-2 h-4 w-4" /> Registrar óbito
              </Link>
            </Button>
          </RoleGuard>
        }
      />

      <Card className="rounded-[12px]">
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por número, tutor ou pet"
                className="pl-9"
              />
            </div>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="sm:w-60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_OS_FLOW.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_OS_META[s].label}
                  </SelectItem>
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
                  <TableHead>Pet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Atualizada</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((os) => {
                  const meta = STATUS_OS_META[os.status];
                  return (
                    <TableRow key={os.id}>
                      <TableCell className="font-medium">{os.numero}</TableCell>
                      <TableCell>{tutorDaOS(os.tutorId)?.nome ?? "—"}</TableCell>
                      <TableCell>{petDaOS(os.petId)?.nome ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge label={meta.label} color={meta.color} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatBRL(os.total)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(os.atualizadoEm)}</TableCell>
                      <TableCell>
                        <Button asChild size="icon" variant="ghost">
                          <Link to="/ordens-servico/$id" params={{ id: os.id }} aria-label={`Ver ${os.numero}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma OS encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* TODO(api): paginação e filtros vindos do backend. */}
        </CardContent>
      </Card>
    </>
  );
}