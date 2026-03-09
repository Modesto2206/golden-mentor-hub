import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";

interface NextBracket {
  rate: string;
  missing: number;
  min_volume: number;
}

interface CommissionProgressBarProps {
  nextBracket: NextBracket;
  currentBracketMin: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CommissionProgressBar = ({ nextBracket, currentBracketMin }: CommissionProgressBarProps) => {
  const range = nextBracket.min_volume - currentBracketMin;
  const progress = range > 0
    ? ((range - nextBracket.missing) / range) * 100
    : 0;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Progresso para próxima faixa ({nextBracket.rate})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={Math.max(0, Math.min(100, progress))} className="h-3 mb-2" />
        <p className="text-sm text-muted-foreground">
          Faltam <span className="font-semibold text-foreground">{fmt(nextBracket.missing)}</span> para
          alcançar a faixa de {nextBracket.rate}
        </p>
      </CardContent>
    </Card>
  );
};

export default CommissionProgressBar;
