import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/useAdminExperience";
import {
  ADMIN_GROUPS,
  ADMIN_WORKSPACES,
  type AdminWorkspaceId,
} from "./adminWorkspaces";

interface AdminWorkspaceNavProps {
  activeId: AdminWorkspaceId;
  onSelect: (id: AdminWorkspaceId) => void;
  compact?: boolean;
}

const AdminWorkspaceNav: React.FC<AdminWorkspaceNavProps> = ({
  activeId,
  onSelect,
  compact = false,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!navRef.current || reducedMotion) return;

    const items = navRef.current.querySelectorAll("[data-nav-item]");
    gsap.fromTo(
      items,
      { opacity: 0, x: -12 },
      {
        opacity: 1,
        x: 0,
        duration: 0.45,
        stagger: 0.035,
        ease: "power2.out",
      }
    );
  }, [reducedMotion]);

  if (compact) {
    return (
      <nav
        ref={navRef}
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Navegação do admin"
      >
        {ADMIN_WORKSPACES.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              data-nav-item
              data-active={active}
              onClick={() => onSelect(item.id)}
              className={cn(
                "admin-nav-item min-w-max shrink-0 px-3 py-2",
                active && "shadow-sm"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav ref={navRef} className="space-y-6" aria-label="Navegação do admin">
      {ADMIN_GROUPS.map((group) => {
        const items = ADMIN_WORKSPACES.filter(
          (workspace) => workspace.group === group.id
        );
        return (
          <div key={group.id} className="space-y-2">
            <p className="admin-kicker px-2">{group.label}</p>
            <div className="space-y-1.5">
              {items.map((item) => {
                const Icon = item.icon;
                const active = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-nav-item
                    data-active={active}
                    onClick={() => onSelect(item.id)}
                    className="admin-nav-item"
                  >
                    <span className="rounded-xl border border-[var(--admin-line)] bg-white/70 p-2">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--admin-ink)]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--admin-muted)]">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default AdminWorkspaceNav;
