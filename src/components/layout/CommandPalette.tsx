import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  Moon,
  Sun,
  Download,
  Plus,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface Command {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  shortcut?: string;
  category: "navigation" | "actions" | "quick";
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUIStore();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    { id: "nav-dashboard", label: "Go to Dashboard", icon: LayoutDashboard, category: "navigation", action: () => { navigate("/"); onClose(); } },
    { id: "nav-products", label: "Go to Products", icon: Package, category: "navigation", action: () => { navigate("/products"); onClose(); } },
    { id: "nav-customers", label: "Go to Customers", icon: Users, category: "navigation", action: () => { navigate("/customers"); onClose(); } },
    { id: "nav-orders", label: "Go to Sales Orders", icon: ShoppingCart, category: "navigation", action: () => { navigate("/sales-orders"); onClose(); } },
    { id: "nav-invoices", label: "Go to Invoices", icon: FileText, category: "navigation", action: () => { navigate("/invoices"); onClose(); } },
    { id: "nav-settings", label: "Go to Settings", icon: Settings, category: "navigation", action: () => { navigate("/settings"); onClose(); } },
    // Actions
    { id: "act-product", label: "Create Product", icon: Plus, description: "Add a new product to inventory", category: "actions", action: () => { navigate("/products/new"); onClose(); } },
    { id: "act-customer", label: "Create Customer", icon: Plus, description: "Add a new customer", category: "actions", action: () => { navigate("/customers/new"); onClose(); } },
    { id: "act-invoice", label: "Create Invoice", icon: Plus, description: "Generate a new invoice", category: "actions", action: () => { navigate("/invoices/new"); onClose(); } },
    { id: "act-po", label: "Create Purchase Order", icon: Plus, description: "Create a new purchase order", category: "actions", action: () => { navigate("/purchase-orders/new"); onClose(); } },
    // Quick
    { id: "quick-theme", label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode", icon: theme === "dark" ? Sun : Moon, category: "quick", shortcut: "⌘T", action: () => { toggleTheme(); onClose(); } },
    { id: "quick-export", label: "Export Data", icon: Download, category: "quick", action: () => { onClose(); } },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = {
    navigation: filtered.filter((c) => c.category === "navigation"),
    actions: filtered.filter((c) => c.category === "actions"),
    quick: filtered.filter((c) => c.category === "quick"),
  };

  const flatFiltered = [...grouped.navigation, ...grouped.actions, ...grouped.quick];

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatFiltered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatFiltered.length) % flatFiltered.length);
      } else if (e.key === "Enter" && flatFiltered[selectedIndex]) {
        flatFiltered[selectedIndex].action();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, flatFiltered, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
              />
              <kbd className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-600">
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {flatFiltered.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">No results found</div>
              )}
              {Object.entries(grouped).map(([category, items]) =>
                items.length > 0 ? (
                  <div key={category} className="mb-2">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {category}
                    </div>
                    {items.map((cmd) => {
                      const idx = flatFiltered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            idx === selectedIndex
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          )}
                        >
                          <cmd.icon className="h-4 w-4 shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-slate-500">{cmd.description}</div>
                            )}
                          </div>
                          {cmd.shortcut && (
                            <kbd className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-600">
                              {cmd.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                ) : null
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { CommandPalette };
