import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wallet, 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

/**
 * Dashboard principal da aplicação
 * 
 * Funcionalidades:
 * - Exibe métricas principais do negócio
 * - Cards informativos com estatísticas
 * - Navegação rápida para outras seções
 * - Indicadores visuais de performance
 * - Ações rápidas para criação de registros
 */

interface DashboardStats {
  totalClients: number;
  monthlyIncome: number;
  monthlyExpense: number;
  yearlyIncome: number;
  upcomingAppointments: number;
  monthlyBalance: number;
  totalServices: number;
  completedAppointments: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    yearlyIncome: 0,
    upcomingAppointments: 0,
    monthlyBalance: 0,
    totalServices: 0,
    completedAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  /**
   * Busca todas as estatísticas do dashboard
   * Otimizada para fazer múltiplas consultas em paralelo
   */
  const fetchDashboardStats = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);

      // Executa todas as consultas em paralelo para melhor performance
      const [
        clientsResult,
        monthlyTransactionsResult,
        yearlyTransactionsResult,
        appointmentsResult,
        servicesResult,
        completedAppointmentsResult
      ] = await Promise.all([
        // Total de clientes
        supabase
          .from("clients")
          .select("*", { count: "exact", head: true }),
        
        // Transações do mês atual
        supabase
          .from("transactions")
          .select("*")
          .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(monthEnd, "yyyy-MM-dd")),
        
        // Receitas do ano
        supabase
          .from("transactions")
          .select("*")
          .eq("type", "income")
          .gte("transaction_date", format(yearStart, "yyyy-MM-dd"))
          .lte("transaction_date", format(yearEnd, "yyyy-MM-dd")),
        
        // Próximos agendamentos
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("start_date", now.toISOString())
          .eq("status", "scheduled"),
        
        // Total de serviços
        supabase
          .from("services")
          .select("*", { count: "exact", head: true }),
        
        // Agendamentos concluídos no mês
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("start_date", format(monthStart, "yyyy-MM-dd"))
          .lte("start_date", format(monthEnd, "yyyy-MM-dd"))
      ]);

      // Processa os resultados das transações mensais
      const monthlyIncome = monthlyTransactionsResult.data
        ?.filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthlyExpense = monthlyTransactionsResult.data
        ?.filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const yearlyIncome = yearlyTransactionsResult.data
        ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Atualiza o estado com todas as estatísticas
      setStats({
        totalClients: clientsResult.count || 0,
        monthlyIncome,
        monthlyExpense,
        yearlyIncome,
        upcomingAppointments: appointmentsResult.count || 0,
        monthlyBalance: monthlyIncome - monthlyExpense,
        totalServices: servicesResult.count || 0,
        completedAppointments: completedAppointmentsResult.count || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formata valores monetários para exibição
   */
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  /**
   * Retorna a cor apropriada baseada no valor (positivo/negativo)
   */
  const getValueColor = (value: number) => {
    return value >= 0 ? "text-success" : "text-destructive";
  };

  /**
   * Ações rápidas disponíveis no dashboard
   */
  const quickActions = [
    {
      title: "Nova Transação",
      description: "Registrar receita ou despesa",
      action: () => navigate("/caixa"),
      icon: Plus,
      color: "bg-primary"
    },
    {
      title: "Novo Cliente",
      description: "Cadastrar cliente",
      action: () => navigate("/clientes"),
      icon: Users,
      color: "bg-success"
    },
    {
      title: "Novo Agendamento",
      description: "Criar agendamento",
      action: () => navigate("/agenda"),
      icon: Calendar,
      color: "bg-warning"
    },
    {
      title: "Ver Relatórios",
      description: "Análises detalhadas",
      action: () => navigate("/relatorios"),
      icon: Eye,
      color: "bg-secondary"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loading para cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header do dashboard */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Visão geral do seu negócio em {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          
          {/* Badge com status do sistema */}
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            Sistema Online
          </Badge>
        </div>
      </div>

      {/* Cards principais de métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Mensal - Card destacado */}
        <Card className="card-elevated bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getValueColor(stats.monthlyBalance)}`}>
              {formatCurrency(stats.monthlyBalance)}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {stats.monthlyBalance >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
              <Badge 
                variant={stats.monthlyBalance >= 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {stats.monthlyBalance >= 0 ? "Lucro" : "Prejuízo"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card className="card-elevated hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entradas de {format(new Date(), "MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* Despesas Mensais */}
        <Card className="card-elevated hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.monthlyExpense)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saídas de {format(new Date(), "MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* Receita Anual */}
        <Card className="card-elevated hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.yearlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de {format(new Date(), "yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards secundários */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Clientes */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        {/* Próximos Compromissos */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Compromissos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos pendentes
            </p>
          </CardContent>
        </Card>

        {/* Serviços Cadastrados */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📋</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Tipos de serviços
            </p>
          </CardContent>
        </Card>

        {/* Agendamentos Concluídos */}
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos no Mês</CardTitle>
            <div className="h-4 w-4 text-success">✓</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completedAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos finalizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de ações rápidas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="card-elevated cursor-pointer hover:scale-105 transition-all duration-200"
              onClick={action.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 ${action.color} rounded-lg`}>
                    <action.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Card de boas-vindas */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center space-x-2">
            <span>📸</span>
            <span>Bem-vinda ao FrameBOX!</span>
          </CardTitle>
          <CardDescription className="text-foreground/80">
            Gerencie seus clientes, agenda e finanças em um só lugar. 
            Sua criatividade merece o melhor sistema de gestão.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}