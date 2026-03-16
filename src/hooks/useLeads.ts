import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Lead {
  id: string;
  company_id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  pipeline_stage: string;
  converted_to_client: boolean;
  converted_client_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const PIPELINE_STAGES = [
  { key: "lead", label: "Lead", color: "hsl(var(--muted))" },
  { key: "contact", label: "Contato", color: "hsl(210, 70%, 50%)" },
  { key: "simulation", label: "Simulação", color: "hsl(45, 90%, 50%)" },
  { key: "proposal_sent", label: "Proposta Enviada", color: "hsl(30, 80%, 50%)" },
  { key: "under_review", label: "Em Análise", color: "hsl(280, 60%, 55%)" },
  { key: "approved", label: "Aprovado", color: "hsl(140, 60%, 45%)" },
  { key: "paid", label: "Pago", color: "hsl(160, 70%, 40%)" },
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number]["key"];

export function useLeads() {
  const { companyId, user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["leads", companyId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("leads" as any) as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !isAuthLoading && !!companyId,
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage, previousStage }: { leadId: string; newStage: string; previousStage: string }) => {
      const { error: updateError } = await (supabase.from("leads" as any) as any)
        .update({ pipeline_stage: newStage })
        .eq("id", leadId);
      if (updateError) throw updateError;

      const { error: historyError } = await (supabase.from("pipeline_history" as any) as any)
        .insert({
          company_id: companyId,
          entity_id: leadId,
          previous_stage: previousStage,
          new_stage: newStage,
          user_id: user?.id,
        });
      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao mover lead", description: error.message });
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      // Create client from lead data
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          company_id: lead.company_id,
          full_name: lead.name,
          cpf: lead.cpf || "00000000000",
          phone: lead.phone,
          email: lead.email,
          address_city: lead.city,
          address_state: lead.state,
          internal_notes: lead.notes,
          created_by: user?.id,
        })
        .select("id")
        .single();
      if (clientError) throw clientError;

      // Update lead as converted
      const { error: updateError } = await (supabase.from("leads" as any) as any)
        .update({
          converted_to_client: true,
          converted_client_id: client.id,
        })
        .eq("id", lead.id);
      if (updateError) throw updateError;

      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Lead convertido em cliente com sucesso!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao converter lead", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await (supabase.from("leads" as any) as any)
        .delete()
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao remover lead", description: error.message });
    },
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    updateStage: updateStageMutation.mutate,
    convertToClient: convertToClientMutation.mutate,
    isConverting: convertToClientMutation.isPending,
    deleteLead: deleteMutation.mutate,
  };
}
