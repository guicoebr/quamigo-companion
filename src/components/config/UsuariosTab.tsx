import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Power } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status/StatusBadge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useMockData } from "@/hooks/useMockData";
import { useDataStore } from "@/store/dataStore";
import { ROLE_LABEL, ALL_ROLES, type Role } from "@/types/auth";
import { formatDate } from "@/lib/formatters";
import type { UsuarioMock } from "@/mocks/usuarios";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório."),
  email: z.string().email("E-mail inválido."),
  role: z.enum(["admin", "operacional", "financeiro", "recepcao"]),
  ativo: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function UsuariosTab() {
  const { usuarios } = useMockData();
  const addUsuario = useDataStore((s) => s.addUsuario);
  const updateUsuario = useDataStore((s) => s.updateUsuario);
  const [busca, setBusca] = useState("");
  const [roleFiltro, setRoleFiltro] = useState<string>("todos");
  const [editando, setEditando] = useState<UsuarioMock | null>(null);
  const [aberto, setAberto] = useState(false);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      const matchTxt = !t || u.nome.toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
      const matchRole = roleFiltro === "todos" || u.role === roleFiltro;
      return matchTxt && matchRole;
    });
  }, [usuarios, busca, roleFiltro]);

  function abrirNovo() { setEditando(null); setAberto(true); }
  function abrirEditar(u: UsuarioMock) { setEditando(u); setAberto(true); }

  function handleSubmit(values: FormValues) {
    if (editando) {
      updateUsuario(editando.id, values);
      toast.success("Usuário atualizado.");
    } else {
      addUsuario({
        id: `u-new-${Date.now()}`,
        ...values,
        criadoEm: new Date().toISOString(),
      });
      toast.success("Usuário criado.");
    }
    setAberto(false);
    // TODO(api): CRUD via createServerFn + Supabase auth.users.
  }

  function toggleAtivo(u: UsuarioMock) {
    updateUsuario(u.id, { ativo: !u.ativo });
    toast.success(u.ativo ? "Usuário inativado." : "Usuário reativado.");
  }

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" className="pl-9" />
          </div>
          <Select value={roleFiltro} onValueChange={setRoleFiltro}>
            <SelectTrigger className="sm:w-52"><SelectValue placeholder="Papel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os papéis</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RoleGuard permission="config.gerenciar">
            <Button onClick={abrirNovo}><Plus className="mr-2 h-4 w-4" /> Novo usuário</Button>
          </RoleGuard>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{ROLE_LABEL[u.role as Role]}</TableCell>
                <TableCell>
                  <StatusBadge label={u.ativo ? "Ativo" : "Inativo"} tone={u.ativo ? "success" : "neutral"} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(u.criadoEm)}</TableCell>
                <TableCell>
                  <RoleGuard permission="config.gerenciar">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => abrirEditar(u)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => toggleAtivo(u)} aria-label={u.ativo ? "Inativar" : "Reativar"}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </RoleGuard>
                </TableCell>
              </TableRow>
            ))}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <UsuarioDialog open={aberto} onOpenChange={setAberto} editando={editando} onSubmit={handleSubmit} />
    </Card>
  );
}

function UsuarioDialog({
  open, onOpenChange, editando, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editando: UsuarioMock | null;
  onSubmit: (v: FormValues) => void;
}) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editando
      ? { nome: editando.nome, email: editando.email, role: editando.role, ativo: editando.ativo }
      : { nome: "", email: "", role: "operacional", ativo: true },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) reset(editando ? { nome: editando.nome, email: editando.email, role: editando.role, ativo: editando.ativo } : { nome: "", email: "", role: "operacional", ativo: true }); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editando ? "Editar usuário" : "Novo usuário"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label className="text-xs">Nome*</Label>
            <Input {...register("nome")} />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>
          <div>
            <Label className="text-xs">E-mail*</Label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <Label className="text-xs">Papel*</Label>
            <Select defaultValue={watch("role")} onValueChange={(v) => setValue("role", v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}