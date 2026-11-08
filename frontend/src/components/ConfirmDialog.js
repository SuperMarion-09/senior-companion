import { useEffect, useId, useRef } from 'react';
import Button from './Button';
import Icon from './Icon';

/**
 * Asks "Are you sure?" before an important action (e.g. cancelling a booking).
 * Uses the browser's built-in <dialog>, which keeps keyboard focus inside it
 * and closes with the Escape key. The Cancel button gets focus first, so
 * pressing Enter by accident never confirms.
 *
 * tone: 'danger' (red confirm button) | 'primary'
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      // Older test environments (jsdom) have no showModal().
      dialog.showModal ? dialog.showModal() : dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      dialog.close ? dialog.close() : dialog.removeAttribute('open');
    }
  }, [open]);

  // Escape key: let the parent decide (it controls `open`).
  const handleCancel = (event) => {
    event.preventDefault();
    if (!isLoading) onCancel();
  };

  // Some browsers close the dialog anyway on a second Escape; keep `open` in sync.
  const handleClose = () => {
    if (open) onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`dialog dialog--${tone}`}
      aria-labelledby={titleId}
      aria-describedby={children ? textId : undefined}
      onCancel={handleCancel}
      onClose={handleClose}
    >
      <div className="dialog__body">
        <span className="dialog__icon">
          <Icon name={tone === 'danger' ? 'alert-triangle' : 'info'} />
        </span>
        <div>
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          {children && (
            <div id={textId} className="dialog__text">
              {children}
            </div>
          )}
        </div>
      </div>
      <div className="dialog__actions">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
