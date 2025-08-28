import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Crown,
  Plus,
  Target,
  Calendar,
  Shield,
  User,
  FileText,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavBarProps {
  onAddTransaction?: (type: "income" | "expense") => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ onAddTransaction }) => {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  // Verificar se estamos na página de administração
  const isAdminPage = location.pathname === "/admin";

  const quickActionItems = [
    {
      icon: Receipt,
      label: "Transações",
      action: () => {
        navigate("/transactions");
        setIsQuickActionsOpen(false);
      },
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      icon: Target,
      label: t("nav.goals") || "Metas",
      action: () => {
        navigate("/goals");
        setIsQuickActionsOpen(false);
      },
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      icon: Calendar,
      label: "Agendamentos",
      action: () => {
        setIsQuickActionsOpen(false);
      },
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
    },
    {
      icon: FileText,
      label: "Relatórios",
      action: () => {
        navigate("/reports");
        setIsQuickActionsOpen(false);
      },
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
    },
  ];

  // Se for admin na página de admin, mostrar apenas menu administrativo
  if (isAdmin && isAdminPage) {
    const adminMenuItems = [
      {
        icon: Shield,
        label: "Admin",
        href: "/admin",
      },
      {
        icon: User,
        label: t("nav.profile"),
        href: "/profile",
      },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg md:hidden safe-area-inset-bottom">
        <nav className="flex items-center justify-around px-2 xs:px-3 py-2 xs:py-3 safe-area-bottom">
          {adminMenuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center p-2 xs:p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[80px] xs:max-w-[90px] group touch-manipulation",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95"
                )
              }
            >
              <item.icon className="h-4 w-4 xs:h-5 xs:w-5 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] xs:text-xs font-medium truncate leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  // Menu padrão para usuários normais
  const defaultMenuItems = [
    {
      icon: LayoutDashboard,
      label: t("nav.dashboard"),
      href: "/dashboard",
    },
    {
      icon: Receipt,
      label: t("nav.transactions"),
      href: "/transactions",
    },
    {
      type: "quick-actions",
      icon: Plus,
      label: "",
      href: "#",
    },
    {
      icon: Crown,
      label: t("nav.plans"),
      href: "/plans",
    },
    {
      icon: Settings,
      label: t("nav.settings"),
      href: "/settings",
    },
  ];

  // Determinar quais itens de menu mostrar
  let menuItems = defaultMenuItems;

  // Se for admin mas não estiver na página de admin, adicionar o item admin ao menu
  if (isAdmin && !isAdminPage) {
    const adminMenuItem = {
      icon: Shield,
      label: "Admin",
      href: "/admin",
    };

    // Adicionar o item admin antes do último item (settings)
    menuItems = [
      ...defaultMenuItems.slice(0, -1),
      adminMenuItem,
      defaultMenuItems[defaultMenuItems.length - 1],
    ];
  }

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl md:hidden safe-area-inset-bottom">
      <nav className="flex items-center justify-around px-1 xs:px-2 py-2 xs:py-3 safe-area-bottom">
        {menuItems.map((item, index) => {
          if (item.type === "quick-actions") {
            return (
              <Popover
                key="quick-actions"
                open={isQuickActionsOpen}
                onOpenChange={setIsQuickActionsOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center p-2 xs:p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[60px] xs:max-w-[70px] group touch-manipulation",
                      isQuickActionsOpen
                        ? "text-primary bg-primary/10 shadow-sm scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95"
                    )}
                  >
                    <div className="rounded-full bg-primary text-primary-foreground p-1.5 xs:p-2 shadow-lg group-hover:scale-110 transition-transform">
                      <Plus className="h-5 w-5 xs:h-6 xs:w-6" />
                    </div>
                    <span className="text-[10px] xs:text-xs font-medium leading-tight">Ações</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-52 xs:w-56 p-2 mb-2 mx-2"
                  align="center"
                  side="top"
                >
                  <AnimatePresence>
                    {isQuickActionsOpen && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-1"
                      >
                        {quickActionItems.map((quickItem) => (
                          <motion.div
                            key={quickItem.label}
                            variants={itemVariants}
                          >
                            <Button
                              variant="ghost"
                              onClick={quickItem.action}
                              className={`w-full justify-start gap-3 h-10 xs:h-11 text-sm xs:text-base ${quickItem.bgColor} ${quickItem.color} touch-manipulation`}
                            >
                              <quickItem.icon className="h-4 w-4 xs:h-5 xs:w-5" />
                              <span>{quickItem.label}</span>
                            </Button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </PopoverContent>
              </Popover>
            );
          }
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center p-2 xs:p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 max-w-[60px] xs:max-w-[70px] group touch-manipulation",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95"
                )
              }
            >
              <item.icon className="h-4 w-4 xs:h-5 xs:w-5 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] xs:text-xs font-medium truncate leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavBar;
