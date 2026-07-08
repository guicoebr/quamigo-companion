import { createFileRoute, getRouteApi, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, MapPin, FileText, Eye, Pencil } from "lucide-react";
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
import { getTutor } from "@/lib/api/tutores.functions";
import { listPets } from "@/lib/api/pets.functions";
import { osDoTutor, findEspecie, findRaca } from "@/hooks/useMockData";
import { STATUS_OS_META } from "@/lib/osStatus";
import {
  formatBRL,
  formatCEP,
  formatCPF,
  formatDate,
  formatTelefone,
} from "@/lib/formatters";

export const Route = createFileRoute("/_app/tutores/$id/")({
  head: ({ params }) => ({ meta: [{ title: `Tutor ${params.id} — +QAmigo` }] }),
  loader: async ({ params }) => {
    const tutor = await getTutor({ data: { id: params.id } });
    if (!tutor) throw notFound();
    return { tutor };
  },
  notFoundComponent: () => (
    <>
      <PageHeader title="Tutor não encontrado" />
      <Button asChild variant="outline">
        <Link to="/tutores">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </Button>
    </>
  ),
  component: TutorDetalhe,
});

const routeApi = getRouteApi("/_app/tutores/$id/");

function TutorDetalhe() {
  const { tutor } = routeApi.useLoaderData();
  const { data: todosPets = [] } = useQuery({ queryKey: ["pets"], queryFn: () => listPets() });
  const pets = todosPets.filter((p) => p.tutorId === tutor.id);
  const oss = osDoTutor(tutor.id);

  return (
    <>
      <PageHeader
        title={tutor.nome}
        description={`CPF ${formatCPF(tutor.cpf)} • cliente desde ${formatDate(tutor.criadoEm)}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/tutores">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <RoleGuard permission="tutor.editar">
              <Button asChild>
                <Link to="/tutores/$id/editar" params={{ id: tutor.id }}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </Link>
              </Button>
            </RoleGuard>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[12px] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{tutor.email}</span>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{formatTelefone(tutor.telefone)}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p>
                  {tutor.endereco.logradouro}, {tutor.endereco.numero}
                  {tutor.endereco.complemento ? ` — ${tutor.endereco.complemento}` : ""}
                </p>
                <p className="text-muted-foreground">
                  {tutor.endereco.bairro} • {tutor.endereco.cidade}/{tutor.endereco.uf}
                </p>
                <p className="text-muted-foreground">CEP {formatCEP(tutor.endereco.cep)}</p>
              </div>
            </div>
            {tutor.observacoes && (
              <div className="flex items-start gap-2 border-t border-border pt-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{tutor.observacoes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[12px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pets ({pets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Espécie / Raça</TableHead>
                  <TableHead className="text-right">Peso</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>
                      {findEspecie(p.especieId)?.nome ?? "—"} • {findRaca(p.racaId)?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{p.pesoKg} kg</TableCell>
                    <TableCell>
                      {p.dataFalecimento ? (
                        <StatusBadge label="Falecido" tone="neutral" />
                      ) : (
                        <StatusBadge label="Vivo" tone="success" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" title="Ver">
                          <Link to="/pets/$id" params={{ id: p.id }}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <RoleGuard permission="pet.editar">
                          <Button asChild size="icon" variant="ghost" title="Editar">
                            <Link to="/pets/$id/editar" params={{ id: p.id }}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </RoleGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum pet cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 rounded-[12px]">
        <CardHeader>
          <CardTitle className="text-base">Histórico de OS ({oss.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Pet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oss.map((os) => {
                const meta = STATUS_OS_META[os.status];
                return (
                  <TableRow key={os.id}>
                    <TableCell className="font-medium">{os.numero}</TableCell>
                    <TableCell>{pets.find((p) => p.id === os.petId)?.nome ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge label={meta.label} color={meta.color} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(os.total)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(os.criadoEm)}</TableCell>
                  </TableRow>
                );
              })}
              {oss.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma OS registrada para este tutor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* TODO(api): histórico paginado via createServerFn. */}
        </CardContent>
      </Card>
    </>
  );
}
