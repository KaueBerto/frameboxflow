import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Wallet, 
  Users, 
  Calendar, 
  FileText, 
  LogOut,
  Camera,
  Sparkles,
  Briefcase,
  BarChart3,
  User
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "./AuthWrapper";
import { Badge } from "./ui/badge";

/**
 * Sidebar da aplicação com navegação principal
 * 
 * Funcionalidades:
 * - Navegação entre páginas principais
 * - Indicadores visuais de página ativa
 * - Suporte a modo colapsado/expandido
 * - Branding da aplicação
 * - Logout do usuário
 * - Badges informativos para seções
 */

// Configuração dos itens de navegação
const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: Home,
    description: "Visão geral do negócio",
    badge: null
  },
  { 
    title: "Controle de Caixa", 
    url: "/caixa", 
    icon: Wallet,
    description: "Receitas e despesas",
    badge: "Novo"
  },
  { 
    title: "Clientes", 
    url: "/clientes", 
    icon: Users,
    description: "Gestão de clientes",
    badge: null
  },
  { 
    title: "Serviços", 
    url: "/servicos", 
    icon: Briefcase,
    description: "Tipos de serviços",
    badge: null
  },
  { 
    title: "Agenda", 
    url: "/agenda", 
    icon: Calendar,
    description: "Agendamentos",
    badge: null
  },
  { 
    title: "Relatórios", 
    url: "/relatorios", 
    icon: BarChart3,
    description: "Análises e métricas",
    badge: "Em breve"
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { logout } = useAuth();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  /**
   * Verifica se a rota está ativa
   */
  const isActive = (path: string) => currentPath === path;

  /**
   * Retorna classes CSS para item de navegação
   */
  const getNavClasses = (active: boolean) => {
    return active 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground hover:text-sidebar-accent-foreground";
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border">
      {/* Header da sidebar com branding */}
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-background">
        <div className="flex items-center justify-center p-4">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              {/* Logo com ícones */}
              <div className="relative">
                <div className="p-2 bg-primary rounded-lg">
                  <Camera className="h-5 w-5 text-primary-foreground" />
                </div>
                <Sparkles className="h-3 w-3 text-warning absolute -top-1 -right-1" />
              </div>
              
              {/* Nome da aplicação */}
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  FrameBOX
                </h1>
                <p className="text-xs text-sidebar-foreground/70">
                  Gestão Fotográfica
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="p-2 bg-primary rounded-lg">
                <Camera className="h-5 w-5 text-primary-foreground" />
              </div>
              <Sparkles className="h-3 w-3 text-warning absolute -top-1 -right-1" />
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Conteúdo principal da sidebar */}
      <SidebarContent className="bg-sidebar-background">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            {!isCollapsed && "Navegação Principal"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClasses(isActive)}`
                      }
                      title={isCollapsed ? `${item.title} - ${item.description}` : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      
                      {!isCollapsed && (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="text-xs opacity-70">{item.description}</span>
                          </div>
                          
                          {/* Badge informativo */}
                          {item.badge && (
                            <Badge 
                              variant={item.badge === "Novo" ? "default" : "secondary"}
                              className="text-xs px-2 py-0.5"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer da sidebar com perfil e logout */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar-background">
        <div className="p-2 space-y-2">
          {/* Informações do usuário */}
          {!isCollapsed && (
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-sidebar-accent/30">
              <div className="p-1.5 bg-primary rounded-full">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-sidebar-foreground">
                  Patrícia Costa
                </span>
                <span className="text-xs text-sidebar-foreground/70">
                  Administradora
                </span>
              </div>
            </div>
          )}

          {/* Botão de logout */}
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            onClick={logout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
            title={isCollapsed ? "Sair do sistema" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair do Sistema</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}