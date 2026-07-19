import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * `/configuracoes` — layout puro (Outlet). As sub-rotas
 * (/configuracoes/usuarios, /especies, /modalidades) reutilizam
 * `ConfigTabsNav` daqui + seus próprios componentes de tab.
 *
 * Observação: a aba "Raças" foi removida — espécies e raças agora vivem
 * no mesmo master-detail em /configuracoes/especies. A rota antiga
 * `/configuracoes/racas` redireciona para lá.
 */
export const Route = createFileRoute("/_app/configuracoes")({
  component: () => <Outlet />,
});

export function ConfigTabsNav({ active }: { active: "usuarios" | "especies" | "modalidades" }) {
  return (
    <Tabs value={active}>
      <TabsList>
        <TabsTrigger value="usuarios" asChild><Link to="/configuracoes/usuarios">Usuários</Link></TabsTrigger>
        <TabsTrigger value="especies" asChild><Link to="/configuracoes/especies">Espécies e raças</Link></TabsTrigger>
        <TabsTrigger value="modalidades" asChild><Link to="/configuracoes/modalidades">Modalidades</Link></TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
