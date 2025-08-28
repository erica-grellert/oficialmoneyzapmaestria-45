import React from "react";
import { LayoutGrid, List, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ViewMode = "timeline" | "grid" | "list";

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  className,
}) => {
  const views: {
    mode: ViewMode;
    icon: React.ReactNode;
    label: string;
    description: string;
  }[] = [
    {
      mode: "timeline",
      icon: <Calendar className="h-4 w-4" />,
      label: "Timeline",
      description: "Visualização cronológica",
    },
    {
      mode: "grid",
      icon: <LayoutGrid className="h-4 w-4" />,
      label: "Grid",
      description: "Visualização em grade",
    },
    {
      mode: "list",
      icon: <List className="h-4 w-4" />,
      label: "Lista",
      description: "Visualização em lista",
    },
  ];

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-slate-100 rounded-lg",
        className
      )}
    >
      {views.map((view) => (
        <Button
          key={view.mode}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(view.mode)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 h-auto rounded-md transition-all duration-200",
            currentView === view.mode
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          {view.icon}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium">{view.label}</div>
            <div className="text-xs text-slate-500">{view.description}</div>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default ViewToggle;
