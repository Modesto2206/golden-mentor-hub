import { DollarSign, TrendingUp, Target, Users, Percent, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import MonthlyGoalModal from "./MonthlyGoalModal";

interface DashboardStatsProps {
  sales: Sale[];
  monthlyGoal?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const DashboardStats = ({ sales, monthlyGoal = 20000 }: DashboardStatsProps) => {
  const { isAdmin } = useAuth();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter sales for current month (only "pago" status counts for revenue)
  const monthlySales = sales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });

  const paidSales = monthlySales.filter((s) => s.status === "pago");

  const totalSales = monthlySales.length;
  const totalRevenue = paidSales.reduce((sum, s) => sum + Number(s.released_value), 0);
  const totalCommissions = paidSales.reduce((sum, s) => sum + Number(s.commission_value), 0);
  const avgCommission = paidSales.length > 0 ? totalCommissions / paidSales.length : 0;
  const avgTicket = paidSales.length > 0 ? totalRevenue / paidSales.length : 0;
  const goalProgress = (totalRevenue / monthlyGoal) * 100;

  const stats = [
    {
      title: "Vendas do Mês",
      value: totalSales.toString(),
      icon: Users,
      description: `${paidSales.length} pagas`,
    },
    {
      title: "Valor Liberado",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      description: "Total pago no mês",
    },
    {
      title: "Comissões",
      value: formatCurrency(totalCommissions),
      icon: PiggyBank,
      description: "Total em comissões",
    },
    {
      title: "Comissão Média",
      value: formatCurrency(avgCommission),
      icon: Percent,
      description: "Por venda",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(avgTicket),
      icon: TrendingUp,
      description: "Valor médio",
    },
    {
      title: "Meta Mensal",
      value: `${Math.min(goalProgress, 100).toFixed(1)}%`,
      icon: Target,
      description: formatCurrency(monthlyGoal),
      progress: goalProgress,
      showEdit: isAdmin,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {stat.title}
              {stat.showEdit && <MonthlyGoalModal currentGoal={monthlyGoal} />}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            {stat.progress !== undefined && (
              <div className="mt-3">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      stat.progress >= 100
                        ? "bg-green-500"
                        : stat.progress >= 80
                        ? "bg-yellow-500"
                        : stat.progress >= 50
                        ? "bg-primary"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  {stat.progress >= 100
                    ? "🎉 Meta batida!"
                    : stat.progress >= 80
                    ? "⚡ Quase lá!"
                    : `Faltam ${formatCurrency(Math.max(0, monthlyGoal - totalRevenue))}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
