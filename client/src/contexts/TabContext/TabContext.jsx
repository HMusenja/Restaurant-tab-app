// src/contexts/TabContext/TabContext.jsx
import { createContext, useContext } from "react";

export const TabContext = createContext(null);

export function useTab() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error("useTab must be used within a TabProvider");
  return ctx;
}
