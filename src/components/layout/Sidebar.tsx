import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useBrandingConfig } from "@/hooks/useBrandingConfig";

import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Target,
  User,
  Settings,
  FolderOpen,
  Calendar,
  Crown,
  LogOut,
  Shield,
} from "lucide-react";
interface SidebarProps {
  onProfileClick?: () => void;
  onConfigClick?: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({ onProfileClick, onConfigClick }) => {
  const { user, logout } = useAdaptiveContext();
  const { t } = usePreferences();
  const { isAdmin } = useUserRole();
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se estamos na página de administração
  const isAdminPage = location.pathname === "/admin";
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const handleProfileClick = () => {
    if (isAdmin && isAdminPage && onProfileClick) {
      onProfileClick();
    } else {
      navigate("/profile");
    }
  };

  // Se for admin na página de admin, mostrar apenas menu administrativo
  if (isAdmin && isAdminPage) {
    const adminMenuItems = [
      {
        icon: Settings,
        label: "Configurações",
        action: () => {
          if (onConfigClick) {
            onConfigClick();
          }
        },
      },
    ];
    return (
      <div className="hidden md:flex h-screen w-64 lg:w-64 xl:w-72 flex-col bg-background border-r">
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Centro de Controle
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {adminMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={item.action}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}

          {/* Botão Perfil que executa função ao invés de navegar */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleProfileClick}
          >
            <User className="h-5 w-5" />
            Perfil
          </Button>
        </nav>

        {/* Bottom Navigation - Logout */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
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
      icon: FolderOpen,
      label: t("nav.categories"),
      href: "/categories",
    },
    {
      icon: Target,
      label: t("nav.goals"),
      href: "/goals",
    },
    {
      icon: BarChart3,
      label: t("nav.reports"),
      href: "/reports",
    },
    {
      icon: Crown,
      label: t("nav.plans"),
      href: "/plans",
    },
  ];

  // Adicionar item admin apenas se o usuário for admin e não estiver na página admin
  let menuItems = [...defaultMenuItems];
  if (isAdmin && !isAdminPage) {
    const adminMenuItem = {
      icon: Shield,
      label: "Centro de Controle",
      href: "/admin",
    };
    menuItems.push(adminMenuItem);
  }
  const bottomMenuItems = [
    {
      icon: User,
      label: t("nav.profile"),
      href: "/profile",
    },
    {
      icon: Settings,
      label: t("nav.settings"),
      href: "/settings",
    },
  ];
  if (!user) return null;
  return (
    <div className="hidden md:flex h-screen w-64 lg:w-72 xl:w-80 2xl:w-88 flex-col bg-background border-r overflow-hidden flex-shrink-0">
      {/* Logo/Header */}
      <div className="p-4 lg:p-6 xl:p-8 border-b flex-shrink-0">
        <div className="flex items-center space-x-3">
          {logoUrl}
          {!logoUrl && (
            <div className="h-8 w-8 lg:h-10 lg:w-10 bg-primary rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm lg:text-base">
                {companyName.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-lg lg:text-xl xl:text-2xl font-bold text-primary truncate min-w-0">{companyName}</h1>
        </div>
      </div>

      {/* Navigation - Scrollable content */}
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 p-3 lg:p-4 xl:p-6 space-y-1 lg:space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 lg:px-4 xl:px-5 py-2.5 lg:py-3 xl:py-4 rounded-lg lg:rounded-xl text-sm lg:text-base font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <span className="truncate min-w-0 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Navigation - Always visible */}
        <div className="p-3 lg:p-4 xl:p-6 border-t space-y-1 lg:space-y-2 flex-shrink-0 bg-background">
          {bottomMenuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 lg:px-4 xl:px-5 py-2.5 lg:py-3 xl:py-4 rounded-lg lg:rounded-xl text-sm lg:text-base font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
              <span className="truncate min-w-0 font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 lg:px-4 xl:px-5 py-2.5 lg:py-3 xl:py-4 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
            <span className="truncate min-w-0 font-medium">{t("settings.logout")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
