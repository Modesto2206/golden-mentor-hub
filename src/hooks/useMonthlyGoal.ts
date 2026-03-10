import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useMonthlyGoal = () => {
  const { user, companyId, isAdmin, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const goalQuery = useQuery({
    queryKey: ["monthly-goal", companyId, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_goals")
        .select("id, target_value, month, year")
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

    // Realtime subscription
    const channel = supabase
      .channel(`monthly-goals-${companyId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "monthly_goals",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["monthly-goal", companyId, month, year] });
        }
      )
      .subscribe();

    // Polling fallback every 5 seconds
    const poll = () => {
      if (!isActive) return;
      queryClient.invalidateQueries({ queryKey: ["monthly-goal", companyId, month, year] });
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
      if (!companyId) throw new Error("Empresa não identificada.");
      const existing = goalQuery.data;

      if (existing) {
        const { error } = await supabase
          .from("monthly_goals")
          .update({ target_value: goalValue })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("monthly_goals")
          .insert({ company_id: companyId, month, year, target_value: goalValue });
        if (error) throw error;
      }

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        company_id: companyId,
        action: existing ? "update" : "create",
        resource: "monthly_goals",
        resource_id: existing?.id || null,
        new_data: { target_value: goalValue, month, year },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-goal"] });
      toast({ title: "Meta mensal atualizada!", description: "A meta mensal foi salva com sucesso." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Erro ao salvar meta", description: error.message });
    },
  });

  return {
    monthlyGoal: goalQuery.data?.target_value ?? 20000,
    isLoading: goalQuery.isLoading,
    canEdit: isAdmin || isSuperAdmin,
    upsertGoal: upsertGoal.mutate,
    isUpdating: upsertGoal.isPending,
  };
};
