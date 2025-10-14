import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import UserProfileDropdown from "@/components/layout/UserProfileDropdown";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { useBrandingConfig } from "@/hooks/useBrandingConfig";

const navigationItems = [
  { name: "Painel", href: "/dashboard" },
  { name: "Transações", href: "/transactions" },
  { name: "Categorias", href: "/categories" },
  { name: "Metas", href: "/goals" },
  { name: "Relatórios", href: "/reports" },
];

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAdaptiveContext();
  const { companyName, logoUrl } = useBrandingConfig();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="hidden md:flex items-center justify-between p-4 bg-card/95 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
      {/* Logo e Navegação */}
      <div className="flex items-center space-x-8">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="w-full h-10" />
        ) : (
          <div className="font-semibold text-xl text-primary">
            {companyName}
          </div>
        )}

        <nav className="flex items-center space-x-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "px-4 py-2 rounded-button text-sm font-medium transition-all duration-150",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground rounded-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
              )}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          className="flex items-center text-sm text-primary-foreground rounded-md border-amber-300 border"
          onClick={() => navigate("/referral")}
        >
          <Gift className="h-5 w-5" />
          <span className="text-xs">Indicações</span>
        </Button>

        {/* Debug temporário - mostrar estado do usuário */}
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Carregando...</div>
        ) : user ? (
          <UserProfileDropdown />
        ) : (
          <div className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
            Não logado -{" "}
            <NavLink to="/login" className="underline">
              Fazer login
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
