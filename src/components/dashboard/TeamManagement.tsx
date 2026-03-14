import { useState } from "react";
import { Trash2, Loader2, Users, Shield, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface TeamMember {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  role: string;
}

const SUPER_ADMIN_ROLES = ["raiz", "admin_global"];
const ADMIN_ROLES = ["administrador", "admin_empresa", "raiz", "admin_global"];

const roleLabels: Record<string, string> = {
  vendedor: "Vendedor",
  administrador: "Administrador",
  raiz: "Super Admin",
  admin_global: "Admin Global",
  admin_empresa: "Admin Empresa",
  gerente: "Gerente",
  auditor: "Auditor",
  compliance: "Compliance",
  financeiro: "Financeiro",
  operacoes: "Operações",
};

const TeamManagement = () => {
  const { user, isSuperAdmin, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", companyId],
    queryFn: async () => {
      let profilesQuery = supabase
        .from("profiles")
        .select("user_id, full_name, email, is_active")
        .eq("is_active", true)
        .order("full_name");

      if (companyId && !isSuperAdmin) {
        profilesQuery = profilesQuery.eq("company_id", companyId);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);

      return (profiles ?? []).map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) || "vendedor",
      })) as TeamMember[];
    },
    enabled: !!user && !!companyId,
  });

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("remove-user", {
        body: { user_id: userId },
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error);

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido do sistema.",
      });

      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["sales-with-profiles"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover usuário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setRemovingId(null);
      setConfirmId(null);
    }
  };

  const canRemove = (member: TeamMember) => {
    const isSelf = member.user_id === user?.id;
    if (isSelf) return false;

    const targetIsSuperAdmin = SUPER_ADMIN_ROLES.includes(member.role);
    // Nobody can remove super admins
    if (targetIsSuperAdmin) return false;

    const targetIsAdmin = ADMIN_ROLES.includes(member.role);
    // Only super admins can remove admins
    if (targetIsAdmin && !isSuperAdmin) return false;

    // Super admins can remove anyone (except other super admins)
    if (isSuperAdmin) return true;

    // Regular admins can remove non-admin users
    if (!targetIsAdmin) return true;

    return false;
  };

  const getRoleIcon = (role: string) => {
    if (SUPER_ADMIN_ROLES.includes(role)) return <Crown className="w-4 h-4 text-primary" />;
    if (ADMIN_ROLES.includes(role)) return <Shield className="w-4 h-4 text-primary" />;
    return <User className="w-4 h-4 text-primary" />;
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Equipe
          </CardTitle>
          <CardDescription>Gerencie os colaboradores do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum colaborador encontrado</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const isSelf = member.user_id === user?.id;
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.full_name}
                          {isSelf && <span className="text-muted-foreground ml-1">(você)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {roleLabels[member.role] || member.role}
                      </Badge>
                      {canRemove(member) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setConfirmId(member.user_id)}
                          disabled={removingId === member.user_id}
                        >
                          {removingId === member.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
              As vendas e propostas registradas serão mantidas no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && handleRemove(confirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamManagement;
