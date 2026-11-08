import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icon, { TONE_ICONS } from '../components/Icon';

const ToastContext = createContext(null);

// How long a notification stays on screen. Long enough to read slowly.
const AUTO_DISMISS_MS = 7000;

let nextId = 1;

/**
 * Wrap the app in <ToastProvider> (see index.js) so any component can call
 * useToast() to show a short notification in the corner of the screen:
 *
 *   const toast = useToast();
 *   toast.success('Your booking has been saved.');
 *
 * Errors stay until the person closes them; other messages disappear on their own.
 * For form errors, show an <Alert> next to the form instead.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (type, message) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, type, message }]);
      if (type !== 'error') {
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      info: (message) => show('info', message),
      success: (message) => show('success', message),
      warning: (message) => show('warning', message),
      error: (message) => show('error', message),
      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <Icon name={TONE_ICONS[toast.type]} className="toast__icon" />
            <p className="toast__message">{toast.message}</p>
            <button
              type="button"
              className="icon-button"
              onClick={() => dismiss(toast.id)}
              aria-label="Close notification"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used inside <ToastProvider>.');
  }
  return context;
}
