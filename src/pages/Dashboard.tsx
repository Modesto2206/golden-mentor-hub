import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, PlusCircle, List, Users } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesWithProfiles } from "@/hooks/useSalesWithProfiles";
import { useMonthlyGoal } from "@/hooks/useMonthlyGoal";
import { useDashboardLayout, WidgetConfig } from "@/hooks/useDashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import SalesForm from "@/components/dashboard/SalesForm";
import SalesTable from "@/components/dashboard/SalesTable";
import SalesCharts from "@/components/dashboard/SalesCharts";
import SalesRanking from "@/components/dashboard/SalesRanking";
import SalesProjection from "@/components/dashboard/SalesProjection";
import TeamManagement from "@/components/dashboard/TeamManagement";
import SortableWidget from "@/components/dashboard/SortableWidget";
import EditModeToolbar from "@/components/dashboard/EditModeToolbar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading, isAdmin } = useAuth();
  const { sales, sellers, isLoading, createSale, updateSale, deleteSale, isCreating } = useSalesWithProfiles();
  const { monthlyGoal } = useMonthlyGoal();
  const {
    layout,
    isEditMode,
    enterEditMode,
    confirmLayout,
    cancelEdit,
    resetLayout,
    reorderWidgets,
    toggleWidgetVisibility,
  } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

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

  // Map widget IDs to their content
  const widgetContentMap: Record<string, ReactNode> = {
    stats: <DashboardStats sales={sales} monthlyGoal={monthlyGoal} />,
    charts: <SalesCharts sales={sales} />,
    ranking: <SalesRanking sales={sales} />,
    projection: <SalesProjection sales={sales} monthlyGoal={monthlyGoal} />,
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = layout.findIndex((w) => w.id === active.id);
      const newIndex = layout.findIndex((w) => w.id === over.id);
      const newLayout = arrayMove(layout, oldIndex, newIndex);
      reorderWidgets(newLayout);
    }
  };

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
            <TabsContent value="dashboard" className="space-y-4 mt-0">
              <div className="flex justify-end">
                <EditModeToolbar
                  isEditMode={isEditMode}
                  onEnterEdit={enterEditMode}
                  onConfirm={confirmLayout}
                  onCancel={cancelEdit}
                  onReset={resetLayout}
                />
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={layout.map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {layout.map((widget) => (
                      <SortableWidget
                        key={widget.id}
                        id={widget.id}
                        label={widget.label}
                        isEditMode={isEditMode}
                        visible={widget.visible}
                        onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                      >
                        {widgetContentMap[widget.id]}
                      </SortableWidget>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
