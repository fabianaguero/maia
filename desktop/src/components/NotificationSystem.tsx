import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useT } from "../i18n/I18nContext";
import {
  appendToast,
  createToast,
  removeToastById,
  type Toast,
  type ToastType,
} from "./notificationRuntime";

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
  const t = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((type: ToastType, title: string, message?: string) => {
    const toast = createToast({ type, title, message }, Math.random());
    setToasts((current) => appendToast(current, toast));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((current) => removeToastById(current, toast.id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((current) => removeToastById(current, id));
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
              type="button"
              aria-label={t.simpleMode.common.dismissNotification}
              onClick={() => removeToast(toast.id)}
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
