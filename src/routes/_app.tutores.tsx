import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Plus, Eye } from "lucide-react";
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
import { useMockData, petsDoTutor, osDoTutor } from "@/hooks/useMockData";
import { formatCPF, formatTelefone } from "@/lib/formatters";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_app/tutores")({
  head: () => ({ meta: [{ title: "Tutores — +QAmigo" }] }),
  component: TutoresPage,
});

function TutoresPage() {
  const { tutores } = useMockData();
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
          <RoleGuard allowed={["admin", "operacional", "recepcao"]}>
            <Button disabled title="Cadastro disponível em bloco futuro">
              <Plus className="mr-2 h-4 w-4" /> Novo tutor
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
                placeholder="Buscar por nome, CPF, e-mail ou telefone"
                className="pl-9"
              />
            </div>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger className="sm:w-40">
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
                  const pets = petsDoTutor(t.id);
                  const oss = osDoTutor(t.id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell className="tabular-nums">{formatCPF(t.cpf)}</TableCell>
                      <TableCell className="tabular-nums">{formatTelefone(t.telefone)}</TableCell>
                      <TableCell>
                        {t.endereco.cidade} / {t.endereco.uf}
                      </TableCell>
                      <TableCell className="text-center">{pets.length}</TableCell>
                      <TableCell className="text-center">{oss.length}</TableCell>
                      <TableCell>
                        <Button asChild size="icon" variant="ghost">
                          <Link to="/tutores/$id" params={{ id: t.id }} aria-label={`Ver ${t.nome}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum tutor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* TODO(api): substituir por createServerFn + TanStack Query. */}
        </CardContent>
      </Card>
    </>
  );
}