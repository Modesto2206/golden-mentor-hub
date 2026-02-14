import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const usePermissions = (resource: string) => {
  const { user, role, isAdmin, isSuperAdmin } = useAuth();

  const { data: permissions = [] } = useQuery({
    queryKey: ["permissions", user?.id, resource],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("action")
        .eq("resource", resource as any)
        .eq("role", role as any);
      if (error) throw error;
      return data.map((p) => p.action);
    },
    enabled: !!user && !!role,
  });

  return {
    canView: permissions.includes("view") || isAdmin || isSuperAdmin,
    canCreate: permissions.includes("create") || isAdmin || isSuperAdmin,
    canUpdate: permissions.includes("update") || isAdmin || isSuperAdmin,
    canDelete: permissions.includes("delete") || isAdmin || isSuperAdmin,
  };
};
