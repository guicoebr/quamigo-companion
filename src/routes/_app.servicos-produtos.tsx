import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
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
import { useMockData } from "@/hooks/useMockData";
import { formatBRL } from "@/lib/formatters";

export const Route = createFileRoute("/_app/servicos-produtos")({
  head: () => ({ meta: [{ title: "Serviços e produtos — +QAmigo" }] }),
  component: ServicosProdutosPage,
});

function ServicosProdutosPage() {
  const { servicosProdutos } = useMockData();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string>("todos");

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return servicosProdutos.filter((s) => {
      const matchTexto = !t || s.nome.toLowerCase().includes(t);
      const matchTipo = tipo === "todos" || s.tipo === tipo;
      return matchTexto && matchTipo;
    });
  }, [servicosProdutos, busca, tipo]);

  return (
    <>
      <PageHeader
        title="Serviços e produtos"
        description={`${filtrados.length} de ${servicosProdutos.length} item(ns) no catálogo.`}
        actions={
          <RoleGuard permission="servico.gerenciar">
            <Button disabled title="Cadastro disponível em bloco futuro">
              <Plus className="mr-2 h-4 w-4" /> Novo item
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
                placeholder="Buscar por nome"
                className="pl-9"
              />
            </div>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="servico">Serviços</SelectItem>
                <SelectItem value="produto">Produtos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="capitalize">{s.tipo}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(s.preco)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={s.ativo ? "Ativo" : "Inativo"}
                        tone={s.ativo ? "success" : "neutral"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* TODO(api): CRUD via createServerFn. */}
        </CardContent>
      </Card>
    </>
  );
}