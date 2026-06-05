import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useMockData, findEspecie } from "@/hooks/useMockData";
import { ROLE_LABEL, ALL_ROLES, type Role } from "@/types/auth";
import { formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — +QAmigo" }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { usuarios, especies, racas, modalidades } = useMockData();

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Gerencie usuários e catálogos de apoio do sistema."
      />

      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="especies">Espécies & Raças</TabsTrigger>
          <TabsTrigger value="modalidades">Modalidades</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <UsuariosTab usuarios={usuarios} />
        </TabsContent>

        <TabsContent value="especies">
          <EspeciesRacasTab especies={especies} racas={racas} />
        </TabsContent>

        <TabsContent value="modalidades">
          <ModalidadesTab modalidades={modalidades} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function UsuariosTab({ usuarios }: { usuarios: ReturnType<typeof useMockData>["usuarios"] }) {
  const [busca, setBusca] = useState("");
  const [roleFiltro, setRoleFiltro] = useState<string>("todos");

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      const matchTxt = !t || u.nome.toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
      const matchRole = roleFiltro === "todos" || u.role === roleFiltro;
      return matchTxt && matchRole;
    });
  }, [usuarios, busca, roleFiltro]);

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou email"
              className="pl-9"
            />
          </div>
          <Select value={roleFiltro} onValueChange={setRoleFiltro}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os papéis</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled title="Cadastro disponível em bloco futuro">
            <Plus className="mr-2 h-4 w-4" /> Novo usuário
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{ROLE_LABEL[u.role as Role]}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={u.ativo ? "Ativo" : "Inativo"}
                    tone={u.ativo ? "success" : "neutral"}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(u.criadoEm)}</TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* TODO(api): CRUD de usuários via createServerFn + Supabase auth.users. */}
      </CardContent>
    </Card>
  );
}

function EspeciesRacasTab({
  especies,
  racas,
}: {
  especies: ReturnType<typeof useMockData>["especies"];
  racas: ReturnType<typeof useMockData>["racas"];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="rounded-[12px]">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Espécies ({especies.length})</h3>
            <Button size="sm" disabled>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nova
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {especies.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.nome}</TableCell>
                  <TableCell>
                    <StatusBadge
                      label={e.ativo ? "Ativa" : "Inativa"}
                      tone={e.ativo ? "success" : "neutral"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-[12px]">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Raças ({racas.length})</h3>
            <Button size="sm" disabled>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nova
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Espécie</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {racas.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {findEspecie(r.especieId)?.nome ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={r.ativo ? "Ativa" : "Inativa"}
                      tone={r.ativo ? "success" : "neutral"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ModalidadesTab({
  modalidades,
}: {
  modalidades: ReturnType<typeof useMockData>["modalidades"];
}) {
  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Modalidades de serviço ({modalidades.length})</h3>
          <Button size="sm" disabled>
            <Plus className="mr-1 h-3.5 w-3.5" /> Nova
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modalidades.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell className="text-muted-foreground">{m.descricao ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={m.ativo ? "Ativa" : "Inativa"}
                    tone={m.ativo ? "success" : "neutral"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* TODO(api): CRUD via createServerFn. */}
      </CardContent>
    </Card>
  );
}