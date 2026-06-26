import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { useSettingsStore } from "@/stores/settings-store";
import { convertFileSrc } from "@/lib/tauri";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http:") || url.startsWith("https:") || url.startsWith("blob:")) {
    return url;
  }
  return convertFileSrc(url);
}

export function formatCurrency(amount: number, currency?: string): string {
  const activeCurrency = currency || useSettingsStore.getState().settings.currency || "NGN";
  let locale = "en-US";
  if (activeCurrency === "INR") {
    locale = "en-IN";
  } else if (activeCurrency === "NGN") {
    locale = "en-NG";
  } else if (activeCurrency === "EUR") {
    locale = "de-DE";
  } else if (activeCurrency === "GBP") {
    locale = "en-GB";
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: activeCurrency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  EGP: "£E",
  AED: "د.إ",
  SAR: "﷼",
};

export function getCurrencySymbol(currency?: string): string {
  const activeCurrency = currency || useSettingsStore.getState().settings.currency || "NGN";
  return CURRENCY_SYMBOLS[activeCurrency] ?? activeCurrency;
}

export function formatNumber(number: number, decimals: number = 2): string {
  const activeCurrency = useSettingsStore.getState().settings.currency || "NGN";
  const locale = activeCurrency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

export function formatDate(date: string | Date, format: string = "dd/MM/yyyy"): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  switch (format) {
    case "dd/MM/yyyy": return `${day}/${month}/${year}`;
    case "MM/dd/yyyy": return `${month}/${day}/${year}`;
    case "yyyy-MM-dd": return `${year}-${month}-${day}`;
    case "dd MMM yyyy": return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
    case "dd MMM yyyy hh:mm A": return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    default: return d.toLocaleDateString("en-IN");
  }
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

export function generateSKU(category: string, id: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(id).padStart(6, "0")}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    overdue: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    shipped: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    open: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    low: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    out: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };
  return colors[status.toLowerCase()] || colors.draft;
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}
