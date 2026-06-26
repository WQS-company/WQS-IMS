import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bell,
  Check,
  AlertTriangle,
  Info,
  Package,
  ShoppingCart,
  CreditCard,
  User,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "order" | "stock" | "payment" | "user";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "New Sales Order",
    message: "SO-2024-001 has been created by John Doe",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    type: "stock",
    title: "Low Stock Alert",
    message: "Product 'Widget A' is below minimum level",
    time: "15 min ago",
    read: false,
  },
  {
    id: "3",
    type: "payment",
    title: "Payment Received",
    message: `Invoice INV-2024-015 payment of ${formatCurrency(2500)} received`,
    time: "1 hour ago",
    read: true,
  },
  {
    id: "4",
    type: "user",
    title: "New Staff Member",
    message: "Sarah Williams has been added to the team",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "warning",
    title: "Purchase Order Overdue",
    message: "PO-2024-003 delivery is 2 days overdue",
    time: "5 hours ago",
    read: false,
  },
];

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: Check,
  order: ShoppingCart,
  stock: Package,
  payment: CreditCard,
  user: User,
};

const colorMap = {
  info: "text-sky-500 bg-sky-100 dark:bg-sky-900/30",
  warning: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  success: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
  order: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
  stock: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  payment: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
  user: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
};

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>(mockNotifications);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed bottom-0 right-0 top-0 z-[70] w-full max-w-md border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead}>
                      Mark all read
                    </Button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                      <Bell className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                      No notifications
                    </h3>
                    <p className="text-sm text-slate-500">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map((notification) => {
                      const Icon = iconMap[notification.type];
                      return (
                        <motion.button
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => markAsRead(notification.id)}
                          className={cn(
                            "flex w-full gap-3 px-6 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            !notification.read && "border-l-2 border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              colorMap[notification.type]
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p
                                className={cn(
                                  "text-sm font-medium",
                                  notification.read
                                    ? "text-slate-600 dark:text-slate-400"
                                    : "text-slate-900 dark:text-slate-100"
                                )}
                              >
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="ml-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{notification.time}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { NotificationsPanel };
