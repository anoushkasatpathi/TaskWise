// Toasts, in-app reminder alerts, modals and confirm dialogs.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const UIContext = createContext(null);
let seq = 0;

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [modals, setModals] = useState([]); // [{ id, type, props, open }]
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  /** tone: success | error | info. Errors stay longer so the fix hint can be read. */
  const notify = useCallback(
    ({ tone = 'info', title, message = '', hint = '', action, duration } = {}) => {
      const id = ++seq;
      setToasts((list) => [...list.slice(-2), { id, tone, title, message, hint, action }]);
      const ms = duration ?? (tone === 'error' ? 8000 : 3800);
      timers.current.set(id, setTimeout(() => dismiss(id), ms));
      return id;
    },
    [dismiss]
  );

  /** Shows an ApiError (or any error) with its message and fix hint. */
  const notifyError = useCallback(
    (err, title = 'That did not work') => {
      if (err?.name === 'AbortError') return;
      notify({
        tone: 'error',
        title,
        message: err?.message || 'Something went wrong.',
        hint: err?.hint || (err?.status ? '' : 'Please try again.'),
      });
    },
    [notify]
  );

  const pushAlert = useCallback((alert) => {
    setAlerts((list) => (list.some((a) => a.key === alert.key) ? list : [...list.slice(-2), alert]));
  }, []);
  const dismissAlert = useCallback((key) => setAlerts((list) => list.filter((a) => a.key !== key)), []);

  const openModal = useCallback((type, props = {}) => {
    const id = ++seq;
    setModals((list) => [...list, { id, type, props, open: true }]);
    return id;
  }, []);

  /** Plays the exit animation, then unmounts. */
  const closeModal = useCallback((id) => {
    setModals((list) => list.map((m) => (m.id === id ? { ...m, open: false } : m)));
    setTimeout(() => setModals((list) => list.filter((m) => m.id !== id)), 300);
  }, []);

  /** Promise-based confirm: `if (await confirm({...})) doIt()`. */
  const confirm = useCallback(
    (props) =>
      new Promise((resolve) => {
        openModal('confirm', { ...props, resolve });
      }),
    [openModal]
  );

  const value = useMemo(
    () => ({ toasts, notify, notifyError, dismiss, alerts, pushAlert, dismissAlert, modals, openModal, closeModal, confirm }),
    [toasts, notify, notifyError, dismiss, alerts, pushAlert, dismissAlert, modals, openModal, closeModal, confirm]
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);
