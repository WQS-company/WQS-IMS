import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({ defaultValue = "", value, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value ?? internal;
  const setValue = onValueChange ?? setInternal;

  return (
    <TabsContext.Provider value={{ value: current, onValueChange: setValue }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "flex border-b border-slate-200 dark:border-slate-800",
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function TabsTrigger({ className, value, children, ...props }: TabsTriggerProps) {
  const { value: currentValue, onValueChange } = useTabs();
  const isActive = currentValue === value;
  const ref = React.useRef<HTMLButtonElement>(null);
  const [underline, setUnderline] = React.useState({ left: 0, width: 0 });

  React.useEffect(() => {
    if (isActive && ref.current) {
      setUnderline({
        left: ref.current.offsetLeft,
        width: ref.current.offsetWidth,
      });
    }
  }, [isActive]);

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        "relative px-4 py-3 text-sm font-medium transition-colors",
        isActive
          ? "text-indigo-600 dark:text-indigo-400"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
        className
      )}
      {...props}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="tabs-underline"
          className="absolute bottom-0 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
          style={{ left: underline.left, width: underline.width }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ className, value, children, ...props }: TabsContentProps) {
  const { value: currentValue } = useTabs();
  if (currentValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
