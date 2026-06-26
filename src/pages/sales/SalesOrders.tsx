import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, getStatusColor, getCurrencySymbol } from "@/lib/utils";
import { invoke } from "@/lib/tauri";

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <span className={`${className} flex items-center justify-center font-bold`}>
      {getCurrencySymbol()}
    </span>
  );
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  branch_id: string | null;
  warehouse_id: string | null;
  status: string;
  order_date: string | null;
  expected_date: string | null;
  total_amount: number | null;
  subtotal: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  shipping_cost: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const statusTabs = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const nextStatusMap: Record<string, string> = {
  draft: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
};

export default function SalesOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<SalesOrder[]>("get_sales_orders");
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await invoke("update_so_status", { id, status });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      console.log("Delete order:", id);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = activeTab === "all" || order.status === activeTab;
    const matchesSearch =
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_id?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  const summaryCards = [
    { title: "Total Orders", value: String(orders.length), icon: ShoppingCart, color: "from-indigo-500 to-violet-600" },
    {
      title: "This Month",
      value: String(
        orders.filter((o) => {
          const d = new Date(o.order_date ?? o.created_at);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length
      ),
      icon: Calendar,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Pending",
      value: String(orders.filter((o) => ["draft", "confirmed", "processing"].includes(o.status)).length),
      icon: Clock,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Revenue",
      value: formatCurrency(orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0)),
      icon: CurrencyIcon,
      color: "from-rose-500 to-pink-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sales Orders</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your sales orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button icon={<Plus className="h-4 w-4" />}>New Sales Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br p-2.5 ${card.color}`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                  className="w-64"
                />
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading orders...
                </div>
              ) : paginatedOrders.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="No orders found"
                  description="No sales orders match your criteria"
                />
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Order #</th>
                        <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                        <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Subtotal</th>
                        <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Tax</th>
                        <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Total</th>
                        <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                        <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedOrders.map((order) => {
                        const nextStatus = nextStatusMap[order.status];
                        return (
                          <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 text-sm font-medium text-indigo-600">{order.order_number}</td>
                            <td className="py-3 text-sm text-slate-500">{order.order_date ? formatDate(order.order_date) : "—"}</td>
                            <td className="py-3 text-right text-sm text-slate-700 dark:text-slate-300">{formatCurrency(order.subtotal ?? 0)}</td>
                            <td className="py-3 text-right text-sm text-slate-700 dark:text-slate-300">{formatCurrency(order.tax_amount ?? 0)}</td>
                            <td className="py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">{formatCurrency(order.total_amount ?? 0)}</td>
                            <td className="py-3 text-center">
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {nextStatus && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-emerald-600 hover:text-emerald-700"
                                    disabled={updatingId === order.id}
                                    onClick={() => handleStatusUpdate(order.id, nextStatus)}
                                  >
                                    {updatingId === order.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : null}
                                    {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700" onClick={() => handleDelete(order.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} orders
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Page {page} of {totalPages}
                      </span>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
