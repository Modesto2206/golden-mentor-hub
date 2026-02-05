import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type CovenantType = "INSS" | "Forças Armadas" | "SIAPE" | "CLT" | "FGTS" | "Outros";
export type SaleStatus = "em_andamento" | "pago" | "cancelado";

export interface Sale {
  id: string;
  seller_id: string;
  client_name: string;
  covenant_type: CovenantType;
  released_value: number;
  commission_percentage: number;
  commission_value: number;
  sale_date: string;
  status: SaleStatus;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSaleData {
  client_name: string;
  covenant_type: CovenantType;
  released_value: number;
  commission_percentage: number;
  sale_date: string;
  observations?: string;
}

export interface UpdateSaleData extends Partial<CreateSaleData> {
  status?: SaleStatus;
}

export const useSales = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const salesQuery = useQuery({
    queryKey: ["sales", user?.id, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("sale_date", { ascending: false });

      if (error) throw error;
      return data as Sale[];
    },
    enabled: !!user,
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      const { data, error } = await supabase
        .from("sales")
        .insert({
          ...saleData,
          seller_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast({
        title: "Venda registrada!",
        description: "A venda foi cadastrada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao registrar venda",
        description: error.message,
      });
    },
  });

  const updateSaleMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateSaleData & { id: string }) => {
      const { data, error } = await supabase
        .from("sales")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast({
        title: "Venda atualizada!",
        description: "Os dados da venda foram atualizados.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar venda",
        description: error.message,
      });
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast({
        title: "Venda excluída",
        description: "A venda foi removida do sistema.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir venda",
        description: error.message,
      });
    },
  });

  return {
    sales: salesQuery.data ?? [],
    isLoading: salesQuery.isLoading,
    error: salesQuery.error,
    createSale: createSaleMutation.mutate,
    updateSale: updateSaleMutation.mutate,
    deleteSale: deleteSaleMutation.mutate,
    isCreating: createSaleMutation.isPending,
    isUpdating: updateSaleMutation.isPending,
    isDeleting: deleteSaleMutation.isPending,
  };
};
