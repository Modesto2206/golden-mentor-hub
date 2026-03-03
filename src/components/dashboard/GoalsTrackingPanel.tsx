import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Users } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const GoalsTrackingPanel = () => {
  const { user, companyId, isAdmin, isSuperAdmin, isVendedor } = useAuth();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get all profiles for the company (or all if super admin)
  const { data: profiles = [] } = useQuery({
    queryKey: ["goals-tracking-profiles", companyId],
    queryFn: async () => {
      const query = supabase.from("profiles").select("user_id, full_name, email, company_id, is_active");
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Get roles for all users
  const { data: roles = [] } = useQuery({
    queryKey: ["goals-tracking-roles", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Get all sales for current month
  const { data: sales = [] } = useQuery({
    queryKey: ["goals-tracking-sales", companyId, currentMonth, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("seller_id, released_value, commission_value, status, sale_date");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Get individual monthly goals
  const { data: monthlyGoals = [] } = useQuery({
    queryKey: ["goals-tracking-monthly", currentMonth + 1, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_goals")
        .select("*")
        .eq("month", currentMonth + 1)
        .eq("year", currentYear);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));
  const roleLabels: Record<string, string> = {
    vendedor: "Vendedor",
    administrador: "Admin",
    admin_empresa: "Admin",
    gerente: "Gerente",
    raiz: "Super Admin",
    admin_global: "Super Admin",
  };

  // Filter current month sales (paid)
  const monthSales = sales.filter((s) => {
    const d = new Date(s.sale_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status === "pago";
  });

  // Build user stats
  const activeProfiles = profiles.filter((p) => p.is_active);
  const filteredProfiles = isVendedor
    ? activeProfiles.filter((p) => p.user_id === user?.id)
    : activeProfiles;

  // Default goal from monthly_goals (first found)
  const defaultGoal = monthlyGoals.length > 0 ? Number(monthlyGoals[0].target_value) : 20000;

  const userStats = filteredProfiles
    .map((profile) => {
      const role = roleMap.get(profile.user_id) || "vendedor";
      const userSales = monthSales.filter((s) => s.seller_id === profile.user_id);
      const totalSold = userSales.reduce((sum, s) => sum + Number(s.released_value), 0);
      const totalCommission = userSales.reduce((sum, s) => sum + Number(s.commission_value || 0), 0);
      const individualGoal = defaultGoal;
      const progress = individualGoal > 0 ? (totalSold / individualGoal) * 100 : 0;

      return {
        user_id: profile.user_id,
        name: profile.full_name,
        role,
        roleLabel: roleLabels[role] || role,
        totalSold,
        totalCommission,
        salesCount: userSales.length,
        individualGoal,
        progress,
      };
    })
    .sort((a, b) => b.progress - a.progress);

  const totalTeamSold = userStats.reduce((sum, u) => sum + u.totalSold, 0);
  const totalTeamCommission = userStats.reduce((sum, u) => sum + u.totalCommission, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Membros</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.length}</div>
            <p className="text-xs text-muted-foreground">usuários ativos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendido</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalTeamSold)}</div>
            <p className="text-xs text-muted-foreground">no mês atual</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Comissões</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{fmt(totalTeamCommission)}</div>
            <p className="text-xs text-muted-foreground">geradas no mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Acompanhamento de Metas
          </CardTitle>
          <CardDescription>Desempenho individual no mês atual</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Meta Individual</TableHead>
                <TableHead>Vendido</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum dado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                userStats.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {u.roleLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmt(u.individualGoal)}</TableCell>
                    <TableCell>{fmt(u.totalSold)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={Math.min(u.progress, 100)} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">
                          {u.progress.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-primary font-medium">
                      {fmt(u.totalCommission)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoalsTrackingPanel;
