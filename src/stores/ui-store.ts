import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  commandPaletteOpen: boolean;
  notificationsPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleNotificationsPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: localStorage.getItem("wqs_sidebar_collapsed") === "true",
  theme: (localStorage.getItem("wqs_theme") as "light" | "dark" | "system") || "system",
  commandPaletteOpen: false,
  notificationsPanelOpen: false,
  toggleSidebar: () =>
    set((state) => {
      const newCollapsed = !state.sidebarCollapsed;
      localStorage.setItem("wqs_sidebar_collapsed", String(newCollapsed));
      return { sidebarCollapsed: newCollapsed };
    }),
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem("wqs_sidebar_collapsed", String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },
  setTheme: (theme) => {
    localStorage.setItem("wqs_theme", theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("wqs_theme", next);
      return { theme: next };
    }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleNotificationsPanel: () => set((state) => ({ notificationsPanelOpen: !state.notificationsPanelOpen })),
}));
