import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Tag,
  Boxes,
  ArrowLeftRight,
  Warehouse,
  ShoppingCart,
  ShoppingCartIcon,
  Users,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    label: "HOME",
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }],
  },
  {
    label: "INVENTORY",
    items: [
      { label: "Products", path: "/products", icon: Package },
      { label: "Categories", path: "/categories", icon: Tag },
      { label: "Stock Levels", path: "/stock-levels", icon: Boxes },
      { label: "Stock Movements", path: "/stock-movements", icon: ArrowLeftRight },
      { label: "Warehouses", path: "/warehouses", icon: Warehouse },
    ],
  },
  {
    label: "BUY & SELL",
    items: [
      { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart },
      { label: "Sales Orders", path: "/sales-orders", icon: ShoppingCartIcon },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { label: "Customers", path: "/customers", icon: Users },
      { label: "Suppliers", path: "/suppliers", icon: Truck },
    ],
  },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const collapsed = mobile ? false : sidebarCollapsed;

  return (
    <>
      {mobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <motion.aside
        initial={mobile ? { x: -280 } : false}
        animate={mobile ? { x: 0 } : undefined}
        exit={mobile ? { x: -280 } : undefined}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col bg-slate-950 text-white",
          collapsed ? "w-16" : "w-64",
          mobile && "w-64 shadow-2xl"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-white/10 px-4", collapsed && "justify-center")}>
          {!collapsed && (
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white">
                W
              </div>
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-lg font-bold text-transparent">
                WQS IMS
              </span>
            </div>
          )}
          {mobile ? (
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={toggleSidebar} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10">
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navigation.map((section) => (
            <div key={section.label} className="mb-2">
              {!collapsed && (
                <div className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={mobile ? onClose : undefined}
                    className={cn(
                      "group relative mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-indigo-500"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-indigo-400")} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {collapsed && (
                      <div className="pointer-events-none absolute left-full ml-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-2">
          <Link
            to="/settings"
            onClick={mobile ? onClose : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
              location.pathname === "/settings" && "bg-white/10 text-white",
              collapsed && "justify-center px-0"
            )}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </motion.aside>
    </>
  );
}

export { Sidebar };
