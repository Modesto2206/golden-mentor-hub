import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useCompanyGoal = () => {
  const { user, companyId, isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const goalQuery = useQuery({
    queryKey: ["company-goal", companyId, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_goals")
        .select("*")
        .eq("company_id", companyId!)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!companyId,
  });

  // Realtime subscription + polling fallback for instant sync across all users
  useEffect(() => {
    if (!companyId) return;
    let isActive = true;
    let pollTimer: ReturnType<typeof setTimeout>;

    const channel = supabase
      .channel(`company-goals-${companyId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "company_goals",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["company-goal", companyId, month, year] });
        }
      )
      .subscribe();

    const poll = () => {
      if (!isActive) return;
      queryClient.invalidateQueries({ queryKey: ["company-goal", companyId, month, year] });
      pollTimer = setTimeout(poll, 5000);
    };
    pollTimer = setTimeout(poll, 5000);

    return () => {
      isActive = false;
      clearTimeout(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [companyId, month, year, queryClient]);

  const upsertGoal = useMutation({
    mutationFn: async (goalValue: number) => {
      if (!companyId) throw new Error("Empresa não identificada. Faça login novamente.");
      const existing = goalQuery.data;

      if (existing) {
        const { error } = await supabase
          .from("company_goals")
          .update({ goal_value: goalValue })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_goals")
          .insert({ company_id: companyId!, month, year, goal_value: goalValue });
        if (error) throw error;
      }

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        company_id: companyId,
        action: existing ? "update" : "create",
        resource: "company_goals",
        resource_id: existing?.id || null,
        new_data: { goal_value: goalValue, month, year },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-goal"] });
      toast({ title: "Meta global atualizada!", description: "A meta da empresa foi salva com sucesso." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao salvar meta", description: error.message });
    },
  });

  return {
    companyGoal: goalQuery.data?.goal_value ?? 0,
    isLoading: goalQuery.isLoading,
    upsertGoal: upsertGoal.mutate,
    isUpdating: upsertGoal.isPending,
    canEdit: isAdmin,
  };
};
