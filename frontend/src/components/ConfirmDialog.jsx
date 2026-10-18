import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, title, message, onCancel, onConfirm, busy }) {
  // Escape cancels the dialog, except while a delete request is still running.
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm card !bg-surface animate-modalIn p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-crimson/15 border border-crimson/40 flex items-center justify-center shrink-0">
            <AlertTriangle size={17} className="text-crimson" />
          </div>
          <h3 className="font-display text-lg font-semibold text-parchment">{title}</h3>
        </div>
        <p className="text-sm text-muted leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Removing…" : "Remove record"}
          </button>
        </div>
      </div>
    </div>
  );
}
