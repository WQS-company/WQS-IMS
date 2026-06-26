import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("wqs_token"),
  isAuthenticated: !!localStorage.getItem("wqs_token"),
  isLoading: false,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) localStorage.setItem("wqs_token", token);
    else localStorage.removeItem("wqs_token");
    set({ token, isAuthenticated: !!token });
  },
  login: (user, token) => {
    localStorage.setItem("wqs_token", token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("wqs_token");
    set({ user: null, token: null, isAuthenticated: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
