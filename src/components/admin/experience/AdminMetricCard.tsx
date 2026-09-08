import React, { useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/useAdminExperience";
import { animateMetricCount } from "./useGsapContext";

interface AdminMetricCardProps {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  loading?: boolean;
  tone?: "default" | "gold" | "danger";
  className?: string;
}

const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  label,
  value,
  hint,
  icon: Icon,
  loading = false,
  tone = "default",
  className,
}) => {
  const valueRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (loading) return;
    animateMetricCount(valueRef.current, value, reducedMotion);
  }, [value, loading, reducedMotion]);

  return (
    <article
      className={cn(
        "admin-surface relative overflow-hidden p-5",
        className
      )}
    >
      <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.18),transparent_70%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="admin-kicker mb-3">{label}</p>
          {loading ? (
            <div className="h-10 w-28 animate-pulse rounded-lg bg-black/5" />
          ) : (
            <span
              ref={valueRef}
              className={cn(
                "admin-metric-value",
                tone === "gold" && "text-[#854d0e]",
                tone === "danger" && "text-[var(--admin-danger)]"
              )}
            >
              0
            </span>
          )}
          <p className="mt-3 text-sm text-[var(--admin-muted)]">{hint}</p>
        </div>
        <div
          className={cn(
            "rounded-2xl border border-[var(--admin-line)] p-3",
            tone === "gold" && "bg-[var(--admin-gold-soft)]",
            tone === "danger" && "bg-orange-50",
            tone === "default" && "bg-white/70"
          )}
        >
          <Icon className="h-5 w-5 text-[var(--admin-ink)]" />
        </div>
      </div>
    </article>
  );
};

export default AdminMetricCard;
