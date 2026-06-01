"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";

// ─── State ────────────────────────────────────────────────────────────────────

interface DrawerState {
  type: "company" | "contact" | "application" | "cv" | "training" | "meeting" | null;
  id: string | null;
}

interface Toast {
  id: string;
  message: string;
}

interface AppState {
  drawer: DrawerState;
  toasts: Toast[];
  sidebarCollapsed: boolean;
}

const initialState: AppState = {
  drawer: { type: null, id: null },
  toasts: [],
  sidebarCollapsed: false,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

type AppAction =
  | { type: "OPEN_DRAWER"; payload: DrawerState }
  | { type: "CLOSE_DRAWER" }
  | { type: "SHOW_TOAST"; payload: { message: string } }
  | { type: "DISMISS_TOAST"; payload: { id: string } }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR"; payload: { collapsed: boolean } };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "OPEN_DRAWER":
      return { ...state, drawer: action.payload };
    case "CLOSE_DRAWER":
      return { ...state, drawer: { type: null, id: null } };
    case "SHOW_TOAST": {
      const id = crypto.randomUUID();
      return { ...state, toasts: [...state.toasts, { id, message: action.payload.message }] };
    }
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload.id) };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case "SET_SIDEBAR":
      return { ...state, sidebarCollapsed: action.payload.collapsed };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}

// ─── Convenience hooks ───────────────────────────────────────────────────────

export function useDrawer() {
  const { state, dispatch } = useAppStore();
  return {
    drawer: state.drawer,
    openDrawer: (payload: DrawerState) => dispatch({ type: "OPEN_DRAWER", payload }),
    closeDrawer: () => dispatch({ type: "CLOSE_DRAWER" }),
  };
}

export function useToast() {
  const { state, dispatch } = useAppStore();
  return {
    toasts: state.toasts,
    showToast: (message: string) => dispatch({ type: "SHOW_TOAST", payload: { message } }),
    dismissToast: (id: string) => dispatch({ type: "DISMISS_TOAST", payload: { id } }),
  };
}

export function useSidebar() {
  const { state, dispatch } = useAppStore();
  return {
    collapsed: state.sidebarCollapsed,
    toggle: () => dispatch({ type: "TOGGLE_SIDEBAR" }),
  };
}
