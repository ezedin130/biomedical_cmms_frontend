import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, tone = 'ok') => {
    setToast({ message, tone, key: Date.now() });
    setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && <div className={`toast toast-${toast.tone}`} key={toast.key}>{toast.message}</div>}
    </ToastContext.Provider>
  );
}
