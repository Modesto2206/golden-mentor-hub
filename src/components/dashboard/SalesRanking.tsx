import { useMemo } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from "@/hooks/useSales";
import { SaleWithProfile } from "@/hooks/useSalesWithProfiles";

interface SalesRankingProps {
  sales: SaleWithProfile[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-400", "text-gray-400", "text-amber-700"];

const SalesRanking = ({ sales }: SalesRankingProps) => {
  const ranking = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Only paid sales in current month
    const monthlySales = sales.filter((s) => {
      const d = new Date(s.sale_date);
      return s.status === "pago" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Group by seller
    const grouped: Record<string, { name: string; revenue: number; count: number; commission: number }> = {};
    monthlySales.forEach((sale) => {
      const key = sale.seller_id;
      if (!grouped[key]) {
        grouped[key] = { name: sale.seller_name || "Desconhecido", revenue: 0, count: 0, commission: 0 };
      }
      grouped[key].revenue += Number(sale.released_value);
      grouped[key].commission += Number(sale.commission_value);
      grouped[key].count += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [sales]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking de Vendas
        </CardTitle>
        <CardDescription>Top vendedores do mês atual (vendas pagas)</CardDescription>
      </CardHeader>
      <CardContent>
        {ranking.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">Nenhuma venda paga este mês</p>
        ) : (
          <div className="space-y-3">
            {ranking.map((seller, index) => {
              const Icon = rankIcons[index] || Award;
              const color = rankColors[index] || "text-muted-foreground";
              return (
                <div
                  key={seller.name + index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    index === 0
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-card/50 border border-border/30"
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{seller.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {seller.count} venda{seller.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(seller.revenue)}</p>
                    <p className="text-xs text-primary">{formatCurrency(seller.commission)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesRanking;
