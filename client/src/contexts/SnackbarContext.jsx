import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const SnackbarContext = createContext(null);

let idCounter = 0;

export function SnackbarProvider({ children }) {
  const [snacks, setSnacks] = useState([]);

  const removeSnackbar = useCallback((id) => {
    setSnacks((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const showSnackbar = useCallback(
    ({
      message,
      description,
      type = "info",
      duration = 3000,
      action,
    }) => {
      const id = ++idCounter;

      setSnacks((prev) => [
        ...prev,
        { id, message, description, type, action },
      ]);

      if (duration !== Infinity) {
        setTimeout(() => {
          removeSnackbar(id);
        }, duration);
      }

      return id;
    },
    [removeSnackbar],
  );

  return (
    <SnackbarContext.Provider value={{ showSnackbar, removeSnackbar }}>
      {children}
      <SnackbarHost snacks={snacks} onClose={removeSnackbar} />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error("useSnackbar must be used inside SnackbarProvider");
  }
  return ctx;
}

function SnackbarHost({ snacks, onClose }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md px-4">
      {snacks.map((snack) => (
        <SnackbarItem key={snack.id} {...snack} onClose={onClose} />
      ))}
    </div>
  );
}

function SnackbarItem({
  id,
  message,
  description,
  type,
  action,
  onClose,
}) {
  const variant = {
    success: {
      bg: "bg-success/10 border-success/20",
      text: "text-success",
      icon: CheckCircle2,
    },
    error: {
      bg: "bg-destructive/10 border-destructive/20",
      text: "text-destructive",
      icon: AlertCircle,
    },
    info: {
      bg: "bg-primary/10 border-primary/20",
      text: "text-primary",
      icon: Info,
    },
  }[type];

  const Icon = variant.icon;

  return (
    <div
      className={`rounded-2xl border shadow-elevated backdrop-blur bg-card animate-slide-down p-4 flex gap-3 ${variant.bg}`}
    >
      <div className={`mt-1 ${variant.text}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <div className="font-semibold text-foreground">{message}</div>
        {description && (
          <div className="text-sm text-muted-foreground mt-1">
            {description}
          </div>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
