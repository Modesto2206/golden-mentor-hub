import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableWidgetProps {
  id: string;
  label: string;
  isEditMode: boolean;
  visible: boolean;
  onToggleVisibility?: () => void;
  children: React.ReactNode;
}

const SortableWidget = ({
  id,
  label,
  isEditMode,
  visible,
  onToggleVisibility,
  children,
}: SortableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!isEditMode && !visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-80",
        isEditMode && "rounded-lg border-2 border-dashed border-primary/40 p-1",
        isEditMode && !visible && "opacity-40"
      )}
    >
      {isEditMode && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-primary/10 rounded-md">
          <button
            className="cursor-grab active:cursor-grabbing touch-none text-primary"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-foreground flex-1">
            {label}
          </span>
          <button
            onClick={onToggleVisibility}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
      {(visible || isEditMode) && children}
    </div>
  );
};

export default SortableWidget;
