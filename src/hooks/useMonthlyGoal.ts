import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMonthlyGoal = () => {
  const { user, companyId } = useAuth();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const goalQuery = useQuery({
    queryKey: ["monthly-goal", month, year, companyId],
    queryFn: async () => {
      const query = supabase
        .from("monthly_goals")
        .select("*")
        .eq("month", month)
        .eq("year", year);

      if (companyId) {
        query.eq("company_id", companyId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data?.target_value ?? 20000;
    },
    enabled: !!user,
  });

  return {
    monthlyGoal: goalQuery.data ?? 20000,
    isLoading: goalQuery.isLoading,
    error: goalQuery.error,
  };
};
