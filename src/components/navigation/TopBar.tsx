import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
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
        <a
          href="https://wa.me/5511912921040?text=ol%C3%A1%2C%20quero%20registrar%20minhas%20finan%C3%A7as%20no%20whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Usar robô no WhatsApp para registrar finanças"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white font-semibold shadow-[0_6px_16px_rgba(16,185,129,0.45)] ring-1 ring-emerald-300/60 px-4 h-11 md:px-5 md:h-11 hover:brightness-110 active:translate-y-[1px] transition focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
        >
          <span className="hidden md:inline">USAR ROBO NO WHATSAPP</span>
          <span className="md:hidden">ROBO NO WHATSAPP</span>
        </a>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-xs"></span>
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
