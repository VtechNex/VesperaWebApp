import React from "react";
import { Button } from "./ui/button";

export default function ErrorState({ title = "Something went wrong", description = "Please try again.", onRetry }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-white/80">
      <div className="text-base font-medium text-white">{title}</div>
      <div className="mt-2 text-sm">{description}</div>
      {onRetry ? (
        <Button onClick={onRetry} className="mt-4 border border-white/20 bg-white/10 hover:bg-white/15">
          Retry
        </Button>
      ) : null}
    </div>
  );
}
