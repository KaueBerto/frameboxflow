import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Users, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalClients: number;
  monthlyIncome: number;
  monthlyExpense: number;
  yearlyIncome: number;
  upcomingAppointments: number;
  monthlyBalance: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    yearlyIncome: 0,
    upcomingAppointments: 0,
    monthlyBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);

      // Total de clientes
      const { count: clientCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });

      // Transações do mês
      const { data: monthlyTransactions } = await supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", format(monthStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(monthEnd, "yyyy-MM-dd"));

      // Receita anual
      const { data: yearlyTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "income")
        .gte("transaction_date", format(yearStart, "yyyy-MM-dd"))
        .lte("transaction_date", format(yearEnd, "yyyy-MM-dd"));

      // Compromissos futuros
      const { count: appointmentCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("start_date", now.toISOString())
        .eq("status", "scheduled");

      // Calcular estatísticas
      const monthlyIncome = monthlyTransactions
        ?.filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const monthlyExpense = monthlyTransactions
        ?.filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const yearlyIncome = yearlyTransactions
        ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setStats({
        totalClients: clientCount || 0,
        monthlyIncome,
        monthlyExpense,
        yearlyIncome,
        upcomingAppointments: appointmentCount || 0,
        monthlyBalance: monthlyIncome - monthlyExpense,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio em {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Saldo Mensal */}
        <Card className="bg-gradient-card shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              <Badge variant={stats.monthlyBalance >= 0 ? "default" : "destructive"} className="mt-1">
                {stats.monthlyBalance >= 0 ? "Lucro" : "Prejuízo"}
              </Badge>
            </p>
          </CardContent>
        </Card>

        {/* Receita Mensal */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(stats.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Entradas de {format(new Date(), "MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* Despesas Mensais */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.monthlyExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saídas de {format(new Date(), "MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* Total de Clientes */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        {/* Compromissos Futuros */}
        <Card className="shadow-md">
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

        {/* Receita Anual */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.yearlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de {format(new Date(), "yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cartão de Boas-vindas */}
      <Card className="bg-gradient-hero shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Bem-vindo ao FrameBOX! 📸</CardTitle>
          <CardDescription className="text-white/80">
            Gerencie seus clientes, agenda e finanças em um só lugar. 
            Sua criatividade merece o melhor sistema de gestão.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}