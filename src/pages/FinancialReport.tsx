import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Users, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const FinancialReport = () => {
  const { user } = useAuth();

  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const currMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: prevSales = [] } = useQuery({
    queryKey: ["financial-report-prev", prevMonth.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("sale_date", prevMonth.toISOString().split("T")[0])
        .lte("sale_date", prevMonthEnd.toISOString().split("T")[0]);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: currSales = [] } = useQuery({
    queryKey: ["financial-report-curr", currMonthStart.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("sale_date", currMonthStart.toISOString().split("T")[0]);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-report"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: prevClients = [] } = useQuery({
    queryKey: ["clients-prev-month", prevMonth.toISOString()],
    queryFn: async () => {
      const { data, error } = await (supabase.from("clients" as any) as any)
        .select("id")
        .gte("created_at", prevMonth.toISOString())
        .lte("created_at", prevMonthEnd.toISOString());
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.user_id, p.full_name])),
    [profiles]
  );

  const stats = useMemo(() => {
    const totalRevenue = prevSales.reduce((s, sale) => s + Number(sale.released_value || 0), 0);
    const totalCommissions = prevSales.reduce((s, sale) => s + Number(sale.commission_value || 0), 0);
    const totalSales = prevSales.length;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const newClients = prevClients.length;

    const currRevenue = currSales.reduce((s, sale) => s + Number(sale.released_value || 0), 0);
    const revenueChange = totalRevenue > 0 ? ((currRevenue - totalRevenue) / totalRevenue) * 100 : 0;

    // Group by seller
    const bySeller = new Map<string, { count: number; revenue: number; commission: number }>();
    prevSales.forEach((sale) => {
      const existing = bySeller.get(sale.seller_id) || { count: 0, revenue: 0, commission: 0 };
      existing.count++;
      existing.revenue += Number(sale.released_value || 0);
      existing.commission += Number(sale.commission_value || 0);
      bySeller.set(sale.seller_id, existing);
    });

    // Group by operation type (modalidade)
    const byModalidade = new Map<string, { count: number; revenue: number }>();
    prevSales.forEach((sale) => {
      const key = sale.operation_type || "Não definido";
      const existing = byModalidade.get(key) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += Number(sale.released_value || 0);
      byModalidade.set(key, existing);
    });

    // Group by covenant
    const byConvenio = new Map<string, { count: number; revenue: number }>();
    prevSales.forEach((sale) => {
      const key = sale.covenant_type || "Não definido";
      const existing = byConvenio.get(key) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += Number(sale.released_value || 0);
      byConvenio.set(key, existing);
    });

    return {
      totalRevenue,
      totalCommissions,
      totalSales,
      avgTicket,
      newClients,
      revenueChange,
      bySeller: Array.from(bySeller.entries()).map(([id, data]) => ({
        name: profileMap.get(id) || "Desconhecido",
        ...data,
      })).sort((a, b) => b.revenue - a.revenue),
      byModalidade: Array.from(byModalidade.entries()).map(([key, data]) => ({
        name: key,
        ...data,
      })).sort((a, b) => b.revenue - a.revenue),
      byConvenio: Array.from(byConvenio.entries()).map(([key, data]) => ({
        name: key,
        ...data,
      })).sort((a, b) => b.revenue - a.revenue),
    };
  }, [prevSales, currSales, prevClients, profileMap]);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const monthName = prevMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gold-gradient">Relatório Financeiro</h1>
          <p className="text-sm text-muted-foreground capitalize">{monthName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-4 h-4" /> Receita Bruta
              </div>
              <p className="text-lg font-bold">{fmt(stats.totalRevenue)}</p>
              <div className="flex items-center gap-1 text-xs mt-1">
                {stats.revenueChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                )}
                <span className={stats.revenueChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(stats.revenueChange).toFixed(1)}% vs mês atual
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BarChart3 className="w-4 h-4" /> Total Vendas
              </div>
              <p className="text-lg font-bold">{stats.totalSales}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-4 h-4" /> Comissões Pagas
              </div>
              <p className="text-lg font-bold">{fmt(stats.totalCommissions)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-4 h-4" /> Ticket Médio
              </div>
              <p className="text-lg font-bold">{fmt(stats.avgTicket)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="w-4 h-4" /> Novos Clientes
              </div>
              <p className="text-lg font-bold">{stats.newClients}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Seller */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Por Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.bySeller.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-right text-sm">{s.count}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(s.revenue)}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(s.commission)}</TableCell>
                    </TableRow>
                  ))}
                  {stats.bySeller.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* By Modalidade */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Por Modalidade</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modalidade</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byModalidade.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium text-sm">{m.name}</TableCell>
                      <TableCell className="text-right text-sm">{m.count}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(m.revenue)}</TableCell>
                    </TableRow>
                  ))}
                  {stats.byModalidade.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* By Convenio */}
          <Card className="border-border/50 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Por Convênio</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Convênio</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byConvenio.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell className="text-right text-sm">{c.count}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(c.revenue)}</TableCell>
                    </TableRow>
                  ))}
                  {stats.byConvenio.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default FinancialReport;
