import { create } from "zustand";
import { invoke } from "@/lib/tauri";
import type { AppSetting } from "@/types";

interface SettingsState {
  settings: Record<string, string>;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    currency: localStorage.getItem("wqs_currency") || "NGN",
    company_name: localStorage.getItem("wqs_company_name") || "My Company",
    tax_rate: localStorage.getItem("wqs_tax_rate") || "18",
    low_stock_threshold: localStorage.getItem("wqs_low_stock_threshold") || "10",
  },
  loading: false,
  error: null,
  loadSettings: async () => {
    try {
      set({ loading: true, error: null });
      const data = await invoke<AppSetting[]>("get_settings");
      const map: Record<string, string> = {};
      data.forEach((s) => {
        map[s.setting_key] = s.setting_value ?? "";
      });
      // Save to local storage for quick access before initial load
      Object.entries(map).forEach(([k, v]) => {
        localStorage.setItem(`wqs_${k}`, v);
      });
      set({ settings: map });
    } catch (e) {
      console.error("Failed to load settings from Tauri:", e);
      set({ error: "Failed to load settings" });
    } finally {
      set({ loading: false });
    }
  },
  updateSetting: async (key: string, value: string) => {
    try {
      await invoke("update_setting", { key, value });
      localStorage.setItem(`wqs_${key}`, value);
      set((state) => ({
        settings: { ...state.settings, [key]: value }
      }));
    } catch (e) {
      console.error(`Failed to update setting ${key}:`, e);
      throw e;
    }
  }
}));
