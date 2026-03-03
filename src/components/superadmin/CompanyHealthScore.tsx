import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity } from "lucide-react";

interface CompanyHealth {
  id: string;
  name: string;
  score: number;
  classification: "Saudável" | "Atenção" | "Risco";
  billingOk: boolean;
  hasUsers: boolean;
  hasSales: boolean;
}

const classColors: Record<string, string> = {
  "Saudável": "bg-green-500/10 text-green-500 border-green-500/30",
  "Atenção": "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  "Risco": "bg-red-500/10 text-red-500 border-red-500/30",
};

const CompanyHealthScore = () => {
  const { data: healthData = [] } = useQuery({
    queryKey: ["company-health-scores"],
    queryFn: async () => {
      const [companiesRes, profilesRes, billingRes, salesRes] = await Promise.all([
        supabase.from("companies").select("id, name, plano, status").neq("plano", "ghost"),
        supabase.from("profiles").select("company_id, is_active"),
        supabase.from("company_billing").select("company_id, status"),
        supabase.from("sales").select("company_id, status").eq("status", "pago"),
      ]);

      const companies = companiesRes.data || [];
      const profiles = profilesRes.data || [];
      const billing = billingRes.data || [];
      const sales = salesRes.data || [];

      return companies
        .filter((c) => c.status === "active")
        .map((company): CompanyHealth => {
          let score = 0;

          // Billing check (30 points)
          const companyBills = billing.filter((b: any) => b.company_id === company.id);
          const hasOverdue = companyBills.some((b: any) => b.status === "overdue");
          const billingOk = !hasOverdue;
          if (billingOk) score += 30;

          // Users (20 points)
          const activeUsers = profiles.filter((p: any) => p.company_id === company.id && p.is_active).length;
          const hasUsers = activeUsers > 0;
          if (activeUsers >= 2) score += 20;
          else if (activeUsers === 1) score += 10;

          // Sales activity (30 points)
          const companySales = sales.filter((s: any) => s.company_id === company.id).length;
          const hasSales = companySales > 0;
          if (companySales >= 5) score += 30;
          else if (companySales >= 1) score += 15;

          // Active status (20 points)
          if (company.status === "active") score += 20;

          const classification: CompanyHealth["classification"] =
            score >= 70 ? "Saudável" : score >= 40 ? "Atenção" : "Risco";

          return { id: company.id, name: company.name, score, classification, billingOk, hasUsers, hasSales };
        })
        .sort((a, b) => a.score - b.score);
    },
  });

  const riskCount = healthData.filter((h) => h.classification === "Risco").length;
  const attentionCount = healthData.filter((h) => h.classification === "Atenção").length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" /> Health Score das Empresas
          {riskCount > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px]">
              {riskCount} em risco
            </Badge>
          )}
          {attentionCount > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-[10px]">
              {attentionCount} atenção
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthData.map((h) => (
              <TableRow key={h.id}>
                <TableCell className="font-medium">{h.name}</TableCell>
                <TableCell>
                  <span className="font-bold">{h.score}</span>
                  <span className="text-muted-foreground text-xs">/100</span>
                </TableCell>
                <TableCell>{h.billingOk ? "✅" : "❌"}</TableCell>
                <TableCell>{h.hasUsers ? "✅" : "❌"}</TableCell>
                <TableCell>{h.hasSales ? "✅" : "❌"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${classColors[h.classification]}`}>
                    {h.classification}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CompanyHealthScore;
