import React from "react";
import Skeleton from "./Skeleton";

export default function DashboardChartSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-16 rounded-xl" />
      </div>

      <div className="flex h-[340px] items-end gap-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-3">
            <Skeleton
              className="w-full rounded-t-xl"
              // Vary the placeholder bar height for a more natural loading layout.
              style={{
                height: `${140 + ((index * 29) % 120)}px`,
              } as React.CSSProperties}
            />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

