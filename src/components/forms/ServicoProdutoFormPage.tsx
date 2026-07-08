import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams, notFound } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listServicosProdutos,
  createServicoProduto,
  updateServicoProduto,
} from "@/lib/api/servicos-produtos.functions";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório."),
  tipo: z.enum(["servico", "produto"]),
  descricao: z.string().optional().or(z.literal("")),
  preco: z.coerce.number().min(0, "Preço obrigatório."),
  ativo: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function ServicoProdutoFormPage({ mode }: { mode: "novo" | "editar" }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const { data: servicosProdutos, isLoading } = useQuery({
    queryKey: ["servicos-produtos"],
    queryFn: () => listServicosProdutos(),
    enabled: mode === "editar",
  });
  const existing =
    mode === "editar" && params.id ? servicosProdutos?.find((s) => s.id === params.id) : undefined;
  if (mode === "editar" && !isLoading && !existing) throw notFound();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: existing
      ? { nome: existing.nome, tipo: existing.tipo, descricao: existing.descricao ?? "", preco: existing.preco, ativo: existing.ativo }
      : undefined,
    defaultValues: { tipo: "servico", ativo: true, preco: 0, nome: "" },
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      nome: values.nome,
      tipo: values.tipo,
      descricao: values.descricao || undefined,
      preco: Number(values.preco),
      ativo: values.ativo,
    };
    try {
      if (mode === "editar" && existing) {
        await updateServicoProduto({ data: { id: existing.id, patch: payload } });
        toast.success("Item atualizado.");
      } else {
        await createServicoProduto({ data: payload });
        toast.success("Item criado.");
      }
      navigate({ to: "/servicos-produtos" });
    } catch {
      toast.error("Não foi possível salvar o item.");
    }
  }

  return (
    <>
      <PageHeader
        title={mode === "novo" ? "Novo item" : "Editar item"}
        actions={
          <Button asChild variant="outline">
            <Link to="/servicos-produtos">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
          </Button>
        }
      />
      <Card className="rounded-[12px]">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nome*" error={errors.nome?.message}>
              <Input {...register("nome")} />
            </Field>
            <Field label="Tipo*" error={errors.tipo?.message}>
              <Select defaultValue={watch("tipo")} onValueChange={(v) => setValue("tipo", v as "servico" | "produto")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preço (R$)*" error={errors.preco?.message}>
              <Input type="number" step="0.01" {...register("preco")} />
            </Field>
            <Field label="Ativo" error={errors.ativo?.message}>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={watch("ativo")} onCheckedChange={(v) => setValue("ativo", v)} />
                <span className="text-sm text-muted-foreground">{watch("ativo") ? "Ativo" : "Inativo"}</span>
              </div>
            </Field>
            <div className="md:col-span-2">
              <Field label="Descrição" error={errors.descricao?.message}>
                <Textarea rows={3} {...register("descricao")} />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit"><Save className="mr-2 h-4 w-4" /> Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}