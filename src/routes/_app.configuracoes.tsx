import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsuariosTab } from "@/components/config/UsuariosTab";

/**
 * `/configuracoes` agregadora: mantém UX em tabs e exibe "usuarios"
 * como padrão. As sub-rotas (/configuracoes/usuarios etc.) reutilizam
 * `ConfigTabsNav` + os mesmos componentes de tab.
 */
export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — +QAmigo" }] }),
  component: ConfiguracoesIndexPage,
});

function ConfiguracoesIndexPage() {
  return (
    <>
      <PageHeader title="Configurações" description="Gerencie usuários e catálogos do sistema." />
      <ConfigTabsNav active="usuarios" />
      <div className="mt-4">
        <UsuariosTab />
      </div>
    </>
  );
}

export function ConfigTabsNav({ active }: { active: "usuarios" | "especies" | "racas" | "modalidades" }) {
  return (
    <Tabs value={active}>
      <TabsList>
        <TabsTrigger value="usuarios" asChild><Link to="/configuracoes/usuarios">Usuários</Link></TabsTrigger>
        <TabsTrigger value="especies" asChild><Link to="/configuracoes/especies">Espécies</Link></TabsTrigger>
        <TabsTrigger value="racas" asChild><Link to="/configuracoes/racas">Raças</Link></TabsTrigger>
        <TabsTrigger value="modalidades" asChild><Link to="/configuracoes/modalidades">Modalidades</Link></TabsTrigger>
      </TabsList>
    </Tabs>
  );
}