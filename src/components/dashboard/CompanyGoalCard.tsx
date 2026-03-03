import { useState } from "react";
import { Building2, Pencil, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCompanyGoal } from "@/hooks/useCompanyGoal";
import { Sale } from "@/hooks/useSales";

interface CompanyGoalCardProps {
  sales: Sale[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const CompanyGoalCard = ({ sales }: CompanyGoalCardProps) => {
  const { companyGoal, canEdit, upsertGoal, isUpdating } = useCompanyGoal();
  const [open, setOpen] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyPaidSales = sales.filter((s) => {
    const d = new Date(s.sale_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status === "pago";
  });

  const totalSold = monthlyPaidSales.reduce((sum, s) => sum + Number(s.released_value), 0);
  const progress = companyGoal > 0 ? (totalSold / companyGoal) * 100 : 0;
  const remaining = Math.max(0, companyGoal - totalSold);

  const handleSave = () => {
    const val = parseFloat(newGoal);
    if (val > 0) {
      upsertGoal(val, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Meta Global da Empresa
          {canEdit && (
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setNewGoal(companyGoal.toString()); }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="w-3 h-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Editar Meta Global</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Valor da meta"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {companyGoal > 0 ? (
          <>
            <div className="text-2xl font-bold">{Math.min(progress, 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mb-2">
              {fmt(totalSold)} de {fmt(companyGoal)}
            </p>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  progress >= 100
                    ? "bg-green-500"
                    : progress >= 80
                    ? "bg-yellow-500"
                    : progress >= 50
                    ? "bg-primary"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              {progress >= 100
                ? "🎉 Meta batida!"
                : progress >= 80
                ? "⚡ Quase lá!"
                : `Faltam ${fmt(remaining)}`}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {canEdit ? "Defina a meta global da empresa clicando no ✏️" : "Meta global ainda não definida."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyGoalCard;
