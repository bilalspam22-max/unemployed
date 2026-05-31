"use client";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title = "Confirmer la suppression",
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__title">{title}</div>
        <div className="confirm-dialog__text">{message}</div>
        <div className="confirm-dialog__actions">
          <button className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="btn btn--primary"
            style={danger ? { background: "var(--danger)", borderColor: "var(--danger)" } : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
