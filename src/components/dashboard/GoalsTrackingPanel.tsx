import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, TrendingUp, Users, Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const GoalsTrackingPanel = () => {
  const { user, companyId, isAdmin, isSuperAdmin, isVendedor } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [editUser, setEditUser] = useState<{ user_id: string; name: string; currentGoal: number } | null>(null);
  const [goalValue, setGoalValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["goals-tracking-profiles", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email, company_id, is_active");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["goals-tracking-roles", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  });

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
    staleTime: 1000 * 60 * 2,
  });

  // Individual goals from `goals` table (has seller_id)
  const { data: individualGoals = [] } = useQuery({
    queryKey: ["goals-individual", companyId, currentMonth + 1, currentYear],
    queryFn: async () => {
      const query = supabase
        .from("goals")
        .select("*")
        .eq("month", currentMonth + 1)
        .eq("year", currentYear);
      if (companyId) query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  });

  // Fallback default from monthly_goals
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

  const goalMap = new Map(individualGoals.map((g) => [g.seller_id, g]));
  const defaultGoal = monthlyGoals.length > 0 ? Number(monthlyGoals[0].target_value) : 20000;

  const monthSales = sales.filter((s) => {
    const d = new Date(s.sale_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && s.status === "pago";
  });

  const activeProfiles = profiles.filter((p) => p.is_active);
  const filteredProfiles = isVendedor
    ? activeProfiles.filter((p) => p.user_id === user?.id)
    : activeProfiles;

  const userStats = filteredProfiles
    .map((profile) => {
      const role = roleMap.get(profile.user_id) || "vendedor";
      const userSales = monthSales.filter((s) => s.seller_id === profile.user_id);
      const totalSold = userSales.reduce((sum, s) => sum + Number(s.released_value), 0);
      const totalCommission = userSales.reduce((sum, s) => sum + Number(s.commission_value || 0), 0);
      const goalRecord = goalMap.get(profile.user_id);
      const individualGoal = goalRecord ? Number(goalRecord.target_value) : defaultGoal;
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
        hasCustomGoal: !!goalRecord,
        progress,
      };
    })
    .sort((a, b) => b.progress - a.progress);

  const totalTeamSold = userStats.reduce((sum, u) => sum + u.totalSold, 0);
  const totalTeamCommission = userStats.reduce((sum, u) => sum + u.totalCommission, 0);

  const canEdit = isAdmin || isSuperAdmin;

  const handleEditGoal = (u: typeof userStats[0]) => {
    setEditUser({ user_id: u.user_id, name: u.name, currentGoal: u.individualGoal });
    setGoalValue(u.individualGoal.toString());
  };

  const handleSaveGoal = async () => {
    if (!editUser || !companyId) return;
    const val = parseFloat(goalValue);
    if (isNaN(val) || val <= 0) {
      toast({ variant: "destructive", title: "Valor inválido", description: "Informe um valor positivo." });
      return;
    }

    setIsSaving(true);
    try {
      const existing = goalMap.get(editUser.user_id);

      if (existing) {
        const { error } = await supabase
          .from("goals")
          .update({ target_value: val })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("goals")
          .insert({
            company_id: companyId,
            seller_id: editUser.user_id,
            month: currentMonth + 1,
            year: currentYear,
            target_value: val,
          });
        if (error) throw error;
      }

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        company_id: companyId,
        action: existing ? "update" : "create",
        resource: "goals",
        resource_id: existing?.id || null,
        new_data: { seller_id: editUser.user_id, target_value: val, month: currentMonth + 1, year: currentYear },
      });

      queryClient.invalidateQueries({ queryKey: ["goals-individual"] });
      toast({ title: "Meta atualizada!", description: `Meta de ${editUser.name} definida para ${fmt(val)}.` });
      setEditUser(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao salvar meta", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

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
                {canEdit && <TableHead className="w-[60px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {fmt(u.individualGoal)}
                        {u.hasCustomGoal && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            personalizada
                          </Badge>
                        )}
                      </div>
                    </TableCell>
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
                    {canEdit && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditGoal(u)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Editar Meta Individual
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Definir meta mensal para <strong>{editUser.name}</strong>
              </p>
              <div>
                <label className="text-sm font-medium mb-1 block">Valor da Meta (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  placeholder="20000.00"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                <Button onClick={handleSaveGoal} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Salvar Meta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalsTrackingPanel;
