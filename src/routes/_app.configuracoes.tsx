import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * `/configuracoes` — layout puro (Outlet). As sub-rotas
 * (/configuracoes/usuarios, /especies, /racas, /modalidades) reutilizam
 * `ConfigTabsNav` daqui + seus próprios componentes de tab.
 */
export const Route = createFileRoute("/_app/configuracoes")({
  component: () => <Outlet />,
});

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