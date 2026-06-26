import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, cn } from "@/lib/utils";
import { invoke } from "@/lib/tauri";
import type { Product, Warehouse } from "@/types";

interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  product?: Product;
  warehouse?: Warehouse;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "IN", label: "Inbound" },
  { value: "OUT", label: "Outbound" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "IN":
      return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
    case "OUT":
      return <ArrowUpRight className="h-4 w-4 text-rose-500" />;
    case "TRANSFER":
      return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
    case "ADJUSTMENT":
      return <RefreshCw className="h-4 w-4 text-amber-500" />;
    default:
      return null;
  }
};

const getTypeBadgeClass = (type: string) => {
  switch (type) {
    case "IN":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "OUT":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    case "TRANSFER":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "ADJUSTMENT":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "IN":
      return "Inbound";
    case "OUT":
      return "Outbound";
    case "TRANSFER":
      return "Transfer";
    case "ADJUSTMENT":
      return "Adjustment";
    default:
      return type;
  }
};

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true);
      const args: Record<string, unknown> = {};
      const data = await invoke<StockMovement[]>("get_stock_movements", args);
      setMovements(data);
    } catch (e) {
      console.error("Failed to load stock movements:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6 p-6"
    >
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Stock Movements
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track all inventory movements and history
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadMovements}
            disabled={loading}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
        <div className="w-64">
          <Input
            placeholder="Search product, SKU, or reference..."
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-1 h-4 w-4" /> From: Jun 1
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-1 h-4 w-4" /> To: Jun 24
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMovements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(movement.created_at, "dd MMM yyyy hh:mm A")}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {movement.product?.name}
                        </p>
                        <p className="text-xs text-slate-500">{movement.product?.sku}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("gap-1", getTypeBadgeClass(movement.movement_type))}>
                        {getTypeIcon(movement.movement_type)}
                        <span>{getTypeLabel(movement.movement_type)}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {movement.warehouse?.name}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right text-sm font-medium",
                      movement.quantity < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {movement.reference_type && (
                        <span>
                          {movement.reference_type}
                          {movement.reference_id && ` #${movement.reference_id}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {movement.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
