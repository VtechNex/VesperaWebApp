import React from "react";

export default function EmptyState({ title = "Nothing to show", description = "No records are available yet." }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-center text-white/70">
      <div className="text-base font-medium text-white">{title}</div>
      <div className="mt-2 text-sm">{description}</div>
    </div>
  );
}
