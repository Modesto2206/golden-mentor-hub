import { useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Award, Zap, PartyPopper } from "lucide-react";
import { useSellerCommission } from "@/hooks/useSellerCommission";
import confetti from "canvas-confetti";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const SellerCommissionPanel = () => {
  const { commission, isLoading, shouldCelebrate, resetCelebration } = useSellerCommission();

  const triggerCelebration = useCallback(() => {
    if (!shouldCelebrate) return;
    
    // Fire confetti
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#FFBC00", "#FFD700", "#FFA500", "#FF6347"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    resetCelebration();
  }, [shouldCelebrate, resetCelebration]);

  useEffect(() => {
    triggerCelebration();
  }, [triggerCelebration]);

  if (isLoading) {
    return (
      <Card className="border-border/50 animate-pulse">
        <CardContent className="p-6 h-48" />
      </Card>
    );
  }

  if (!commission) return null;

  const {
    total_volume,
    applied_rate,
    commission_value,
    current_bracket,
    next_bracket,
    celebrated_ranges,
    brackets,
  } = commission;

  // Progress to next bracket
  const progressToNext = next_bracket
    ? ((next_bracket.min_volume - next_bracket.missing - (brackets.find((b) => b.active)?.min ?? 0)) /
        (next_bracket.min_volume - (brackets.find((b) => b.active)?.min ?? 0))) *
      100
    : 100;

  return (
    <div className="space-y-4">
      {/* Celebration banner */}
      {commission.should_celebrate && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-primary animate-bounce" />
            <div>
              <p className="font-bold text-primary">{commission.celebration_message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Commission Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volume Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(total_volume)}</div>
            <p className="text-xs text-muted-foreground">Total aprovado no mês</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faixa Atual</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {current_bracket || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {total_volume < 70000 ? "Mínimo: R$ 70.000" : "Taxa aplicada sobre o volume"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissão Estimada</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{fmt(commission_value)}</div>
            <p className="text-xs text-muted-foreground">
              {applied_rate > 0 ? `${(applied_rate * 100).toFixed(2)}% sobre ${fmt(total_volume)}` : "Sem comissão"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Bracket */}
      {next_bracket && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Progresso para próxima faixa ({next_bracket.rate})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={Math.max(0, Math.min(100, progressToNext))} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              Faltam <span className="font-semibold text-foreground">{fmt(next_bracket.missing)}</span> para
              alcançar a faixa de {next_bracket.rate}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bracket Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tabela de Faixas de Comissão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {brackets.map((b, i) => (
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

      {/* Celebration History */}
      {celebrated_ranges.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PartyPopper className="w-4 h-4" /> Conquistas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {celebrated_ranges.map((range, i) => (
                <Badge key={i} variant="secondary" className="text-sm">
                  🎉 {range}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SellerCommissionPanel;
