import React from "react";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";

export default function AccessRestricted({
  title = "Access Restricted",
  description = "You do not have permission to view this area.",
  actionLabel = "Return to Dashboard",
  onAction,
}) {
  return (
    <div className="min-h-[50vh] rounded-3xl border border-[#D4AF37]/15 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_42%),linear-gradient(180deg,#090909_0%,#121212_100%)] p-8 text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.75)]">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.24em] text-[#D4AF37]">
          <LockKeyhole className="h-3.5 w-3.5" />
          Restricted
        </div>
        <h2 className="text-3xl font-semibold tracking-[0.04em] text-white">{title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">{description}</p>
        {onAction ? (
          <Button type="button" className="gold-btn mt-8" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
