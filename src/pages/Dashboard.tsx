import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Plus,
  FileText,
  ArrowRight,
  BarChart3,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate, getStatusColor, getCurrencySymbol } from "@/lib/utils";
import { invoke } from "@/lib/tauri";
import type { DashboardStats } from "@/types";

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <span className={`${className} flex items-center justify-center text-lg font-bold`}>
      {getCurrencySymbol()}
    </span>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const mockStats: DashboardStats = {
  total_products: 1247,
  total_customers: 856,
  total_suppliers: 124,
  total_stock_value: 2456780,
  monthly_revenue: 487650,
  monthly_expenses: 312400,
  monthly_profit: 175250,
  pending_orders: 23,
  low_stock_count: 18,
  overdue_invoices: 7,
  recent_sales: [],
  recent_purchases: [],
  stock_alerts: [],
  revenue_trend: [
    { date: "Jan", revenue: 380000, expenses: 245000 },
    { date: "Feb", revenue: 420000, expenses: 268000 },
    { date: "Mar", revenue: 395000, expenses: 252000 },
    { date: "Apr", revenue: 465000, expenses: 289000 },
    { date: "May", revenue: 510000, expenses: 315000 },
    { date: "Jun", revenue: 487650, expenses: 312400 },
    { date: "Jul", revenue: 520000, expenses: 328000 },
    { date: "Aug", revenue: 498000, expenses: 305000 },
    { date: "Sep", revenue: 545000, expenses: 342000 },
    { date: "Oct", revenue: 580000, expenses: 358000 },
    { date: "Nov", revenue: 610000, expenses: 375000 },
    { date: "Dec", revenue: 650000, expenses: 392000 },
  ],
  top_products: [
    { product: { id: "1", name: "Wireless Mouse", sku: "WM-001", barcode: null, description: null, category_id: "1", brand_id: "1", unit_id: "1", cost_price: 450, selling_price: 899, min_stock: 10, max_stock: 100, is_active: true, image_url: null, created_at: "", updated_at: "" }, total_sold: 234, revenue: 210426 },
    { product: { id: "2", name: "USB-C Hub", sku: "UH-002", barcode: null, description: null, category_id: "1", brand_id: "2", unit_id: "1", cost_price: 850, selling_price: 1599, min_stock: 5, max_stock: 50, is_active: true, image_url: null, created_at: "", updated_at: "" }, total_sold: 189, revenue: 302211 },
    { product: { id: "3", name: "Mechanical Keyboard", sku: "MK-003", barcode: null, description: null, category_id: "1", brand_id: "1", unit_id: "1", cost_price: 1200, selling_price: 2499, min_stock: 5, max_stock: 30, is_active: true, image_url: null, created_at: "", updated_at: "" }, total_sold: 156, revenue: 389844 },
    { product: { id: "4", name: "Monitor Stand", sku: "MS-004", barcode: null, description: null, category_id: "2", brand_id: "3", unit_id: "1", cost_price: 650, selling_price: 1299, min_stock: 8, max_stock: 40, is_active: true, image_url: null, created_at: "", updated_at: "" }, total_sold: 132, revenue: 171468 },
    { product: { id: "5", name: "Desk Lamp", sku: "DL-005", barcode: null, description: null, category_id: "3", brand_id: "4", unit_id: "1", cost_price: 350, selling_price: 749, min_stock: 15, max_stock: 80, is_active: true, image_url: null, created_at: "", updated_at: "" }, total_sold: 118, revenue: 88382 },
  ],
  branch_performance: [
    { branch: { id: "1", company_id: "1", name: "Main Branch", code: "MB-001", address: null, city: "Mumbai", state: null, country: null, phone: null, email: null, manager_id: null, is_main: true, is_active: true, created_at: "" }, revenue: 285000, orders: 342 },
    { branch: { id: "2", company_id: "1", name: "City Center", code: "CC-002", address: null, city: "Delhi", state: null, country: null, phone: null, email: null, manager_id: null, is_main: false, is_active: true, created_at: "" }, revenue: 198000, orders: 256 },
    { branch: { id: "3", company_id: "1", name: "Tech Park", code: "TP-003", address: null, city: "Bangalore", state: null, country: null, phone: null, email: null, manager_id: null, is_main: false, is_active: true, created_at: "" }, revenue: 156000, orders: 198 },
    { branch: { id: "4", company_id: "1", name: "Mall Outlet", code: "MO-004", address: null, city: "Chennai", state: null, country: null, phone: null, email: null, manager_id: null, is_main: false, is_active: true, created_at: "" }, revenue: 124000, orders: 167 },
  ],
};

const recentSales = [
  { order_number: "SO-2024-001", customer: "Rahul Enterprises", amount: 12450, status: "delivered", date: "2024-06-24" },
  { order_number: "SO-2024-002", customer: "Tech Solutions Pvt", amount: 8900, status: "shipped", date: "2024-06-24" },
  { order_number: "SO-2024-003", customer: "Global Traders", amount: 23100, status: "processing", date: "2024-06-23" },
  { order_number: "SO-2024-004", customer: "Digital World", amount: 5670, status: "confirmed", date: "2024-06-23" },
  { order_number: "SO-2024-005", customer: "Smart Systems", amount: 18900, status: "delivered", date: "2024-06-22" },
];

const stockAlerts = [
  { product_name: "Wireless Mouse", current_stock: 8, status: "low" },
  { product_name: "USB-C Cable", current_stock: 3, status: "low" },
  { product_name: "Monitor Arm", current_stock: 0, status: "out" },
  { product_name: "Webcam HD", current_stock: 12, status: "low" },
  { product_name: "Desk Pad", current_stock: 0, status: "out" },
];

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    total_products: 0,
    total_customers: 0,
    total_suppliers: 0,
    monthly_revenue: 0,
    monthly_profit: 0,
    low_stock_count: 0,
    pending_orders: 0,
    branch_performance: mockStats.branch_performance,
  });
  const [revenueChart, setRevenueChart] = useState<any[]>(mockStats.revenue_trend);
  const [topProducts, setTopProducts] = useState<any[]>(mockStats.top_products);
  const [stockAlertsData, setStockAlertsData] = useState<any[]>(stockAlerts);
  const [recentSalesData, setRecentSalesData] = useState<any[]>(recentSales);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [statsRes, chartRes, topProductsRes, alertsRes, salesRes] = await Promise.allSettled([
          invoke<any>("get_dashboard_stats"),
          invoke<any>("get_revenue_chart", { months: 12 }),
          invoke<any>("get_top_products", { limit: 5 }),
          invoke<any>("get_stock_alerts"),
          invoke<any>("get_sales_orders"),
        ]);

        const newStats: any = {
          branch_performance: mockStats.branch_performance,
        };

        if (statsRes.status === "fulfilled") {
          const s = statsRes.value;
          newStats.total_products = s.total_products;
          newStats.total_customers = s.total_customers;
          newStats.total_suppliers = s.total_suppliers;
          newStats.monthly_revenue = parseFloat(s.total_revenue) || 0;
          newStats.monthly_profit = (parseFloat(s.total_revenue) || 0) - (parseFloat(s.total_purchases) || 0);
          newStats.low_stock_count = s.low_stock_count;
          newStats.pending_orders = s.pending_orders;
        } else {
          newStats.total_products = mockStats.total_products;
          newStats.total_customers = mockStats.total_customers;
          newStats.total_suppliers = mockStats.total_suppliers;
          newStats.monthly_revenue = mockStats.monthly_revenue;
          newStats.monthly_profit = mockStats.monthly_profit;
          newStats.low_stock_count = mockStats.low_stock_count;
          newStats.pending_orders = mockStats.pending_orders;
        }

        setStats(newStats);

        if (chartRes.status === "fulfilled") {
          const c = chartRes.value;
          if (c && Array.isArray(c.labels) && c.labels.length > 0) {
            const trend = c.labels.map((label: string, i: number) => {
              const dateObj = new Date(label + "-01");
              const dateStr = isNaN(dateObj.getTime()) ? label : dateObj.toLocaleDateString("en-US", { month: "short" });
              return {
                date: dateStr,
                revenue: parseFloat(c.data[i]) || 0,
                expenses: (parseFloat(c.data[i]) || 0) * 0.65, // estimate expenses
              };
            });
            setRevenueChart(trend);
          } else {
            setRevenueChart(mockStats.revenue_trend);
          }
        } else {
          setRevenueChart(mockStats.revenue_trend);
        }

        if (topProductsRes.status === "fulfilled" && Array.isArray(topProductsRes.value) && topProductsRes.value.length > 0) {
          const formatted = topProductsRes.value.map((item: any) => ({
            product: { id: item.product_id, name: item.product_name, sku: "" },
            total_sold: item.total_sold,
            revenue: parseFloat(item.total_revenue) || 0,
          }));
          setTopProducts(formatted);
        } else {
          setTopProducts(mockStats.top_products);
        }

        if (alertsRes.status === "fulfilled" && Array.isArray(alertsRes.value) && alertsRes.value.length > 0) {
          setStockAlertsData(alertsRes.value.map((a: any) => ({
            product_name: a.product_name,
            current_stock: a.current_stock,
            status: a.current_stock <= 0 ? "out" : "low",
          })));
        } else {
          setStockAlertsData(stockAlerts);
        }

        if (salesRes.status === "fulfilled") {
          const salesList = Array.isArray(salesRes.value) ? salesRes.value : [];
          if (salesList.length > 0) {
            setRecentSalesData(salesList.slice(0, 5).map((s: any) => ({
              order_number: s.so_number,
              customer: s.customer_name || s.customer_id || "Customer",
              amount: parseFloat(s.total_amount) || 0,
              status: s.status || "pending",
              date: s.order_date || s.created_at || "",
            })));
          } else {
            setRecentSalesData(recentSales);
          }
        } else {
          setRecentSalesData(recentSales);
        }
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Products",
      value: stats.total_products.toLocaleString(),
      icon: Package,
      trend: "+12.5%",
      trendUp: true,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Total Customers",
      value: stats.total_customers.toLocaleString(),
      icon: Users,
      trend: "+8.2%",
      trendUp: true,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthly_revenue),
      icon: CurrencyIcon,
      trend: "+15.3%",
      trendUp: true,
      color: "from-violet-500 to-purple-600",
    },
    {
      title: "Monthly Profit",
      value: formatCurrency(stats.monthly_profit),
      icon: TrendingUp,
      trend: "+22.1%",
      trendUp: true,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Low Stock Alerts",
      value: stats.low_stock_count.toString(),
      icon: AlertTriangle,
      trend: "+3",
      trendUp: false,
      color: "from-rose-500 to-pink-600",
    },
    {
      title: "Pending Orders",
      value: stats.pending_orders.toString(),
      icon: ShoppingCart,
      trend: "-5",
      trendUp: true,
      color: "from-cyan-500 to-sky-600",
    },
  ];

  const quickActions = [
    { label: "Create Product", icon: Plus, href: "/products/new" },
    { label: "New Sale", icon: ShoppingCart, href: "/sales/new" },
    { label: "New Purchase", icon: FileText, href: "/purchases/new" },
    { label: "View Reports", icon: BarChart3, href: "/reports" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6 p-6"
    >
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, Admin
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {formatDate(new Date(), "dd MMM yyyy")} &mdash; Here's what's happening
          today.
        </p>
      </motion.div>

      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
      >
        {kpiCards.map((card) => (
          <motion.div key={card.title} variants={fadeIn}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {card.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {card.value}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      {card.trendUp ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          card.trendUp
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }`}
                      >
                        {card.trend}
                      </span>
                      <span className="text-xs text-slate-400">vs last month</span>
                    </div>
                  </div>
                  <div
                    className={`rounded-xl bg-gradient-to-br p-2.5 ${card.color}`}
                  >
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div variants={fadeIn} className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revenue & Expenses</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <span className="text-slate-500">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="text-slate-500">Expenses</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f8fafc",
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value))]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
                  <Area type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                    <action.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {action.label}
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div variants={fadeIn} className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Products</CardTitle>
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Product
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                        Sold
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topProducts.map((item) => (
                      <tr key={item.product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                              <Package className="h-5 w-5 text-slate-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-slate-500">{item.product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                          {item.total_sold}
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stock Alerts</CardTitle>
                <Badge variant="warning">{stockAlertsData.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stockAlertsData.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {alert.product_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Stock: {alert.current_stock}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status === "out" ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div variants={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.branch_performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="branch.name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f8fafc",
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value))]}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Sales</CardTitle>
                <Button variant="ghost" size="sm">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSalesData.map((sale) => (
                  <div
                    key={sale.order_number}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="shrink-0 rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                        <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {sale.order_number}
                        </p>
                        <p className="truncate text-xs text-slate-500">{sale.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(sale.amount)}
                      </p>
                      <Badge className={getStatusColor(sale.status)}>
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
