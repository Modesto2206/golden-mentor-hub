import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, CreditCard, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusLabels: Record<string, string> = { pending: "Pendente", paid: "Pago", overdue: "Em Atraso" };
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  paid: "bg-green-500/10 text-green-500 border-green-500/30",
  overdue: "bg-red-500/10 text-red-500 border-red-500/30",
};

const FinancialDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["financial-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("billing-automation", {
        body: { action: "financial_summary" },
      });
      if (error) throw error;
      return data?.data || {};
    },
  });

  const { data: allBilling = [] } = useQuery({
    queryKey: ["all-billing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_billing")
        .select("*, companies(name, plano)")
        .order("due_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const markOverdue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("billing-automation", {
        body: { action: "mark_overdue" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["all-billing"] });
      toast({ title: "Atualizado", description: `${data.overdue_count} cobranças marcadas como em atraso.` });
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async (billingId: string) => {
      const { data, error } = await supabase.functions.invoke("billing-automation", {
        body: { action: "confirm_payment", billing_id: billingId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["all-billing"] });
      toast({ title: "Pagamento confirmado", description: "Próxima cobrança gerada automaticamente." });
    },
  });

  const s = summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Financeiro Geral</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markOverdue.mutate()}
          disabled={markOverdue.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${markOverdue.isPending ? "animate-spin" : ""}`} />
          Atualizar Inadimplência
        </Button>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-4 h-4" /> MRR Teórico
            </div>
            <p className="text-xl font-bold">{fmt(s.mrr_teorico || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> MRR Recebido
            </div>
            <p className="text-xl font-bold text-green-500">{fmt(s.mrr_recebido || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Em Atraso
            </div>
            <p className="text-xl font-bold text-destructive">{fmt(s.total_overdue || 0)}</p>
            <p className="text-xs text-muted-foreground">{s.overdue_company_count || 0} empresas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="w-4 h-4" /> A Receber
            </div>
            <p className="text-xl font-bold">{fmt(s.total_pending || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row: Churn + Ticket + Revenue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-4 h-4" /> Receita Anual
            </div>
            <p className="text-xl font-bold">{fmt(s.yearly_revenue || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Ticket Médio</div>
            <p className="text-xl font-bold">{fmt(s.ticket_medio || 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Churn Mensal</div>
            <p className="text-xl font-bold">{s.churn_count || 0} <span className="text-sm font-normal">({s.churn_rate || 0}%)</span></p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs mb-1">Empresas Ativas</div>
            <p className="text-xl font-bold">{s.active_companies || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Projection */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Projeção de Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">3 meses</p>
              <p className="text-lg font-bold">{fmt(s.projection_3m || 0)}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">6 meses</p>
              <p className="text-lg font-bold">{fmt(s.projection_6m || 0)}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">12 meses</p>
              <p className="text-lg font-bold">{fmt(s.projection_12m || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Cobranças Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBilling.map((bill: any) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.companies?.name || "—"}</TableCell>
                  <TableCell className="text-xs">{bill.plan_type}</TableCell>
                  <TableCell>{fmt(Number(bill.amount))}</TableCell>
                  <TableCell>{new Date(bill.due_date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${statusColors[bill.status] || ""}`}>
                      {statusLabels[bill.status] || bill.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(bill.status === "pending" || bill.status === "overdue") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmPayment.mutate(bill.id)}
                        disabled={confirmPayment.isPending}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Pagar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {allBilling.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma cobrança encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
