import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useBillingStatus = () => {
  const { companyId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["billing-status", companyId],
    queryFn: async () => {
      const { data: billing, error } = await supabase
        .from("company_billing")
        .select("*")
        .eq("company_id", companyId!)
        .order("due_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      const hasOverdue = billing?.some((b: any) => b.status === "overdue") || false;
      const latestPending = billing?.find((b: any) => b.status === "pending");
      const latestOverdue = billing?.find((b: any) => b.status === "overdue");

      return {
        billing: billing || [],
        hasOverdue,
        isBlocked: hasOverdue,
        latestPending,
        latestOverdue,
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10,
  });

  return {
    billing: data?.billing || [],
    hasOverdue: data?.hasOverdue || false,
    isBlocked: data?.isBlocked || false,
    latestPending: data?.latestPending,
    latestOverdue: data?.latestOverdue,
    isLoading,
  };
};
