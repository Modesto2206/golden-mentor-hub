import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface BracketInfo {
  min: number;
  max: number;
  rate: string;
  active: boolean;
  reached: boolean;
}

interface CommissionTierTableProps {
  brackets: BracketInfo[] | null;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const DEFAULT_BRACKETS: BracketInfo[] = [
  { min: 70000, max: 80000, rate: "0.30%", active: false, reached: false },
  { min: 80001, max: 90000, rate: "0.35%", active: false, reached: false },
  { min: 90001, max: 100000, rate: "0.40%", active: false, reached: false },
  { min: 100001, max: 110000, rate: "0.45%", active: false, reached: false },
  { min: 110001, max: 120000, rate: "0.50%", active: false, reached: false },
  { min: 120001, max: 130000, rate: "0.55%", active: false, reached: false },
  { min: 130001, max: 140000, rate: "0.60%", active: false, reached: false },
  { min: 140001, max: 150000, rate: "0.65%", active: false, reached: false },
  { min: 150001, max: 160000, rate: "0.70%", active: false, reached: false },
  { min: 160001, max: 170000, rate: "0.75%", active: false, reached: false },
  { min: 170001, max: 180000, rate: "0.80%", active: false, reached: false },
  { min: 180001, max: 190000, rate: "0.85%", active: false, reached: false },
  { min: 190001, max: 200000, rate: "0.90%", active: false, reached: false },
];

const CommissionTierTable = ({ brackets }: CommissionTierTableProps) => {
  const tiers = brackets ?? DEFAULT_BRACKETS;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Tabela de Faixas de Comissão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {tiers.map((b, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border text-center transition-all ${
                b.active
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : b.reached
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/30 bg-secondary/20 opacity-60"
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {fmt(b.min)} – {fmt(b.max)}
              </p>
              <p className={`text-lg font-bold ${b.active ? "text-primary" : ""}`}>{b.rate}</p>
              {b.active && (
                <Badge variant="default" className="text-[10px] mt-1">
                  ATUAL
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommissionTierTable;
