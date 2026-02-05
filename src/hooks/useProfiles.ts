import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfiles = () => {
  const { user, isAdmin } = useAuth();

  const profilesQuery = useQuery({
    queryKey: ["profiles", user?.id, isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user,
  });

  const currentProfileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  return {
    profiles: profilesQuery.data ?? [],
    currentProfile: currentProfileQuery.data,
    isLoading: profilesQuery.isLoading || currentProfileQuery.isLoading,
    error: profilesQuery.error || currentProfileQuery.error,
  };
};
