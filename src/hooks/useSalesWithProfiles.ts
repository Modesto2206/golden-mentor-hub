import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Sale, CreateSaleData, UpdateSaleData, SaleStatus, CovenantType } from "@/hooks/useSales";

export interface SaleWithProfile extends Sale {
  seller_name?: string;
  seller_email?: string;
}

export const useSalesWithProfiles = () => {
  const { user, isAdmin, companyId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const salesQuery = useQuery({
    queryKey: ["sales-with-profiles", user?.id, isAdmin],
    queryFn: async () => {
      // Get sales - select only needed columns
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("id, seller_id, client_name, covenant_type, operation_type, financial_institution, released_value, commission_percentage, commission_value, sale_date, status, observations, created_at, updated_at, company_id")
        .order("sale_date", { ascending: false });

      if (salesError) throw salesError;

      // Get all profiles for mapping
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, { name: p.full_name, email: p.email }])
      );

      // Enrich sales with seller info
      const enrichedSales: SaleWithProfile[] = (sales ?? []).map((sale) => ({
        ...sale,
        seller_name: profileMap.get(sale.seller_id)?.name || "Desconhecido",
        seller_email: profileMap.get(sale.seller_id)?.email || "",
      }));

      return enrichedSales;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // Get unique sellers for filter
  const sellers = salesQuery.data
    ? [...new Map(salesQuery.data.map((s) => [s.seller_id, { id: s.seller_id, name: s.seller_name || "Desconhecido" }])).values()]
    : [];

  

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: CreateSaleData) => {
      if (!companyId) throw new Error("Empresa não identificada.");
      const { data, error } = await supabase
        .from("sales")
        .insert({
          ...saleData,
          seller_id: user!.id,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-with-profiles"] });
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
      queryClient.invalidateQueries({ queryKey: ["sales-with-profiles"] });
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
      queryClient.invalidateQueries({ queryKey: ["sales-with-profiles"] });
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
    sellers,
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

export type { Sale, CreateSaleData, UpdateSaleData, SaleStatus, CovenantType, OperationType } from "@/hooks/useSales";
