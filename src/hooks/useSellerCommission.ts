import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useRef } from "react";

interface BracketInfo {
  min: number;
  max: number;
  rate: string;
  active: boolean;
  reached: boolean;
}

interface NextBracket {
  rate: string;
  missing: number;
  min_volume: number;
}

export interface CommissionData {
  total_volume: number;
  applied_rate: number;
  commission_value: number;
  current_bracket: string | null;
  next_bracket: NextBracket | null;
  should_celebrate: boolean;
  celebration_message: string;
  celebrated_ranges: string[];
  brackets: BracketInfo[];
}

export const useSellerCommission = () => {
  const { user, isVendedor } = useAuth();
  const celebratedRef = useRef(false);

  const query = useQuery({
    queryKey: ["seller-commission", user?.id],
    queryFn: async (): Promise<CommissionData> => {
      const { data, error } = await supabase.functions.invoke("calculate-commission");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao calcular comissão");
      return data.data;
    },
    enabled: !!user && isVendedor,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 5 * 60000, // Refresh every 5 minutes
  });

  const resetCelebration = useCallback(() => {
    celebratedRef.current = true;
  }, []);

  return {
    commission: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    shouldCelebrate: query.data?.should_celebrate && !celebratedRef.current,
    resetCelebration,
  };
};
