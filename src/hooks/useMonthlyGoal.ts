import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMonthlyGoal = () => {
  const { user } = useAuth();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const goalQuery = useQuery({
    queryKey: ["monthly-goal", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_goals")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

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
