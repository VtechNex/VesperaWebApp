import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  destructive = false,
  confirmDisabled = false,
  showConfirm = true,
}) {
  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent className="w-[min(92vw,30rem)] rounded-3xl border border-[#D4AF37]/20 bg-[#0d0f12] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 rounded-3xl border border-white/5" aria-hidden="true" />
        <div
          className="absolute inset-x-10 top-0 h-28 rounded-full blur-3xl"
          style={{
            background: destructive
              ? "radial-gradient(circle, rgba(220, 38, 38, 0.18), transparent 68%)"
              : "radial-gradient(circle, rgba(212, 175, 55, 0.18), transparent 68%)",
          }}
          aria-hidden="true"
        />

        <div className="relative p-6">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-xl font-semibold text-white">{title}</DialogTitle>
            <DialogDescription className="mt-2 leading-6 text-white/70">
              {description}
            </DialogDescription>
          </DialogHeader>

          {details ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85">
              {details}
            </div>
          ) : null}

          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={() => onOpenChange?.(false)}
              disabled={loading}
              className="border border-white/15 bg-white/[0.03] px-5 py-2.5 text-white/85 hover:bg-white/[0.08]"
            >
              {cancelLabel}
            </Button>
            {showConfirm ? (
              <Button
                type="button"
                onClick={onConfirm}
                disabled={loading || confirmDisabled}
                className={`px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                  destructive
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "bg-[#D4AF37] text-black hover:bg-[#c9a432]"
                }`}
              >
                {loading ? "Please wait..." : confirmLabel}
              </Button>
            ) : null}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
