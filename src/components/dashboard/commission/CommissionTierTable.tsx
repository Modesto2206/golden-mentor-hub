import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Metas de Comissão Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-semibold">Volume Mensal (BRL)</TableHead>
                <TableHead className="text-xs font-semibold text-right">Taxa de Comissão</TableHead>
                <TableHead className="text-xs font-semibold text-center w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier, i) => (
                <TableRow
                  key={i}
                  className={
                    tier.active
                      ? "bg-primary/10 font-semibold"
                      : tier.reached
                      ? "bg-primary/5"
                      : ""
                  }
                >
                  <TableCell className="text-xs py-2.5">
                    {fmt(tier.min)} – {fmt(tier.max)}
                  </TableCell>
                  <TableCell className={`text-xs py-2.5 text-right font-mono ${tier.active ? "text-primary font-bold" : ""}`}>
                    {tier.rate}
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    {tier.active ? (
                      <Badge variant="default" className="text-[10px]">ATUAL</Badge>
                    ) : tier.reached ? (
                      <Badge variant="secondary" className="text-[10px]">✓</Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommissionTierTable;
