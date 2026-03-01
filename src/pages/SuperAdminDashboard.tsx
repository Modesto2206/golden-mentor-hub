import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, TrendingUp, Shield, BarChart3 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const planPrices: Record<string, number> = {
  basico: 97,
  profissional: 197,
  enterprise: 497,
};

const planLabels: Record<string, string> = {
  basico: "Básico",
  profissional: "Profissional",
  enterprise: "Enterprise",
};

const statusLabels: Record<string, string> = {
  active: "Ativa",
  suspended: "Suspensa",
  canceled: "Cancelada",
};

const SuperAdminDashboard = () => {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: companies = [] } = useQuery({
    queryKey: ["super-admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSuperAdmin,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["super-admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_id, is_active");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSuperAdmin,
  });

  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => (c as any).status === "active" || !(c as any).status).length;
    const suspended = companies.filter((c) => (c as any).status === "suspended").length;
    const canceled = companies.filter((c) => (c as any).status === "canceled").length;

    // MRR
    const mrr = companies
      .filter((c) => (c as any).status === "active" || !(c as any).status)
      .reduce((sum, c) => sum + (planPrices[c.plano || "basico"] || 0), 0);

    // Revenue by plan
    const byPlan = new Map<string, { count: number; revenue: number }>();
    companies.forEach((c) => {
      const plan = c.plano || "basico";
      const existing = byPlan.get(plan) || { count: 0, revenue: 0 };
      existing.count++;
      if ((c as any).status === "active" || !(c as any).status) {
        existing.revenue += planPrices[plan] || 0;
      }
      byPlan.set(plan, existing);
    });

    // Users per company
    const usersPerCompany = new Map<string, number>();
    allProfiles.forEach((p) => {
      if (p.company_id && p.is_active) {
        usersPerCompany.set(p.company_id, (usersPerCompany.get(p.company_id) || 0) + 1);
      }
    });

    // Monthly growth (companies created this month)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = companies.filter((c) => new Date(c.created_at) >= thisMonth).length;

    return { total, active, suspended, canceled, mrr, byPlan, usersPerCompany, newThisMonth };
  }, [companies, allProfiles]);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (!authLoading && !isSuperAdmin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gold-gradient">Painel Super Admin</h1>
            <p className="text-sm text-muted-foreground">Visão geral de todas as empresas</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Building2 className="w-4 h-4" /> Total Empresas
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Building2 className="w-4 h-4 text-green-500" /> Ativas
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.suspended} suspensas · {stats.canceled} canceladas
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="w-4 h-4" /> MRR
              </div>
              <p className="text-2xl font-bold">{fmt(stats.mrr)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-4 h-4" /> Novos este mês
              </div>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Plan */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Receita por Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Array.from(stats.byPlan.entries()).map(([plan, data]) => (
                <div key={plan} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
                  <p className="text-sm font-medium">{planLabels[plan] || plan}</p>
                  <p className="text-xl font-bold mt-1">{data.count} empresas</p>
                  <p className="text-sm text-muted-foreground">{fmt(data.revenue)}/mês</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Todas as Empresas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const userCount = stats.usersPerCompany.get(company.id) || 0;
                  const maxUsers = (company as any).max_users || 2;
                  const status = (company as any).status || "active";
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="font-mono text-xs">{company.cnpj || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {planLabels[company.plano || "basico"] || company.plano}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={userCount >= maxUsers ? "text-destructive font-medium" : ""}>
                          {userCount}/{maxUsers}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {statusLabels[status] || status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(company.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SuperAdminDashboard;
