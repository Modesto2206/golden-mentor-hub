import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useCompanyStatus = () => {
  const { companyId } = useAuth();

  const { data } = useQuery({
    queryKey: ["company-status", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("status, max_users, plano, name")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data as { status: string; max_users: number; plano: string; name: string };
    },
    enabled: !!companyId,
  });

  return {
    companyStatus: data?.status ?? "active",
    isSuspended: data?.status === "suspended",
    isCanceled: data?.status === "canceled",
    isReadOnly: data?.status === "suspended" || data?.status === "canceled",
    maxUsers: data?.max_users ?? 2,
    plano: data?.plano ?? "basico",
    companyName: data?.name ?? "",
  };
};
