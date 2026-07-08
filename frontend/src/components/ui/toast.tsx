"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X, Bell } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

import { ICON_STROKE } from "@/lib/icon-style";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "notification";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  addToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = String(++toastId);
    setToasts((prev) => [...prev, { ...toast, id }]);

    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container — top right */}
      <div className="fixed top-4 right-4 z-[9990] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="size-5 text-emerald-500" strokeWidth={ICON_STROKE} />,
    error: <AlertTriangle className="size-5 text-red-500" strokeWidth={ICON_STROKE} />,
    info: <Info className="size-5 text-blue-500" strokeWidth={ICON_STROKE} />,
    notification: <Bell className="size-5 text-primary" strokeWidth={ICON_STROKE} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-xl",
        "border-border/80 bg-card/95 dark:border-white/10 dark:bg-zinc-900/95",
      )}
    >
      <div className="shrink-0 pt-0.5">{icons[toast.type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" strokeWidth={ICON_STROKE} />
      </button>
    </motion.div>
  );
}
