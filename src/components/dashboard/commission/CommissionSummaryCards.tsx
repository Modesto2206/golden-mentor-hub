import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Award, TrendingUp } from "lucide-react";

interface CommissionSummaryCardsProps {
  totalVolume: number;
  currentBracket: string | null;
  appliedRate: number;
  commissionValue: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CommissionSummaryCards = ({ totalVolume, currentBracket, appliedRate, commissionValue }: CommissionSummaryCardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Volume Mensal</CardTitle>
        <DollarSign className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{fmt(totalVolume)}</div>
        <p className="text-xs text-muted-foreground">Total aprovado no mês</p>
      </CardContent>
    </Card>

    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Faixa Atual</CardTitle>
        <Award className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{currentBracket || "—"}</div>
        <p className="text-xs text-muted-foreground">
          {totalVolume < 70000 ? "Mínimo: R$ 70.000" : "Taxa aplicada sobre o volume"}
        </p>
      </CardContent>
    </Card>

    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Comissão Estimada</CardTitle>
        <TrendingUp className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{fmt(commissionValue)}</div>
        <p className="text-xs text-muted-foreground">
          {appliedRate > 0 ? `${(appliedRate * 100).toFixed(2)}% sobre ${fmt(totalVolume)}` : "Sem comissão"}
        </p>
      </CardContent>
    </Card>
  </div>
);

export default CommissionSummaryCards;
