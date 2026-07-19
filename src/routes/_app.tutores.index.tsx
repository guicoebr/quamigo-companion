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
import { listTutores } from "@/lib/api/tutores.functions";
import { listPets } from "@/lib/api/pets.functions";
import { listOS } from "@/lib/api/ordens-servico.functions";
import { formatCidadeUf, formatCPF, formatTelefone } from "@/lib/formatters";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_app/tutores/")({
  head: () => ({ meta: [{ title: "Tutores — +QAmigo" }] }),
  component: TutoresPage,
});

function TutoresPage() {
  const { data: tutores = [] } = useQuery({ queryKey: ["tutores"], queryFn: () => listTutores() });
  const { data: pets = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
  const { data: ordensServico = [] } = useQuery({
    queryKey: ["ordens-servico"],
    queryFn: () => listOS(),
  });
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState<string>("todas");

  const ufs = useMemo(
    () => Array.from(new Set(tutores.map((t) => t.endereco.uf))).sort(),
    [tutores],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return tutores.filter((t) => {
      const matchTexto =
        !termo ||
        t.nome.toLowerCase().includes(termo) ||
        t.email.toLowerCase().includes(termo) ||
        t.cpf.includes(termo.replace(/\D/g, "")) ||
        t.telefone.includes(termo.replace(/\D/g, ""));
      const matchUf = uf === "todas" || t.endereco.uf === uf;
      return matchTexto && matchUf;
    });
  }, [tutores, busca, uf]);

  return (
    <>
      <PageHeader
        title="Tutores"
        description={`${filtrados.length} de ${tutores.length} tutor(es).`}
        actions={
          <RoleGuard roles={["admin", "operacional", "recepcao"]}>
            <Button asChild>
              <Link to="/tutores/novo">
                <Plus className="mr-2 h-4 w-4" /> Novo tutor
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
              <Label htmlFor="tut-busca" className="text-xs font-medium text-muted-foreground">
                Busca
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="tut-busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, CPF, e-mail ou telefone"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1 sm:w-40">
              <Label htmlFor="tut-uf" className="text-xs font-medium text-muted-foreground">
                UF
              </Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger id="tut-uf">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as UFs</SelectItem>
                  {ufs.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>


          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade / UF</TableHead>
                  <TableHead className="text-center">Pets</TableHead>
                  <TableHead className="text-center">OS</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((t) => {
                  const petsDoEsteTutor = pets.filter((p) => p.tutorId === t.id);
                  const oss = ordensServico.filter((os) => os.tutorId === t.id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell className="tabular-nums">{formatCPF(t.cpf)}</TableCell>
                      <TableCell className="tabular-nums">{formatTelefone(t.telefone)}</TableCell>
                      <TableCell>
                        {formatCidadeUf(t.endereco.cidade, t.endereco.uf)}
                      </TableCell>
                      <TableCell className="text-center">{petsDoEsteTutor.length}</TableCell>
                      <TableCell className="text-center">{oss.length}</TableCell>
                      <TableCell>
                        <Button asChild size="icon" variant="ghost">
                          <Link
                            to="/tutores/$id"
                            params={{ id: t.id }}
                            aria-label={`Ver ${t.nome}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhum tutor encontrado.
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
