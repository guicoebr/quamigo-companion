import { createFileRoute, getRouteApi, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Weight, PawPrint, Pencil } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PageHeader } from "@/components/cards/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status/StatusBadge";
import { getPet } from "@/lib/api/pets.functions";
import { getTutor } from "@/lib/api/tutores.functions";
import { listEspecies, listRacas } from "@/lib/api/lookups.functions";
import { listOS } from "@/lib/api/ordens-servico.functions";
import { STATUS_OS_META } from "@/lib/osStatus";
import { formatBRL, formatDate } from "@/lib/formatters";

export const Route = createFileRoute("/_app/pets/$id/")({
  head: ({ params }) => ({ meta: [{ title: `Pet ${params.id} — +QAmigo` }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const pet = await getPet({ data: { id: params.id } });
    if (!pet) throw notFound();
    return { pet };
  },
  notFoundComponent: () => (
    <>
      <PageHeader title="Pet não encontrado" />
      <Button asChild variant="outline">
        <Link to="/pets">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>
    </>
  ),
  component: PetDetalhe,
});

const routeApi = getRouteApi("/_app/pets/$id/");

function PetDetalhe() {
  const { pet } = routeApi.useLoaderData();
  const { data: ordensServico = [] } = useQuery({
    queryKey: ["ordens-servico"],
    queryFn: () => listOS(),
  });
  const { data: tutor } = useQuery({
    queryKey: ["tutor", pet.tutorId],
    queryFn: () => getTutor({ data: { id: pet.tutorId } }),
  });
  const { data: especies = [] } = useQuery({
    queryKey: ["especies"],
    queryFn: () => listEspecies(),
  });
  const { data: racas = [] } = useQuery({ queryKey: ["racas"], queryFn: () => listRacas() });
  const especie = especies.find((e) => e.id === pet.especieId);
  const raca = racas.find((r) => r.id === pet.racaId);
  const ossDoPet = ordensServico.filter((os) => os.petId === pet.id);

  return (
    <>
      <PageHeader
        title={pet.nome}
        description={`${especie?.nome ?? "—"} • ${raca?.nome ?? "—"} • ${pet.sexo === "macho" ? "Macho" : "Fêmea"}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/pets">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <RoleGuard permission="pet.editar">
              <Button asChild>
                <Link to="/pets/$id/editar" params={{ id: pet.id }}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar pet
                </Link>
              </Button>
            </RoleGuard>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-muted-foreground" />
              <span>Cor: {pet.cor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <span>Peso: {pet.pesoKg} kg</span>
            </div>
            {pet.dataNascimento && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Nascimento: {formatDate(pet.dataNascimento)}</span>
              </div>
            )}
            <div>
              {pet.dataFalecimento ? (
                <StatusBadge
                  label={`Falecido em ${formatDate(pet.dataFalecimento)}`}
                  tone="neutral"
                />
              ) : (
                <StatusBadge label="Vivo" tone="success" />
              )}
            </div>
            {pet.observacoes && (
              <p className="border-t border-border pt-3 text-muted-foreground">{pet.observacoes}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[12px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tutor</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {tutor ? (
              <div className="space-y-1">
                <Link
                  to="/tutores/$id"
                  params={{ id: tutor.id }}
                  className="text-base font-medium text-primary hover:underline"
                >
                  {tutor.nome}
                </Link>
                <p className="text-muted-foreground">
                  {tutor.email} • {tutor.endereco.cidade}/{tutor.endereco.uf}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Tutor não encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-[12px]">
        <CardHeader>
          <CardTitle className="text-base">OS deste pet ({ossDoPet.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ossDoPet.map((os) => {
                const meta = STATUS_OS_META[os.status];
                return (
                  <TableRow key={os.id}>
                    <TableCell className="font-medium">{os.numero}</TableCell>
                    <TableCell>
                      <StatusBadge label={meta.label} color={meta.color} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(os.total)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(os.criadoEm)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {ossDoPet.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma OS registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
