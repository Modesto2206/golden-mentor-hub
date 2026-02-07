import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: "stats", label: "Estatísticas", visible: true },
  { id: "charts", label: "Gráficos de Vendas", visible: true },
  { id: "ranking", label: "Ranking de Vendas", visible: true },
  { id: "projection", label: "Projeção de Vendas", visible: true },
];

const STORAGE_KEY = "credmais-dashboard-layout";

const getStorageKey = (userId?: string) =>
  userId ? `${STORAGE_KEY}-${userId}` : STORAGE_KEY;

export function useDashboardLayout() {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);
  const [pendingLayout, setPendingLayout] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);

  // Load saved layout from localStorage
  useEffect(() => {
    const key = getStorageKey(user?.id);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as WidgetConfig[];
        // Merge with defaults to handle new widgets added in future updates
        const merged = DEFAULT_LAYOUT.map(
          (def) => parsed.find((p) => p.id === def.id) ?? def
        );
        // Preserve custom order from saved layout
        const orderedIds = parsed.map((p) => p.id);
        merged.sort((a, b) => {
          const aIdx = orderedIds.indexOf(a.id);
          const bIdx = orderedIds.indexOf(b.id);
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });
        setLayout(merged);
        setPendingLayout(merged);
      } catch {
        setLayout(DEFAULT_LAYOUT);
        setPendingLayout(DEFAULT_LAYOUT);
      }
    }
  }, [user?.id]);

  const enterEditMode = useCallback(() => {
    setPendingLayout([...layout]);
    setIsEditMode(true);
  }, [layout]);

  const confirmLayout = useCallback(() => {
    setLayout(pendingLayout);
    const key = getStorageKey(user?.id);
    localStorage.setItem(key, JSON.stringify(pendingLayout));
    setIsEditMode(false);
  }, [pendingLayout, user?.id]);

  const cancelEdit = useCallback(() => {
    setPendingLayout([...layout]);
    setIsEditMode(false);
  }, [layout]);

  const resetLayout = useCallback(() => {
    setPendingLayout([...DEFAULT_LAYOUT]);
  }, []);

  const reorderWidgets = useCallback((newOrder: WidgetConfig[]) => {
    setPendingLayout(newOrder);
  }, []);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setPendingLayout((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    );
  }, []);

  return {
    layout: isEditMode ? pendingLayout : layout,
    isEditMode,
    enterEditMode,
    confirmLayout,
    cancelEdit,
    resetLayout,
    reorderWidgets,
    toggleWidgetVisibility,
  };
}
