import { ReactNode } from "react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesWithProfiles } from "@/hooks/useSalesWithProfiles";
import { useMonthlyGoal } from "@/hooks/useMonthlyGoal";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import SalesCharts from "@/components/dashboard/SalesCharts";
import SalesRanking from "@/components/dashboard/SalesRanking";
import SalesProjection from "@/components/dashboard/SalesProjection";
import SortableWidget from "@/components/dashboard/SortableWidget";
import EditModeToolbar from "@/components/dashboard/EditModeToolbar";
import AppLayout from "@/components/AppLayout";

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const { sales } = useSalesWithProfiles();
  const { monthlyGoal } = useMonthlyGoal();
  const {
    layout, isEditMode, enterEditMode, confirmLayout, cancelEdit, resetLayout, reorderWidgets, toggleWidgetVisibility,
  } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

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
      reorderWidgets(arrayMove(layout, oldIndex, newIndex));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex justify-end">
          <EditModeToolbar
            isEditMode={isEditMode}
            onEnterEdit={enterEditMode}
            onConfirm={confirmLayout}
            onCancel={cancelEdit}
            onReset={resetLayout}
          />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.map((w) => w.id)} strategy={verticalListSortingStrategy}>
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
      </div>
    </AppLayout>
  );
};

export default Dashboard;
