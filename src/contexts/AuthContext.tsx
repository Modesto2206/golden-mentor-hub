import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 
  | "vendedor" 
  | "administrador" 
  | "raiz" 
  | "admin_global" 
  | "admin_empresa" 
  | "gerente" 
  | "auditor" 
  | "compliance" 
  | "financeiro" 
  | "operacoes" 
  | null;

const ADMIN_ROLES: UserRole[] = ["administrador", "raiz", "admin_global", "admin_empresa"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  companyId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isVendedor: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [roleResult, profileResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("company_id")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (roleResult.error) console.error("Error fetching role:", roleResult.error);
      if (profileResult.error) console.error("Error fetching profile:", profileResult.error);

      return {
        role: (roleResult.data?.role as UserRole) ?? null,
        companyId: profileResult.data?.company_id ?? null,
      };
    } catch (err) {
      console.error("Error in fetchUserData:", err);
      return { role: null as UserRole, companyId: null };
    }
  };

  const provisionNewUser = async () => {
    try {
      const { error } = await supabase.functions.invoke("setup-new-user");
      if (error) {
        console.error("Error provisioning user:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error calling setup-new-user:", err);
      return false;
    }
  };

  const loadUserData = async (userId: string, retries = 0): Promise<{ role: UserRole; companyId: string | null }> => {
    let userData = await fetchUserData(userId);

    // If no role or no companyId, auto-provision
    if (!userData.role || !userData.companyId) {
      const provisioned = await provisionNewUser();
      if (provisioned) {
        // Re-fetch after provisioning
        userData = await fetchUserData(userId);
      }
      // If still incomplete and haven't retried, wait and try once more
      if ((!userData.role || !userData.companyId) && retries < 1) {
        await new Promise((r) => setTimeout(r, 1500));
        return loadUserData(userId, retries + 1);
      }
    }

    return userData;
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserData(session.user.id).then(({ role, companyId }) => {
              if (!isMounted) return;
              setRole(role);
              setCompanyId(companyId);
            });
          }, 0);
        } else {
          setRole(null);
          setCompanyId(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user.id).then(({ role, companyId }) => {
          if (!isMounted) return;
          setRole(role);
          setCompanyId(companyId);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setCompanyId(null);
  };

  const value = {
    user,
    session,
    role,
    companyId,
    isLoading,
    isAdmin: ADMIN_ROLES.includes(role),
    isSuperAdmin: role === "raiz" || role === "admin_global",
    isVendedor: role === "vendedor",
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
