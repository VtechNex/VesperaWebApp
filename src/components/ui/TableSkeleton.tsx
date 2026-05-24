import React from "react";
import Skeleton from "./Skeleton";

export default function TableSkeleton({
  rows = 8,
  columns = 5,
  showHeader = true,
  showPagination = true,
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showPagination?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/20">
        {showHeader ? (
          <div
            className="grid gap-3 border-b border-white/5 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={`header-${index}`} className="h-4 w-24" />
            ))}
          </div>
        ) : null}

        <div className="divide-y divide-white/5">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="grid gap-3 px-4 py-4"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <div key={`cell-${rowIndex}-${columnIndex}`} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  {columnIndex < 2 ? <Skeleton className="h-3 w-2/3" /> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {showPagination ? (
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

