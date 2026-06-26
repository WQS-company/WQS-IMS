import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Search,
  Download,
  RefreshCw,
  Warehouse,
  Edit,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { invoke } from "@/lib/tauri";

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
  min_stock: number;
  max_stock: number;
  is_active: boolean;
}

interface WarehouseType {
  id: string;
  name: string;
  code: string | null;
}

interface StockLevel {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  updated_at: string;
  product?: Product;
  warehouse?: WarehouseType;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function StockLevels() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [levels, wh] = await Promise.all([
        invoke<StockLevel[]>("get_stock_levels"),
        invoke<WarehouseType[]>("get_warehouses"),
      ]);
      setStockLevels(levels);
      setWarehouses(wh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock levels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStockStatus = (level: StockLevel) => {
    if (level.quantity === 0) return "out";
    if (level.quantity <= (level.product?.min_stock ?? 0)) return "low";
    return "normal";
  };

  const filteredLevels = stockLevels.filter((level) => {
    const matchesSearch =
      level.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      level.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse =
      !warehouseFilter || level.warehouse_id === warehouseFilter;
    const matchesStatus =
      statusFilter === "all" || getStockStatus(level) === statusFilter;
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const totalProducts = stockLevels.length;
  const totalValue = stockLevels.reduce(
    (sum, l) => sum + l.quantity * (l.product?.cost_price ?? 0),
    0
  );
  const lowStock = stockLevels.filter((l) => getStockStatus(l) === "low").length;
  const outOfStock = stockLevels.filter((l) => getStockStatus(l) === "out").length;

  const warehouseOptions = [
    { value: "", label: "All Warehouses" },
    ...warehouses.map((w) => ({ value: w.id, label: w.name })),
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "normal", label: "Normal" },
    { value: "low", label: "Low Stock" },
    { value: "out", label: "Out of Stock" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Stock Levels
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Monitor inventory across warehouses
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-10 w-10 text-rose-500 mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>
              Retry
            </Button>
          </CardContent>
        </Card>
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
            Stock Levels
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Monitor inventory across warehouses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button variant="outline" icon={<RefreshCw className="h-4 w-4" />} onClick={loadData}>
            Refresh
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/30">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Products</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/30">
                <Warehouse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Stock Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-2.5 dark:bg-rose-900/30">
                <TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Out of Stock</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
        <div className="w-64">
          <Input
            placeholder="Search by name or SKU..."
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          options={warehouseOptions}
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="w-48"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Warehouse
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Reserved
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Available
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Last Updated
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLevels.map((level) => {
                  const status = getStockStatus(level);
                  const available = level.quantity - level.reserved_quantity;
                  return (
                    <tr
                      key={level.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {level.product?.name}
                          </p>
                          <p className="text-xs text-slate-500">{level.product?.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {level.warehouse?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                        {level.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                        {level.reserved_quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                        {available}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={getStatusColor(status)}>
                          {status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "Normal"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(level.updated_at, "dd MMM yyyy hh:mm A")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="sm" icon={<Edit className="h-3.5 w-3.5" />}>
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
