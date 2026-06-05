import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { ROLE_LABEL } from "@/types/auth";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-3 sm:px-4">
      <SidebarTrigger className="text-foreground" />
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tutor, pet ou OS..."
          className="pl-9 bg-background"
          aria-label="Busca global"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.iniciais ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-sm font-medium">{user?.nome ?? "Convidado"}</span>
                <span className="text-xs text-muted-foreground">
                  {user ? ROLE_LABEL[user.role] : "Sem sessão"}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.nome}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}