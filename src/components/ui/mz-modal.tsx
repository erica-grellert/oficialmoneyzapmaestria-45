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
          "sm:max-w-[720px] w-full max-w-[95vw] p-0 gap-0 rounded-2xl xs:rounded-3xl border-[1px] shadow-lg backdrop-blur-sm",
          "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
          "animate-in fade-in-0 zoom-in-98 slide-in-from-bottom-3 duration-200",
          "max-h-[95vh] sm:max-h-[90vh]",
          variant === "fullscreen" && "sm:max-w-[95vw] sm:max-h-[95vh]",
          className
        )}
        style={{
          boxShadow: "0 8px 24px rgba(16, 24, 38, 0.12)",
        }}
      >
        {/* Custom Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 xs:p-6 pb-3 xs:pb-4 space-y-0">
          <div className="flex items-center gap-2 xs:gap-4 min-w-0 flex-1">
            {/* Icon Circle */}
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-lg xs:rounded-xl flex-shrink-0">
              <IconComponent className="h-5 w-5 xs:h-6 xs:w-6 text-slate-600 dark:text-slate-300" />
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg xs:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-0.5 xs:mb-1 truncate">
                {title}
              </DialogTitle>
              {subtitle && (
                <p className="text-xs xs:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 xs:line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 xs:gap-3 flex-shrink-0">
            {/* Context Badge - Hide on very small screens */}
            {badge && (
              <Badge
                variant="outline"
                className={cn(
                  "hidden xs:inline-flex px-2 xs:px-3 py-1 text-xs font-medium whitespace-nowrap",
                  getBadgeStyles(badge.variant)
                )}
              >
                {badge.label}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 p-4 xs:p-6 overflow-y-auto" style={{ maxHeight: "calc(95vh - 200px)" }}>
          {children}
        </div>

        {/* Action Rail Footer */}
        {(primaryAction || secondaryAction || tertiaryAction) && (
          <div className="border-t border-slate-200 dark:border-slate-700">
            {/* Mobile: Stack all actions vertically, Primary first */}
            <div className="flex flex-col gap-2 p-4 xs:p-6 pt-4 xs:pt-4 sm:hidden">
              {primaryAction && (
                <Button
                  variant={primaryAction.variant || "default"}
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.loading}
                  className="w-full min-h-[48px] touch-manipulation text-base font-medium"
                >
                  {primaryAction.loading ? "Salvando..." : primaryAction.label}
                </Button>
              )}
              
              {secondaryAction && (
                <Button
                  variant={secondaryAction.variant || "outline"}
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.loading}
                  className="w-full min-h-[48px] touch-manipulation text-base font-medium"
                >
                  {secondaryAction.loading
                    ? "Salvando..."
                    : secondaryAction.label}
                </Button>
              )}

              {tertiaryAction && (
                <Button
                  variant={tertiaryAction.variant || "ghost"}
                  onClick={tertiaryAction.onClick}
                  className="w-full min-h-[44px] touch-manipulation text-base"
                >
                  {tertiaryAction.label}
                </Button>
              )}
            </div>

            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex items-center justify-between gap-2 p-6 pt-4">
              <div className="flex items-center gap-2">
                {tertiaryAction && (
                  <Button
                    variant={tertiaryAction.variant || "ghost"}
                    onClick={tertiaryAction.onClick}
                    className="min-h-[44px] touch-manipulation"
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
                    className="min-h-[44px] touch-manipulation"
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
                    className="min-h-[44px] touch-manipulation"
                  >
                    {primaryAction.loading ? "Salvando..." : primaryAction.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        {primaryAction && (
          <div className="hidden xs:block absolute bottom-2 left-6 text-xs text-slate-400 dark:text-slate-500">
            Ctrl/Cmd + Enter para salvar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
