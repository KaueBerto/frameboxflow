import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "./ui/button";
import { Bell, Search, Settings } from "lucide-react";
import { Input } from "./ui/input";

/**
 * Layout principal da aplicação
 * 
 * Responsável por:
 * - Estruturar o layout geral com sidebar e conteúdo principal
 * - Fornecer header com navegação e ações rápidas
 * - Gerenciar o estado da sidebar (expandida/colapsada)
 * - Aplicar tema consistente em toda aplicação
 */

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar com navegação principal */}
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header com barra de navegação superior */}
          <header className="h-16 flex items-center justify-between border-b bg-card px-6 shadow-sm">
            <div className="flex items-center space-x-4">
              {/* Botão para toggle da sidebar */}
              <SidebarTrigger className="hover:bg-muted transition-colors" />
              
              {/* Título da aplicação */}
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-foreground">
                  FrameBOX
                </h1>
                <p className="text-xs text-muted-foreground">
                  Sistema de Gestão Fotográfica
                </p>
              </div>
            </div>

            {/* Barra de pesquisa e ações */}
            <div className="flex items-center space-x-4">
              {/* Campo de pesquisa global */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-10 w-64 bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Botões de ação rápida */}
              <div className="flex items-center space-x-2">
                {/* Notificações */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-muted transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  {/* Indicador de notificações */}
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
                    3
                  </span>
                </Button>

                {/* Configurações */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Conteúdo principal da aplicação */}
          <main className="flex-1 p-6 overflow-auto bg-muted/30">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}