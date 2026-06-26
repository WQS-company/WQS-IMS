import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Eye,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { invoke } from "@/lib/tauri";

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  branch_id: string | null;
  warehouse_id: string | null;
  status: string;
  order_date: string | null;
  expected_date: string | null;
  total_amount: number | null;
  subtotal: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusTabs = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<PurchaseOrder[]>("get_purchase_orders");
      setOrders(data);
    } catch (error) {
      console.error("Failed to load purchase orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await invoke("update_po_status", { id, status });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplier_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeTab === "all" || o.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const getTabCount = (status: string) => {
    if (status === "all") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-10 w-96" />
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
            Purchase Orders
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your purchase orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadOrders}
            disabled={loading}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button icon={<Plus className="h-4 w-4" />}>
            New Purchase Order
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label} ({getTabCount(tab.value)})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
        <div className="w-64">
          <Input
            placeholder="Search PO number or supplier..."
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div variants={fadeIn}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Expected
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {order.po_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {order.supplier_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {order.order_date ? formatDate(order.order_date, "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {order.expected_date ? formatDate(order.expected_date, "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(order.total_amount ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStatusColor(order.status.replace("_", " "))}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {order.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600"
                            onClick={() => handleStatusUpdate(order.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                        )}
                        {order.status === "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600"
                            onClick={() => handleStatusUpdate(order.id, "RECEIVED")}
                          >
                            Mark Received
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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