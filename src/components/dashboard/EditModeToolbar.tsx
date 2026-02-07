import { Pencil, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditModeToolbarProps {
  isEditMode: boolean;
  onEnterEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReset: () => void;
}

const EditModeToolbar = ({
  isEditMode,
  onEnterEdit,
  onConfirm,
  onCancel,
  onReset,
}: EditModeToolbarProps) => {
  if (!isEditMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onEnterEdit}
        className="gap-2"
      >
        <Pencil className="w-4 h-4" />
        Editar Layout
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
      <span className="text-sm font-medium text-foreground mr-2 hidden sm:inline">
        Modo Edição
      </span>
      <Button size="sm" onClick={onConfirm} className="gap-1.5">
        <Check className="w-4 h-4" />
        <span className="hidden sm:inline">Confirmar</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onCancel}
        className="gap-1.5"
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline">Cancelar</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="gap-1.5 text-muted-foreground"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline">Resetar</span>
      </Button>
    </div>
  );
};

export default EditModeToolbar;
