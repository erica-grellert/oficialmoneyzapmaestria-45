import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
interface MzModalAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
  loading?: boolean;
}
interface MzModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon?: "wallet" | "trending-up" | "trending-down";
  badge?: {
    label: string;
    variant: "income" | "expense" | "default";
  };
  variant?: "form" | "confirm" | "media" | "fullscreen";
  primaryAction?: MzModalAction;
  secondaryAction?: MzModalAction;
  tertiaryAction?: MzModalAction;
  children: React.ReactNode;
  className?: string;
}
const iconMap = {
  wallet: Wallet,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
};
export const MzModal: React.FC<MzModalProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  icon = "wallet",
  badge,
  variant = "form",
  primaryAction,
  secondaryAction,
  tertiaryAction,
  children,
  className,
}) => {
  const IconComponent = iconMap[icon];
  const getBadgeStyles = (badgeVariant: "income" | "expense" | "default") => {
    switch (badgeVariant) {
      case "income":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "expense":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800";
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[720px] w-full max-w-[95vw] p-0 gap-0 rounded-3xl border-[1px] shadow-lg backdrop-blur-sm",
          "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
          "animate-in fade-in-0 zoom-in-98 slide-in-from-bottom-3 duration-200",
          variant === "fullscreen" && "sm:max-w-[95vw] sm:max-h-[95vh]",

          className
        )}
        style={{
          boxShadow: "0 8px 24px rgba(16, 24, 38, 0.12)",
        }}
      >
        {/* Custom Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 space-y-0">
          <div className="flex items-center gap-4">
            {/* Icon Circle */}
            <div className="w-12 h-12  bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-slate-600 dark:text-slate-300" />
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {title}
              </DialogTitle>
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Context Badge */}
            {badge && (
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 text-xs font-medium",
                  getBadgeStyles(badge.variant)
                )}
              >
                {badge.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 p-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {children}
        </div>

        {/* Action Rail Footer */}
        {(primaryAction || secondaryAction || tertiaryAction) && (
          <div className="flex items-center justify-between p-6 pt-4">
            <div className="flex items-center gap-2">
              {tertiaryAction && (
                <Button
                  variant={tertiaryAction.variant || "ghost"}
                  onClick={tertiaryAction.onClick}
                >
                  {tertiaryAction.label}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {secondaryAction && (
                <Button
                  variant={secondaryAction.variant || "outline"}
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.loading}
                >
                  {secondaryAction.loading
                    ? "Salvando..."
                    : secondaryAction.label}
                </Button>
              )}

              {primaryAction && (
                <Button
                  variant={primaryAction.variant || "default"}
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.loading}
                >
                  {primaryAction.loading ? "Salvando..." : primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        {primaryAction && (
          <div className="absolute bottom-2 left-6 text-xs text-slate-400 dark:text-slate-500">
            Ctrl/Cmd + Enter para salvar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
