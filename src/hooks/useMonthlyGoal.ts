import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMonthlyGoal = () => {
  const { user, companyId } = useAuth();
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
      return data?.goal_value ?? 0;
    },
    enabled: !!user && !!companyId,
  });

  return {
    monthlyGoal: goalQuery.data ?? 0,
    isLoading: goalQuery.isLoading,
    error: goalQuery.error,
  };
};
