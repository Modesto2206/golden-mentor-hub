import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from "@/hooks/useSales";

interface SalesChartsProps {
  sales: Sale[];
}

const COLORS = ["#FFBC00", "#FFD54F", "#B8860B", "#DAA520", "#F0E68C", "#BDB76B"];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
  }).format(value);
};

const SalesCharts = ({ sales }: SalesChartsProps) => {
  const paidSales = sales.filter((s) => s.status === "pago");

  // Sales by covenant type
  const covenantData = useMemo(() => {
    const grouped: Record<string, number> = {};
    paidSales.forEach((sale) => {
      grouped[sale.covenant_type] = (grouped[sale.covenant_type] || 0) + Number(sale.released_value);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [paidSales]);

  // Sales by month (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; commission: number }> = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
      months[key] = { revenue: 0, commission: 0 };
    }

    paidSales.forEach((sale) => {
      const date = new Date(sale.sale_date);
      const key = date.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
      if (months[key]) {
        months[key].revenue += Number(sale.released_value);
        months[key].commission += Number(sale.commission_value);
      }
    });

    return Object.entries(months).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      commission: data.commission,
    }));
  }, [paidSales]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Vendas por Mês</CardTitle>
          <CardDescription>Faturamento e comissões nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={formatCurrency} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commission" name="Comissão" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Vendas por Convênio</CardTitle>
          <CardDescription>Distribuição do faturamento por tipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {covenantData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={covenantData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {covenantData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhuma venda paga para exibir
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesCharts;
