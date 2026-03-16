import { ReactNode, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useCompanyStatus } from "@/hooks/useCompanyStatus";

import { 
  LayoutDashboard, Building2, Users, FileText, PlusCircle, 
  LogOut, Shield, User, ChevronLeft, ChevronRight,
  Landmark, ShoppingBag, Settings, BarChart3, AlertTriangle, MessageCircle, UserRoundSearch, Kanban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AddUserModal from "@/components/dashboard/AddUserModal";
import WhatsAppButton from "@/components/WhatsAppButton";
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
  { label: "Leads", icon: <UserRoundSearch className="w-5 h-5" />, href: "/leads" },
  { label: "Pipeline", icon: <Kanban className="w-5 h-5" />, href: "/pipeline" },
  { label: "Bancos", icon: <Landmark className="w-5 h-5" />, href: "/bancos" },
  { label: "Relatório", icon: <BarChart3 className="w-5 h-5" />, href: "/relatorio", roles: ["administrador", "raiz", "admin_global", "admin_empresa", "gerente", "financeiro"] },
  { label: "Loja", icon: <ShoppingBag className="w-5 h-5" />, href: "/loja" },
  { label: "WhatsApp", icon: <MessageCircle className="w-5 h-5" />, href: "/whatsapp" },
  { label: "Super Admin", icon: <Shield className="w-5 h-5" />, href: "/super-admin", roles: ["raiz", "admin_global"] },
  { label: "Configurações", icon: <Settings className="w-5 h-5" />, href: "/configuracoes", roles: ["administrador", "raiz", "admin_global", "admin_empresa"] },
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
  const { settings: companySettings } = useCompanySettings();
  const { isSuspended, isCanceled, isReadOnly } = useCompanyStatus();
  
  const [collapsed, setCollapsed] = useState(false);

  const hasCustomLogo = !!companySettings?.logo_url;
  const logo = hasCustomLogo ? companySettings.logo_url! : (resolvedTheme === "dark" ? logoFull : logoLight);

  // Memoize HEX to HSL conversion
  const primaryHSL = useMemo(() => {
    const hex = companySettings?.primary_color;
    if (!hex) return null;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = ((b - r) / d + 2);
      else h = ((r - g) / d + 4);
      h *= 60;
    }
    return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }, [companySettings?.primary_color]);

  // Apply custom primary color as CSS variable
  useEffect(() => {
    if (primaryHSL) {
      document.documentElement.style.setProperty("--primary", primaryHSL);
      document.documentElement.style.setProperty("--accent", primaryHSL);
      document.documentElement.style.setProperty("--ring", primaryHSL);
    }
    return () => {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--ring");
    };
  }, [primaryHSL]);

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
            <img src={logo} alt="Cred+" width={90} height={90} className="h-[90px] w-auto object-contain" />
            <Badge variant="outline" className="border-primary/50 text-primary gap-1 hidden sm:flex">
              {role === "vendedor" ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              {roleLabels[role] || role}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && <AddUserModal />}
            
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
          {isReadOnly && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {isSuspended
                  ? "Sua empresa está suspensa. O acesso é somente leitura. Entre em contato com o administrador."
                  : "Sua empresa foi cancelada. O acesso é somente leitura."}
              </AlertDescription>
            </Alert>
          )}
          {children}
        </main>
      </div>
      
    </div>
  );
};

export default AppLayout;
