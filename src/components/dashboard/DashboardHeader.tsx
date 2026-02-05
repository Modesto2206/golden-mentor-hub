import { LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import AddUserModal from "./AddUserModal";
import logoCredmais from "@/assets/logo-credmais.png";

const DashboardHeader = () => {
  const { signOut, isAdmin, isVendedor } = useAuth();
  const { currentProfile } = useProfiles();

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoCredmais} alt="Cred+" className="h-10 w-10 rounded-lg" />
          <h1 className="text-xl font-bold text-gold-gradient">Área do Vendedor</h1>
          {isAdmin && (
            <Badge variant="outline" className="border-primary/50 text-primary gap-1">
              <Shield className="w-3 h-3" />
              Administrador
            </Badge>
          )}
          {isVendedor && (
            <Badge variant="outline" className="border-primary/50 text-primary gap-1">
              <User className="w-3 h-3" />
              Vendedor
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && <AddUserModal />}
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium">{currentProfile?.full_name || "Usuário"}</p>
            <p className="text-xs text-muted-foreground">{currentProfile?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
