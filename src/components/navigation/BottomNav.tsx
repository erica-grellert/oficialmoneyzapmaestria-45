import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Calendar,
  BarChart3,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Painel",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Transações",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Perfil",
    href: "/profile",
    icon: User,
  },
];

const BottomNav = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 md:hidden">
      <nav className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-card transition-all duration-150",
                "min-w-0 flex-1 max-w-[80px]",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", active && "scale-110")} />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
