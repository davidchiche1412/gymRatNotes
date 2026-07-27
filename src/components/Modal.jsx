import { useEffect, useRef } from 'react';

export default function Modal({ open, title, message, confirmText, cancelText, onConfirm, onCancel, type = 'confirm' }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-sm p-5 animate-scale-in">
        {title && (
          <h3 className="text-base font-bold mb-2">{title}</h3>
        )}
        {message && (
          <p className="text-sm text-text-secondary mb-5">{message}</p>
        )}

        <div className="flex gap-3">
          {type === 'confirm' && cancelText && (
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary active:scale-95 transition-transform"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            {confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
