import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/cards/PageHeader";
import { UsuariosTab } from "@/components/config/UsuariosTab";
import { ConfigTabsNav } from "./_app.configuracoes";

export const Route = createFileRoute("/_app/configuracoes/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — +QAmigo" }] }),
  component: () => (
    <>
      <PageHeader title="Configurações" description="Gerencie usuários do sistema." />
      <ConfigTabsNav active="usuarios" />
      <div className="mt-4"><UsuariosTab /></div>
    </>
  ),
});