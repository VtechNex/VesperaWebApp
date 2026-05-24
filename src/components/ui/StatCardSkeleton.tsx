import React from "react";
import Skeleton from "./Skeleton";

export default function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-20" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

