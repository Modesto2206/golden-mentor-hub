import { useMemo } from "react";
import { TrendingUp, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from "@/hooks/useSales";

interface SalesProjectionProps {
  sales: Sale[];
  monthlyGoal?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const SalesProjection = ({ sales, monthlyGoal = 20000 }: SalesProjectionProps) => {
  const projection = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDay;

    // Paid sales this month
    const monthlySales = sales.filter((s) => {
      const d = new Date(s.sale_date);
      return s.status === "pago" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalRevenue = monthlySales.reduce((sum, s) => sum + Number(s.released_value), 0);
    const totalCommission = monthlySales.reduce((sum, s) => sum + Number(s.commission_value), 0);
    const totalSales = monthlySales.length;

    // Daily average
    const businessDaysElapsed = Math.max(currentDay, 1);
    const dailyAvgRevenue = totalRevenue / businessDaysElapsed;
    const dailyAvgSales = totalSales / businessDaysElapsed;

    // Projected values
    const projectedRevenue = totalRevenue + dailyAvgRevenue * daysRemaining;
    const projectedSales = Math.round(totalSales + dailyAvgSales * daysRemaining);
    const projectedCommission = totalCommission + (totalSales > 0 ? (totalCommission / totalSales) * (dailyAvgSales * daysRemaining) : 0);

    // Goal gap
    const goalGap = monthlyGoal - projectedRevenue;
    const willHitGoal = projectedRevenue >= monthlyGoal;

    return {
      totalRevenue,
      totalSales,
      daysRemaining,
      daysInMonth,
      currentDay,
      dailyAvgRevenue,
      projectedRevenue,
      projectedSales,
      projectedCommission,
      goalGap,
      willHitGoal,
    };
  }, [sales, monthlyGoal]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Projeção de Vendas
        </CardTitle>
        <CardDescription>Estimativa baseada no ritmo atual do mês</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            Dia {projection.currentDay} de {projection.daysInMonth} — {projection.daysRemaining} dias restantes
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 rounded-lg bg-card/50 border border-border/30 space-y-1">
            <p className="text-xs text-muted-foreground">Realizado até agora</p>
            <p className="text-lg font-bold">{formatCurrency(projection.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">{projection.totalSales} vendas pagas</p>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 space-y-1">
            <p className="text-xs text-muted-foreground">Projeção do mês</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(projection.projectedRevenue)}</p>
            <p className="text-xs text-muted-foreground">~{projection.projectedSales} vendas estimadas</p>
          </div>

          <div className="p-3 rounded-lg bg-card/50 border border-border/30 space-y-1">
            <p className="text-xs text-muted-foreground">Média diária</p>
            <p className="text-lg font-bold">{formatCurrency(projection.dailyAvgRevenue)}</p>
            <p className="text-xs text-muted-foreground">em receita/dia</p>
          </div>

          <div className={`p-3 rounded-lg space-y-1 border ${
            projection.willHitGoal
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" />
              Meta ({formatCurrency(monthlyGoal)})
            </p>
            <p className={`text-lg font-bold ${projection.willHitGoal ? "text-green-500" : "text-red-500"}`}>
              {projection.willHitGoal ? "✅ Vai bater!" : `Faltam ${formatCurrency(Math.abs(projection.goalGap))}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {projection.willHitGoal
                ? `Superando em ${formatCurrency(Math.abs(projection.goalGap))}`
                : "No ritmo atual, não atingirá a meta"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesProjection;
