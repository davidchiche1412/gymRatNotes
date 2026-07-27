import { useState, useCallback } from 'react';

/**
 * Hook para mostrar modales de confirmación/alerta.
 * Devuelve { modal, confirm, alert } donde:
 * - modal: props para <Modal />
 * - confirm(opts): muestra confirm y devuelve Promise<boolean>
 * - alert(opts): muestra alert y devuelve Promise<void>
 */
export function useModal() {
  const [state, setState] = useState({ open: false });

  const confirm = useCallback(({ title, message, confirmText, cancelText }) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => { setState({ open: false }); resolve(true); },
        onCancel: () => { setState({ open: false }); resolve(false); },
      });
    });
  }, []);

  const alert = useCallback(({ title, message, confirmText }) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        type: 'alert',
        title,
        message,
        confirmText,
        onConfirm: () => { setState({ open: false }); resolve(); },
        onCancel: () => { setState({ open: false }); resolve(); },
      });
    });
  }, []);

  return { modal: state, confirm, alert };
}
