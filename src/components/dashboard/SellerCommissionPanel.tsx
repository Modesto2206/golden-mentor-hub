import { useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartyPopper } from "lucide-react";
import { useSellerCommission } from "@/hooks/useSellerCommission";
import confetti from "canvas-confetti";
import CommissionSummaryCards from "./commission/CommissionSummaryCards";
import CommissionProgressBar from "./commission/CommissionProgressBar";
import CommissionTierTable from "./commission/CommissionTierTable";

const SellerCommissionPanel = () => {
  const { commission, isLoading, shouldCelebrate, resetCelebration } = useSellerCommission();

  const triggerCelebration = useCallback(() => {
    if (!shouldCelebrate) return;
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ["#FFBC00", "#FFD700", "#FFA500", "#FF6347"];
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
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

  const activeBracketMin = commission?.brackets?.find((b) => b.active)?.min ?? 0;

  return (
    <div className="space-y-4">
      {/* Celebration banner */}
      {commission?.should_celebrate && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-primary animate-bounce" />
            <p className="font-bold text-primary">{commission.celebration_message}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      {commission && (
        <CommissionSummaryCards
          totalVolume={commission.total_volume}
          currentBracket={commission.current_bracket}
          appliedRate={commission.applied_rate}
          commissionValue={commission.commission_value}
        />
      )}

      {/* Progress to next bracket */}
      {commission?.next_bracket && (
        <CommissionProgressBar
          nextBracket={commission.next_bracket}
          currentBracketMin={activeBracketMin}
        />
      )}

      {/* Commission tier table — always visible */}
      <CommissionTierTable brackets={commission?.brackets ?? null} />

      {/* Achievements */}
      {commission && commission.celebrated_ranges.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PartyPopper className="w-4 h-4" /> Conquistas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {commission.celebrated_ranges.map((range, i) => (
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
