import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, PlusCircle, List, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesWithProfiles } from "@/hooks/useSalesWithProfiles";
import { useMonthlyGoal } from "@/hooks/useMonthlyGoal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import SalesForm from "@/components/dashboard/SalesForm";
import SalesTable from "@/components/dashboard/SalesTable";
import SalesCharts from "@/components/dashboard/SalesCharts";
import SalesRanking from "@/components/dashboard/SalesRanking";
import SalesProjection from "@/components/dashboard/SalesProjection";
import TeamManagement from "@/components/dashboard/TeamManagement";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, isAdmin } = useAuth();
  const { sales, sellers, isLoading, createSale, updateSale, deleteSale, isCreating } = useSalesWithProfiles();
  const { monthlyGoal } = useMonthlyGoal();

  useEffect(() => {
    if (!authLoading && (!user || !role)) {
      navigate("/auth");
    }
  }, [user, role, authLoading, navigate]);

  if (authLoading || !user || !role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard bg-pattern flex flex-col">
      <DashboardHeader />

      <div className="flex flex-1">
        <Tabs defaultValue="dashboard" orientation="vertical" className="flex flex-1">
          {/* Sidebar esquerda */}
          <TabsList className="flex flex-col h-auto w-14 md:w-52 shrink-0 bg-card/80 backdrop-blur-sm border-r border-border/50 rounded-none justify-start gap-1 p-2 pt-4">
            <TabsTrigger value="dashboard" className="w-full justify-start gap-3 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="new-sale" className="w-full justify-start gap-3 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline text-sm">Nova Venda</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="w-full justify-start gap-3 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              <List className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline text-sm">Vendas</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="team" className="w-full justify-start gap-3 px-3 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
                <Users className="w-5 h-5 shrink-0" />
                <span className="hidden md:inline text-sm">Equipe</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Conteúdo principal */}
          <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
            <DashboardStats sales={sales} monthlyGoal={monthlyGoal} />

            <TabsContent value="dashboard" className="space-y-6 mt-0">
              <SalesCharts sales={sales} />
              <div className="grid gap-4 md:grid-cols-2">
                <SalesRanking sales={sales} />
                <SalesProjection sales={sales} monthlyGoal={monthlyGoal} />
              </div>
            </TabsContent>

            <TabsContent value="new-sale" className="mt-0">
              <SalesForm onSubmit={createSale} isSubmitting={isCreating} />
            </TabsContent>

            <TabsContent value="sales" className="mt-0">
              <SalesTable
                sales={sales}
                sellers={sellers}
                isLoading={isLoading}
                onUpdateStatus={(id, status) => updateSale({ id, status })}
                onDelete={deleteSale}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="team" className="mt-0">
                <TeamManagement />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
