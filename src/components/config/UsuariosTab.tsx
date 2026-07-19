import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { listUsuarios, createUsuario, updateUsuario } from "@/lib/api/usuarios.functions";
import { ROLE_LABEL, ALL_ROLES, type Role, type UsuarioAdmin } from "@/types/auth";
import { formatDate } from "@/lib/formatters";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório."),
  email: z.string().email("E-mail inválido."),
  role: z.enum(["admin", "operacional", "financeiro", "recepcao"]),
  senha: z
    .string()
    .refine((v) => v === "" || v.length >= 6, { message: "Senha com pelo menos 6 caracteres." }),
});
type FormValues = z.infer<typeof schema>;

export function UsuariosTab() {
  const queryClient = useQueryClient();
  const { data: usuarios = [] } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listUsuarios(),
  });
  const [busca, setBusca] = useState("");
  const [roleFiltro, setRoleFiltro] = useState<string>("todos");
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const [aberto, setAberto] = useState(false);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  const mensagemDe = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

  const salvarMutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (editando) {
        return updateUsuario({
          data: {
            id: editando.id,
            patch: {
              nome: values.nome,
              email: values.email,
              role: values.role,
              ...(values.senha && { novaSenha: values.senha }),
            },
          },
        });
      }
      return createUsuario({
        data: { nome: values.nome, email: values.email, role: values.role, senha: values.senha },
      });
    },
    onSuccess: () => {
      invalidar();
      toast.success(editando ? "Usuário atualizado." : "Usuário criado.");
      setAberto(false);
    },
    onError: (e) => toast.error(mensagemDe(e, "Erro ao salvar usuário.")),
  });

  const toggleMutation = useMutation({
    mutationFn: (u: UsuarioAdmin) =>
      updateUsuario({ data: { id: u.id, patch: { ativo: !u.ativo } } }),
    onSuccess: (atualizado) => {
      invalidar();
      toast.success(atualizado.ativo ? "Usuário reativado." : "Usuário inativado.");
    },
    onError: (e) => toast.error(mensagemDe(e, "Erro ao alterar status.")),
  });

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      const matchTxt = !t || u.nome.toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
      const matchRole = roleFiltro === "todos" || u.role === roleFiltro;
      return matchTxt && matchRole;
    });
  }, [usuarios, busca, roleFiltro]);

  function abrirNovo() {
    setEditando(null);
    setAberto(true);
  }
  function abrirEditar(u: UsuarioAdmin) {
    setEditando(u);
    setAberto(true);
  }

  function handleSubmit(values: FormValues) {
    if (!editando && !values.senha) {
      toast.error("Informe a senha do novo usuário.");
      return;
    }
    salvarMutation.mutate(values);
  }

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="usu-busca" className="text-xs font-medium text-muted-foreground">
              Busca
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="usu-busca"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1 sm:w-52">
            <Label htmlFor="usu-papel" className="text-xs font-medium text-muted-foreground">
              Papel
            </Label>
            <Select value={roleFiltro} onValueChange={setRoleFiltro}>
              <SelectTrigger id="usu-papel">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os papéis</SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <RoleGuard permission="config.gerenciar">
            <Button className="sm:self-end" onClick={abrirNovo}>
              <Plus className="mr-2 h-4 w-4" /> Novo usuário
            </Button>
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
                  <StatusBadge
                    label={u.ativo ? "Ativo" : "Inativo"}
                    tone={u.ativo ? "success" : "neutral"}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(u.criadoEm)}</TableCell>
                <TableCell>
                  <RoleGuard permission="config.gerenciar">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => abrirEditar(u)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(u)}
                        aria-label={u.ativo ? "Inativar" : "Reativar"}
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
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <UsuarioDialog
        open={aberto}
        onOpenChange={setAberto}
        editando={editando}
        salvando={salvarMutation.isPending}
        onSubmit={handleSubmit}
      />
    </Card>
  );
}

function UsuarioDialog({
  open,
  onOpenChange,
  editando,
  salvando,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editando: UsuarioAdmin | null;
  salvando: boolean;
  onSubmit: (v: FormValues) => void;
}) {
  const defaults = (u: UsuarioAdmin | null): FormValues =>
    u
      ? { nome: u.nome, email: u.email, role: u.role, senha: "" }
      : { nome: "", email: "", role: "operacional", senha: "" };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(editando),
  });

  // A abertura é programática (o Radix não dispara onOpenChange nesse caso),
  // então o reset para os dados do usuário em edição precisa ser via efeito.
  useEffect(() => {
    if (open) reset(defaults(editando));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editando]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </DialogHeader>
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
            <Select value={watch("role")} onValueChange={(v) => setValue("role", v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">
              {editando ? "Nova senha (deixe em branco para manter)" : "Senha*"}
            </Label>
            <Input type="password" autoComplete="new-password" {...register("senha")} />
            {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
