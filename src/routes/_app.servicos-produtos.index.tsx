import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Pencil, Power } from "lucide-react";
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
import {
  listServicosProdutos,
  updateServicoProduto,
} from "@/lib/api/servicos-produtos.functions";
import type { ServicoProduto } from "@/types/lookup";
import { formatBRL } from "@/lib/formatters";

export const Route = createFileRoute("/_app/servicos-produtos/")({
  head: () => ({ meta: [{ title: "Serviços e produtos — +QAmigo" }] }),
  component: ServicosProdutosPage,
});

function ServicosProdutosPage() {
  const queryClient = useQueryClient();
  const { data: servicosProdutos = [] } = useQuery({
    queryKey: ["servicos-produtos"],
    queryFn: () => listServicosProdutos(),
  });
  const toggleAtivo = useMutation({
    mutationFn: (s: ServicoProduto) =>
      updateServicoProduto({ data: { id: s.id, patch: { ativo: !s.ativo } } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servicos-produtos"] }),
  });
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string>("todos");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return servicosProdutos.filter((s) => {
      const matchTexto = !t || s.nome.toLowerCase().includes(t);
      const matchTipo = tipo === "todos" || s.tipo === tipo;
      const matchStatus =
        statusFiltro === "todos" ||
        (statusFiltro === "ativo" && s.ativo) ||
        (statusFiltro === "inativo" && !s.ativo);
      return matchTexto && matchTipo && matchStatus;
    });
  }, [servicosProdutos, busca, tipo, statusFiltro]);

  return (
    <>
      <PageHeader
        title="Serviços e produtos"
        description={`${filtrados.length} de ${servicosProdutos.length} item(ns) no catálogo.`}
        actions={
          <RoleGuard permission="servico.gerenciar">
            <Button asChild>
              <Link to="/servicos-produtos/novo">
                <Plus className="mr-2 h-4 w-4" /> Novo item
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
              <Label htmlFor="sp-busca" className="text-xs font-medium text-muted-foreground">
                Busca
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="sp-busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1 sm:w-44">
              <Label htmlFor="sp-tipo" className="text-xs font-medium text-muted-foreground">
                Tipo
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="sp-tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="servico">Serviços</SelectItem>
                  <SelectItem value="produto">Produtos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:w-44">
              <Label htmlFor="sp-status" className="text-xs font-medium text-muted-foreground">
                Status
              </Label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger id="sp-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28"></TableHead>
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
                    <TableCell>
                      <RoleGuard permission="servico.gerenciar">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" aria-label="Editar">
                            <Link to="/servicos-produtos/$id/editar" params={{ id: s.id }}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={s.ativo ? "Inativar" : "Reativar"}
                            onClick={() =>
                              toggleAtivo.mutate(s, {
                                onSuccess: () => toast.success(s.ativo ? "Item inativado." : "Item reativado."),
                                onError: () => toast.error("Não foi possível atualizar o item."),
                              })
                            }
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </RoleGuard>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum item encontrado.
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