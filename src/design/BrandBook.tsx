import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/cards/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { StatusBadge } from "@/components/status/StatusBadge";
import { brand, brandColors, brandRadius, brandTypography } from "@/design/brand";
import { Users, PawPrint, Receipt, HeartPulse } from "lucide-react";

const colorEntries: Array<{ key: keyof typeof brandColors; label: string }> = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warning" },
  { key: "error", label: "Error" },
  { key: "background", label: "Background" },
  { key: "sidebar", label: "Sidebar" },
  { key: "textPrimary", label: "Text primary" },
  { key: "textMuted", label: "Text muted" },
  { key: "border", label: "Border" },
];

// Preview das cores de status de OS (oficializadas no Bloco 3).
const previewOsStatuses = [
  { label: "Aguardando coleta", color: "#B7950B" },
  { label: "Em transporte", color: "#2E86C1" },
  { label: "Recebido", color: "#1B4F72" },
  { label: "Em andamento", color: "#6C3483" },
  { label: "Concluído", color: "#1E8449" },
  { label: "Cinzas disponíveis", color: "#117A65" },
  { label: "Encerrado", color: "#717D7E" },
];

export default function BrandBook() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Brand book +QAmigo"
        description="Referência visual do design system. Todas as cores e tokens vêm de src/design/brand.ts."
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cores da marca</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {colorEntries.map(({ key, label }) => (
            <Card key={key} className="overflow-hidden rounded-[12px]">
              <div className="h-20 w-full" style={{ backgroundColor: brandColors[key] }} />
              <CardContent className="p-3">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {brandColors[key]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tipografia</h2>
        <Card className="rounded-[12px]">
          <CardContent className="space-y-3 p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Família: {brandTypography.fontFamily.split(",")[0]}
            </p>
            <p className="text-3xl font-bold">Aa — Display 32 / Bold</p>
            <p className="text-2xl font-semibold">Aa — Title 24 / Semibold</p>
            <p className="text-base font-medium">Aa — Body 16 / Medium</p>
            <p className="text-sm text-muted-foreground">Aa — Caption 14 / Regular</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Botões</h2>
        <Card className="rounded-[12px]">
          <CardContent className="flex flex-wrap gap-3 p-6">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destrutivo</Button>
            <Button disabled>Desabilitado</Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cards de métrica</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tutores ativos" value="128" hint="Exemplo" icon={Users} tone="primary" />
          <StatCard label="Pets cadastrados" value="312" hint="Exemplo" icon={PawPrint} tone="primary" />
          <StatCard label="OS hoje" value="6" hint="Exemplo" icon={HeartPulse} tone="warning" />
          <StatCard label="A receber" value="R$ 12.400" hint="Exemplo" icon={Receipt} tone="success" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Badges de status</h2>
        <Card className="rounded-[12px]">
          <CardContent className="flex flex-wrap gap-2 p-6">
            {previewOsStatuses.map((s) => (
              <StatusBadge key={s.label} label={s.label} color={s.color} />
            ))}
            <StatusBadge label="Sucesso" tone="success" />
            <StatusBadge label="Atenção" tone="warning" />
            <StatusBadge label="Erro" tone="error" />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tabela de exemplo</h2>
        <Card className="rounded-[12px]">
          <CardHeader>
            <CardTitle className="text-base">Ordens de serviço recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { os: "OS-2026-00012", pet: "Thor", tutor: "Maria Silva", status: previewOsStatuses[0], valor: "R$ 480,00" },
                  { os: "OS-2026-00011", pet: "Mel", tutor: "João Souza", status: previewOsStatuses[3], valor: "R$ 720,00" },
                  { os: "OS-2026-00010", pet: "Luna", tutor: "Ana Lima", status: previewOsStatuses[4], valor: "R$ 540,00" },
                ].map((row) => (
                  <TableRow key={row.os}>
                    <TableCell className="font-medium">{row.os}</TableCell>
                    <TableCell>{row.pet}</TableCell>
                    <TableCell>{row.tutor}</TableCell>
                    <TableCell>
                      <StatusBadge label={row.status.label} color={row.status.color} />
                    </TableCell>
                    <TableCell className="text-right">{row.valor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tokens de raio</h2>
        <Card className="rounded-[12px]">
          <CardContent className="flex flex-wrap gap-4 p-6">
            {Object.entries(brandRadius).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center gap-2">
                <div
                  className="h-16 w-16 bg-primary"
                  style={{ borderRadius: v }}
                />
                <span className="text-xs text-muted-foreground">{k}: {v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        {brand.name} • {brand.tagline}
      </p>
    </div>
  );
}