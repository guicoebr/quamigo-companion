import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Eye } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { listPets } from "@/lib/api/pets.functions";
import { listTutores } from "@/lib/api/tutores.functions";
import { listEspecies, listRacas } from "@/lib/api/lookups.functions";
import { formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/_app/pets/")({
  head: () => ({ meta: [{ title: "Pets — +QAmigo" }] }),
  component: PetsPage,
});

function PetsPage() {
  const { data: pets = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: especies = [] } = useQuery({ queryKey: ["especies"], queryFn: () => listEspecies() });
  const { data: racas = [] } = useQuery({ queryKey: ["racas"], queryFn: () => listRacas() });
  const [busca, setBusca] = useState("");
  const [especieId, setEspecieId] = useState<string>("todas");
  const [situacao, setSituacao] = useState<"todas" | "vivos" | "falecidos">("todas");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pets.filter((p) => {
      const tutor = tutores.find((t) => t.id === p.tutorId);
      const matchTexto =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        (tutor?.nome.toLowerCase().includes(termo) ?? false);
      const matchEspecie = especieId === "todas" || p.especieId === especieId;
      const matchSituacao =
        situacao === "todas" ||
        (situacao === "vivos" && !p.dataFalecimento) ||
        (situacao === "falecidos" && !!p.dataFalecimento);
      return matchTexto && matchEspecie && matchSituacao;
    });
  }, [pets, tutores, busca, especieId, situacao]);

  return (
    <>
      <PageHeader
        title="Pets"
        description={`${filtrados.length} de ${pets.length} pet(s).`}
        actions={
          <RoleGuard roles={["admin", "operacional", "recepcao"]}>
            <Button asChild>
              <Link to="/pets/novo">
                <Plus className="mr-2 h-4 w-4" /> Novo pet
              </Link>
            </Button>
          </RoleGuard>
        }
      />

      <Card className="rounded-[12px]">
        <CardContent className="p-4">
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Filtros
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="pets-busca" className="text-xs font-medium text-muted-foreground">
                Busca
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pets-busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por pet ou tutor"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1 sm:w-48">
              <Label htmlFor="pets-especie" className="text-xs font-medium text-muted-foreground">
                Espécie
              </Label>
              <Select value={especieId} onValueChange={setEspecieId}>
                <SelectTrigger id="pets-especie">
                  <SelectValue placeholder="Espécie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as espécies</SelectItem>
                  {especies.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:w-44">
              <Label htmlFor="pets-situacao" className="text-xs font-medium text-muted-foreground">
                Situação
              </Label>
              <Select value={situacao} onValueChange={(v) => setSituacao(v as typeof situacao)}>
                <SelectTrigger id="pets-situacao">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as situações</SelectItem>
                  <SelectItem value="vivos">Vivos</SelectItem>
                  <SelectItem value="falecidos">Falecidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>


          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Espécie / Raça</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead className="text-right">Peso</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => {
                  const tutor = tutores.find((t) => t.id === p.tutorId);
                  const especie = especies.find((e) => e.id === p.especieId);
                  const raca = racas.find((r) => r.id === p.racaId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>
                        {especie?.nome ?? "—"} • {raca?.nome ?? "—"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.pesoKg} kg</TableCell>
                      <TableCell>
                        {p.dataFalecimento ? (
                          <StatusBadge
                            label={`Falecido em ${formatDate(p.dataFalecimento)}`}
                            tone="neutral"
                          />
                        ) : (
                          <StatusBadge label="Vivo" tone="success" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button asChild size="icon" variant="ghost">
                          <Link to="/pets/$id" params={{ id: p.id }} aria-label={`Ver ${p.nome}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum pet encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}