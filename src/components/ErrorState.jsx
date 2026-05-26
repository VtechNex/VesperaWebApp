import React from "react";
import { Button } from "./ui/button";

export default function ErrorState({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-white/80">
      <div className="text-base font-medium text-white">{title}</div>
      <div className="mt-2 text-sm">{description}</div>
      {onRetry || onSecondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button onClick={onRetry} className="border border-white/20 bg-white/10 hover:bg-white/15">
              Retry
            </Button>
          ) : null}
          {onSecondaryAction ? (
            <Button onClick={onSecondaryAction} className="border border-red-400/30 bg-red-500/10 hover:bg-red-500/15">
              {secondaryActionLabel || "Continue"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
