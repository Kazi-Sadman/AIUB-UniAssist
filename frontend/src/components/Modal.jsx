import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, eyebrow, onClose, children, accent = "#C9A227" }) {
  // Let the Escape key close the dialog. The listener is removed again on cleanup.
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md card !bg-surface animate-modalIn overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div
          className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-line"
          style={{ boxShadow: `inset 0 3px 0 0 ${accent}` }}
        >
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 className="font-display text-xl font-semibold text-parchment">{title}</h2>
          </div>
          <button onClick={onClose} className="icon-btn -mt-1 -mr-1" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
