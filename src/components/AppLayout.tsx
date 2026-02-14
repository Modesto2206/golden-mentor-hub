import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { 
  LayoutDashboard, Building2, Users, FileText, PlusCircle, 
  LogOut, Shield, User, ChevronLeft, ChevronRight,
  Landmark, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import logoFull from "@/assets/logo-credmais-full.png";
import logoLight from "@/assets/logo-credmais-light.png";

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, href: "/dashboard" },
  { label: "Propostas", icon: <FileText className="w-5 h-5" />, href: "/propostas" },
  { label: "Nova Proposta", icon: <PlusCircle className="w-5 h-5" />, href: "/propostas/nova" },
  { label: "Clientes", icon: <Users className="w-5 h-5" />, href: "/clientes" },
  { label: "Bancos", icon: <Landmark className="w-5 h-5" />, href: "/bancos" },
  { label: "Loja", icon: <ShoppingBag className="w-5 h-5" />, href: "/loja" },
];

const roleLabels: Record<string, string> = {
  vendedor: "Vendedor",
  administrador: "Administrador",
  raiz: "Raiz",
  admin_global: "Admin Global",
  admin_empresa: "Admin Empresa",
  gerente: "Gerente",
  auditor: "Auditor",
  compliance: "Compliance",
  financeiro: "Financeiro",
  operacoes: "Operações",
};

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, isLoading, signOut, isAdmin } = useAuth();
  const { resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const logo = resolvedTheme === "dark" ? logoFull : logoLight;

  useEffect(() => {
    if (!isLoading && (!user || !role)) {
      navigate("/auth");
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading || !user || !role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const filteredNav = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  return (
    <div className="min-h-screen bg-dashboard bg-pattern flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Cred+" className="h-[90px] w-auto object-contain" />
            <Badge variant="outline" className="border-primary/50 text-primary gap-1 hidden sm:flex">
              {role === "vendedor" ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              {roleLabels[role] || role}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{user.user_metadata?.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={cn(
          "bg-card/80 backdrop-blur-sm border-r border-border/50 flex flex-col transition-all duration-200 shrink-0",
          collapsed ? "w-14" : "w-14 md:w-52"
        )}>
          <nav className="flex-1 p-2 pt-4 space-y-1">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/dashboard" && location.pathname.startsWith(item.href.split("?")[0]));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={cn("hidden md:inline", collapsed && "md:hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
