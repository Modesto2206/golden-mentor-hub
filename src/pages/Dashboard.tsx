import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, PlusCircle, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesWithProfiles } from "@/hooks/useSalesWithProfiles";
import { useMonthlyGoal } from "@/hooks/useMonthlyGoal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import SalesForm from "@/components/dashboard/SalesForm";
import SalesTable from "@/components/dashboard/SalesTable";
import SalesCharts from "@/components/dashboard/SalesCharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useAuth();
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
    <div className="min-h-screen bg-background bg-pattern">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <DashboardStats sales={sales} monthlyGoal={monthlyGoal} />

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="new-sale" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Venda</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <SalesCharts sales={sales} />
          </TabsContent>

          <TabsContent value="new-sale">
            <SalesForm onSubmit={createSale} isSubmitting={isCreating} />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTable
              sales={sales}
              sellers={sellers}
              isLoading={isLoading}
              onUpdateStatus={(id, status) => updateSale({ id, status })}
              onDelete={deleteSale}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
