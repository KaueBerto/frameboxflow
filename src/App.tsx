import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, AuthWrapper } from "./components/AuthWrapper";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CashFlow from "./pages/CashFlow";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import CalendarPage from "./pages/Calendar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthWrapper>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/caixa" element={<CashFlow />} />
                <Route path="/clientes" element={<Clients />} />
                <Route path="/servicos" element={<Services />} />
                <Route path="/agenda" element={<CalendarPage />} />
                <Route path="/relatorios" element={<div>Relatórios em desenvolvimento...</div>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </AuthWrapper>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
