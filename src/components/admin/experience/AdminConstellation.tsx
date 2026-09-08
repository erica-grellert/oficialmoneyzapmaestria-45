import React, { Suspense, lazy, useMemo } from "react";
import {
  useCanUseWebGL,
  usePrefersReducedMotion,
} from "@/hooks/useAdminExperience";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminConstellationCanvas = lazy(
  () => import("./AdminConstellationCanvas")
);

export interface AdminSystemStats {
  activeUsers: number;
  totalTransactions: number;
  activeSubscriptions: number;
  nonRenewingSubscriptions: number;
}

interface AdminConstellationProps {
  stats: AdminSystemStats;
  className?: string;
}

const AdminConstellation: React.FC<AdminConstellationProps> = ({
  stats,
  className,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const canUseWebGL = useCanUseWebGL();
  const isMobile = useIsMobile();

  const shouldRenderWebGL = useMemo(
    () => canUseWebGL && !reducedMotion && !isMobile,
    [canUseWebGL, reducedMotion, isMobile]
  );

  return (
    <div
      className={`admin-constellation ${className ?? ""}`}
      aria-hidden="true"
    >
      {shouldRenderWebGL ? (
        <Suspense fallback={<div className="admin-constellation-fallback" />}>
          <AdminConstellationCanvas stats={stats} />
        </Suspense>
      ) : (
        <div className="admin-constellation-fallback" />
      )}
    </div>
  );
};

export default AdminConstellation;
