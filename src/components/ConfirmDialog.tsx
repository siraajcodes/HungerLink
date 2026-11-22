import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  requireReason = false,
  reasonLabel = 'Audit Reason',
  reasonPlaceholder = 'Provide a clear operational or safety reason for the audit log...',
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const canConfirm = !requireReason || reason.trim().length >= 3;

  const handleConfirm = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B2723]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md bg-white border border-[#123B35]/15 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirm-dialog-title" className="text-lg font-bold font-display text-[#123B35]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#123B35] hover:bg-[#FFF9EF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-[#64748B] leading-relaxed">{description}</p>

        {requireReason && (
          <div className="mt-4">
            <label htmlFor="audit-reason-input" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              {reasonLabel} *
            </label>
            <textarea
              id="audit-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm text-[#123B35] focus:outline-none focus:border-[#123B35]"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#123B35]/20 text-sm font-medium text-[#123B35] hover:bg-[#FFF9EF] transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!canConfirm || submitting}
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-40 ${
              destructive
                ? 'bg-[#FF795C] text-white hover:bg-[#F06244]'
                : 'bg-[#123B35] text-white hover:bg-[#0B2723]'
            }`}
          >
            {submitting ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
