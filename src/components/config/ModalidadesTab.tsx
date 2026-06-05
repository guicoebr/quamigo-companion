import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Power } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status/StatusBadge";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useMockData } from "@/hooks/useMockData";
import { useDataStore } from "@/store/dataStore";
import type { ModalidadeServico } from "@/types/lookup";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório."),
  descricao: z.string().optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

export function ModalidadesTab() {
  const { modalidades } = useMockData();
  const addModalidade = useDataStore((s) => s.addModalidade);
  const updateModalidade = useDataStore((s) => s.updateModalidade);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<ModalidadeServico | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  function onSubmit(v: Values) {
    if (editando) {
      updateModalidade(editando.id, { nome: v.nome, descricao: v.descricao || undefined });
      toast.success("Modalidade atualizada.");
    } else {
      addModalidade({ id: `mod-new-${Date.now()}`, nome: v.nome, descricao: v.descricao || undefined, ativo: true });
      toast.success("Modalidade criada.");
    }
    setAberto(false);
  }

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Modalidades de serviço ({modalidades.length})</h3>
          <RoleGuard permission="config.gerenciar">
            <Button size="sm" onClick={() => { setEditando(null); reset({ nome: "", descricao: "" }); setAberto(true); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nova
            </Button>
          </RoleGuard>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modalidades.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell className="text-muted-foreground">{m.descricao ?? "—"}</TableCell>
                <TableCell><StatusBadge label={m.ativo ? "Ativa" : "Inativa"} tone={m.ativo ? "success" : "neutral"} /></TableCell>
                <TableCell>
                  <RoleGuard permission="config.gerenciar">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditando(m); reset({ nome: m.nome, descricao: m.descricao ?? "" }); setAberto(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { updateModalidade(m.id, { ativo: !m.ativo }); toast.success(m.ativo ? "Inativada." : "Reativada."); }}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </RoleGuard>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editando ? "Editar modalidade" : "Nova modalidade"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="text-xs">Nome*</Label>
              <Input {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Textarea rows={3} {...register("descricao")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}