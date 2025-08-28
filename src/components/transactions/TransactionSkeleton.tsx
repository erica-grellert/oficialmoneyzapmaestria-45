import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionSkeletonProps {
  count?: number;
  compact?: boolean;
}

const TransactionSkeleton: React.FC<TransactionSkeletonProps> = ({
  count = 5,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <Card
            key={index}
            className="p-3 border border-slate-200 shadow-lg bg-white"
          >
            <div className="flex items-center gap-3">
              {/* Icon Skeleton */}
              <Skeleton className="w-10 h-10 rounded-xl" />

              {/* Content Skeleton */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>

              {/* Amount Skeleton */}
              <div className="text-right">
                <Skeleton className="h-6 w-24 mb-1" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="p-3 border border-slate-200 shadow-lg bg-white"
        >
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon Skeleton */}
              <Skeleton className="w-14 h-14 rounded-2xl" />

              {/* Main Content Skeleton */}
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>

              {/* Right Side Skeleton */}
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <Skeleton className="h-8 w-32 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>

                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TransactionSkeleton;
