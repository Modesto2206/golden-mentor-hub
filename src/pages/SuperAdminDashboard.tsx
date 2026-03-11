import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, TrendingUp, Shield, BarChart3, Settings2, ShoppingCart, Ghost } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import CompanyManagementDialog from "@/components/superadmin/CompanyManagementDialog";
import FinancialDashboard from "@/components/superadmin/FinancialDashboard";
import CompanyHealthScore from "@/components/superadmin/CompanyHealthScore";

const planPrices: Record<string, number> = { basico: 97, profissional: 197, enterprise: 497, ghost: 0 };
const planLabels: Record<string, string> = { basico: "Básico", profissional: "Profissional", enterprise: "Enterprise", ghost: "Ghost" };
const statusLabels: Record<string, string> = { active: "Ativa", suspended: "Suspensa", canceled: "Cancelada" };
const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/30",
  suspended: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  canceled: "bg-red-500/10 text-red-500 border-red-500/30",
};

const SuperAdminDashboard = () => {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ["super-admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSuperAdmin,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["super-admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("company_id, is_active");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSuperAdmin,
  });

  const { data: totalSalesCount = 0 } = useQuery({
    queryKey: ["super-admin-sales-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("sales").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isSuperAdmin,
  });

  const stats = useMemo(() => {
    // Exclude ghost companies from financial metrics
    const nonGhost = companies.filter((c) => c.plano !== "ghost");
    const ghostCompanies = companies.filter((c) => c.plano === "ghost");

    const total = nonGhost.length;
    const active = nonGhost.filter((c) => c.status === "active" || !c.status).length;
    const suspended = nonGhost.filter((c) => c.status === "suspended").length;
    const canceled = nonGhost.filter((c) => c.status === "canceled").length;
    const mrr = nonGhost
      .filter((c) => c.status === "active" || !c.status)
      .reduce((sum, c) => sum + (planPrices[c.plano || "basico"] || 0), 0);

    const byPlan = new Map<string, { count: number; revenue: number }>();
    nonGhost.forEach((c) => {
      const plan = c.plano || "basico";
      const existing = byPlan.get(plan) || { count: 0, revenue: 0 };
      existing.count++;
      if (c.status === "active" || !c.status) existing.revenue += planPrices[plan] || 0;
      byPlan.set(plan, existing);
    });

    const usersPerCompany = new Map<string, number>();
    allProfiles.forEach((p) => {
      if (p.company_id && p.is_active) {
        usersPerCompany.set(p.company_id, (usersPerCompany.get(p.company_id) || 0) + 1);
      }
    });

    const totalUsers = allProfiles.filter((p) => p.is_active).length;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = nonGhost.filter((c) => new Date(c.created_at) >= thisMonth).length;

    return { total, active, suspended, canceled, mrr, byPlan, usersPerCompany, newThisMonth, totalUsers, ghostCount: ghostCompanies.length };
  }, [companies, allProfiles]);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isSuperAdmin, navigate]);

  if (authLoading || !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Building2 className="w-4 h-4" /> Empresas
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              {stats.ghostCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">+ {stats.ghostCount} ghost</p>
              )}
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
                <Users className="w-4 h-4" /> Total Usuários
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-4 h-4" /> Novos este mês
              </div>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <ShoppingCart className="w-3 h-3 inline mr-1" />{totalSalesCount} vendas globais
              </p>
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
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const userCount = stats.usersPerCompany.get(company.id) || 0;
                  const maxUsers = company.max_users || 2;
                  const status = company.status || "active";
                  const isGhost = company.plano === "ghost";
                  return (
                    <TableRow key={company.id} className={isGhost ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {company.name}
                          {isGhost && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted border-muted-foreground/20">
                              <Ghost className="w-3 h-3 mr-0.5" /> Ghost
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{company.cnpj || "—"}</TableCell>
                      <TableCell>
                        {isGhost ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {planLabels[company.plano || "basico"] || company.plano}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isGhost ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <span className={userCount >= maxUsers ? "text-destructive font-medium" : ""}>
                            {userCount}/{maxUsers}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isGhost ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Badge variant="outline" className={`text-xs ${statusColors[status] || ""}`}>
                            {statusLabels[status] || status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(company.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCompany(company);
                            setDialogOpen(true);
                          }}
                        >
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Financial Dashboard */}
        <FinancialDashboard />

        {/* Health Score */}
        <CompanyHealthScore />
      </div>

      <CompanyManagementDialog
        company={selectedCompany}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
};

export default SuperAdminDashboard;