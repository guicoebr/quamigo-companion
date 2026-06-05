import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  ClipboardList,
  HeartPulse,
  Receipt,
  FileSignature,
  Package,
  Settings,
  Palette,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { brand } from "@/design/brand";
import { canAccessRoute } from "@/lib/permissions";
import { useRoleGuard } from "@/hooks/useRoleGuard";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
};

const mainItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tutores", url: "/tutores", icon: Users },
  { title: "Pets", url: "/pets", icon: PawPrint },
  { title: "Registrar óbito", url: "/obitos/novo", icon: HeartPulse },
  { title: "Ordens de serviço", url: "/ordens-servico", icon: ClipboardList },
];

const financeItems: NavItem[] = [
  { title: "Pagamentos", url: "/pagamentos", icon: Receipt },
  { title: "Contratos", url: "/contratos", icon: FileSignature },
  { title: "Serviços e produtos", url: "/servicos-produtos", icon: Package },
];

const adminItems: NavItem[] = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
  { title: "Brand book", url: "/brand-book", icon: Palette },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({
    select: (router) => router.location.pathname,
  });
  const { role } = useRoleGuard();

  const isActive = (url: string) =>
    url === "/dashboard" ? currentPath === url : currentPath.startsWith(url);

  const renderGroup = (label: string, items: NavItem[]) => {
    const visible = items.filter((item) => canAccessRoute(item.url, role));
    if (visible.length === 0) return null;
    return (
      <SidebarGroup key={label}>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sidebar-primary-foreground font-bold">
            +Q
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sidebar-foreground">{brand.name}</span>
              <span className="text-xs text-sidebar-foreground/70">{brand.tagline}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Operacional", mainItems)}
        {renderGroup("Financeiro", financeItems)}
        {renderGroup("Administração", adminItems)}
      </SidebarContent>
    </Sidebar>
  );
}