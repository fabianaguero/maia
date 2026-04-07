import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface NotificationContextProps {
  notify: (type: ToastType, title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotify must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((current) => [...current, { id, type, title, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" ? (
                <CheckCircle2 color="var(--accent-warm)" />
              ) : (
                <AlertCircle color="#ff4444" />
              )}
            </div>
            <div className="toast-content">
              <span className="toast-title">{toast.title}</span>
              {toast.message && <span className="toast-message">{toast.message}</span>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "4px" }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
