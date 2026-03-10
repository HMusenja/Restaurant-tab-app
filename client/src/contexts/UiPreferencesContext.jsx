import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const UiPreferencesContext = createContext(null);

const STORAGE_KEY = "staff.uiPreferences.v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getInitialState() {
  const defaults = { darkMode: true, compact: false };

  if (typeof window === "undefined") return defaults;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;

  return {
    darkMode:
      typeof parsed?.darkMode === "boolean" ? parsed.darkMode : defaults.darkMode,
    compact:
      typeof parsed?.compact === "boolean" ? parsed.compact : defaults.compact,
  };
}

// ✅ MUST be in module scope so it is always defined
function applyClasses(next) {
  if (typeof document === "undefined") return;

  const html = document.documentElement; // <html>

  if (next.darkMode) html.classList.add("dark");
  else html.classList.remove("dark");

  if (next.compact) html.classList.add("ui-compact");
  else html.classList.remove("ui-compact");
}

export function UiPreferencesProvider({ children }) {
  const [state, setState] = useState(() => getInitialState());

  // Apply on mount + persist
  useEffect(() => {
    applyClasses(state);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }

    console.log("[UI] mounted/applied:", {
      state,
      htmlClass: typeof document !== "undefined" ? document.documentElement.className : "",
      stored: typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : "",
    });
  }, []); // mount only

  // Persist whenever state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  function setDarkMode(next) {
    const normalized = !!next;
    console.log("[UI] setDarkMode called with:", normalized);

    setState((prev) => {
      const merged = { ...prev, darkMode: normalized };
      applyClasses(merged);

      console.log("[UI] new state:", merged);
      console.log(
        "[UI] html has dark class:",
        document.documentElement.classList.contains("dark")
      );
      console.log("[UI] html className:", document.documentElement.className);

      return merged;
    });
  }

  function setCompact(next) {
    const normalized = !!next;
    console.log("[UI] setCompact called with:", normalized);

    setState((prev) => {
      const merged = { ...prev, compact: normalized };
      applyClasses(merged);

      console.log("[UI] new state:", merged);
      console.log(
        "[UI] html has ui-compact class:",
        document.documentElement.classList.contains("ui-compact")
      );
      console.log("[UI] html className:", document.documentElement.className);

      return merged;
    });
  }

  function toggleDarkMode() {
    setDarkMode(!state.darkMode);
  }

  function toggleCompact() {
    setCompact(!state.compact);
  }

  const value = useMemo(
    () => ({
      darkMode: !!state.darkMode,
      compact: !!state.compact,
      setDarkMode,
      setCompact,
      toggleDarkMode,
      toggleCompact,
    }),
    [state.darkMode, state.compact]
  );

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences() {
  const ctx = useContext(UiPreferencesContext);
  if (!ctx) throw new Error("useUiPreferences must be used inside UiPreferencesProvider");
  return ctx;
}