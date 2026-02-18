import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CompanySettings {
  id: string;
  company_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useCompanySettings = () => {
  const { companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["company-settings", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data as CompanySettings | null;
    },
    enabled: !!companyId,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: Partial<Pick<CompanySettings, "primary_color" | "secondary_color" | "accent_color" | "logo_url">>) => {
      if (!companyId) throw new Error("Sem empresa");

      const { data: existing } = await supabase
        .from("company_settings")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("company_settings")
          .update(updates)
          .eq("company_id", companyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_settings")
          .insert({ company_id: companyId, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings", companyId] });
      toast({ title: "Configurações salvas com sucesso!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    if (!companyId) throw new Error("Sem empresa");
    const ext = file.name.split(".").pop();
    const path = `${companyId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  return { settings, isLoading, upsertSettings, uploadLogo };
};
