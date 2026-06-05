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
import { useMockData, findEspecie } from "@/hooks/useMockData";
import { useDataStore } from "@/store/dataStore";
import type { Especie, Raca } from "@/types/lookup";

const especieSchema = z.object({ nome: z.string().min(2, "Nome obrigatório.") });
const racaSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório."),
  especieId: z.string().min(1, "Espécie obrigatória."),
});

export function EspeciesRacasTab() {
  const { especies, racas } = useMockData();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <EspeciesCard especies={especies} />
      <RacasCard racas={racas} especies={especies} />
    </div>
  );
}

function EspeciesCard({ especies }: { especies: Especie[] }) {
  const addEspecie = useDataStore((s) => s.addEspecie);
  const updateEspecie = useDataStore((s) => s.updateEspecie);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Especie | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ nome: string }>({
    resolver: zodResolver(especieSchema),
  });

  function onSubmit(v: { nome: string }) {
    if (editando) {
      updateEspecie(editando.id, { nome: v.nome });
      toast.success("Espécie atualizada.");
    } else {
      addEspecie({ id: `esp-new-${Date.now()}`, nome: v.nome, ativo: true });
      toast.success("Espécie criada.");
    }
    setAberto(false);
    reset({ nome: "" });
  }

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Espécies ({especies.length})</h3>
          <RoleGuard permission="config.gerenciar">
            <Button size="sm" onClick={() => { setEditando(null); reset({ nome: "" }); setAberto(true); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nova
            </Button>
          </RoleGuard>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {especies.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell><StatusBadge label={e.ativo ? "Ativa" : "Inativa"} tone={e.ativo ? "success" : "neutral"} /></TableCell>
                <TableCell>
                  <RoleGuard permission="config.gerenciar">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditando(e); reset({ nome: e.nome }); setAberto(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { updateEspecie(e.id, { ativo: !e.ativo }); toast.success(e.ativo ? "Inativada." : "Reativada."); }}>
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
          <DialogHeader><DialogTitle>{editando ? "Editar espécie" : "Nova espécie"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="text-xs">Nome*</Label>
              <Input {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
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

function RacasCard({ racas, especies }: { racas: Raca[]; especies: Especie[] }) {
  const addRaca = useDataStore((s) => s.addRaca);
  const updateRaca = useDataStore((s) => s.updateRaca);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Raca | null>(null);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<{ nome: string; especieId: string }>({
    resolver: zodResolver(racaSchema),
  });

  function onSubmit(v: { nome: string; especieId: string }) {
    if (editando) {
      updateRaca(editando.id, { nome: v.nome, especieId: v.especieId });
      toast.success("Raça atualizada.");
    } else {
      addRaca({ id: `raca-new-${Date.now()}`, nome: v.nome, especieId: v.especieId, ativo: true });
      toast.success("Raça criada.");
    }
    setAberto(false);
  }

  return (
    <Card className="rounded-[12px]">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Raças ({racas.length})</h3>
          <RoleGuard permission="config.gerenciar">
            <Button size="sm" onClick={() => { setEditando(null); reset({ nome: "", especieId: "" }); setAberto(true); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nova
            </Button>
          </RoleGuard>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Espécie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {racas.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome}</TableCell>
                <TableCell className="text-muted-foreground">{findEspecie(r.especieId)?.nome ?? "—"}</TableCell>
                <TableCell><StatusBadge label={r.ativo ? "Ativa" : "Inativa"} tone={r.ativo ? "success" : "neutral"} /></TableCell>
                <TableCell>
                  <RoleGuard permission="config.gerenciar">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditando(r); reset({ nome: r.nome, especieId: r.especieId }); setAberto(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { updateRaca(r.id, { ativo: !r.ativo }); toast.success(r.ativo ? "Inativada." : "Reativada."); }}>
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
          <DialogHeader><DialogTitle>{editando ? "Editar raça" : "Nova raça"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label className="text-xs">Nome*</Label>
              <Input {...register("nome")} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
            </div>
            <div>
              <Label className="text-xs">Espécie*</Label>
              <Select value={watch("especieId") || undefined} onValueChange={(v) => setValue("especieId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {especies.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.especieId && <p className="text-xs text-destructive">{errors.especieId.message}</p>}
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