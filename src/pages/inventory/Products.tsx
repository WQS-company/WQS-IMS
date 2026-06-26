import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Package,
  Eye,
  Image,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, getStatusColor, resolveImageUrl } from "@/lib/utils";
import { invoke } from "@/lib/tauri";
import type { Product } from "@/types";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<Product[]>("get_products");
      setProducts(data);
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleDelete = async (id: string) => {
    try {
      await invoke("delete_product", { id });
      setDeleteConfirmId(null);
      setOpenActionId(null);
      loadProducts();
    } catch (e) {
      console.error("Failed to delete product:", e);
      alert("Failed to delete product: " + e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} products?`)) return;
    for (const id of selectedIds) {
      await invoke("delete_product", { id });
    }
    setSelectedIds([]);
    loadProducts();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
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
      <motion.div variants={fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            My Products
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            All the items you sell
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadProducts}
            disabled={loading}
            className="h-11 w-11 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            className="h-11 px-5"
            onClick={() => navigate("/products/new")}
          >
            Add New Product
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Find a product..."
            icon={<Search className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              statusFilter === "active"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              statusFilter === "inactive"
                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Inactive
          </button>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("table")}
              className={`flex h-9 w-9 items-center justify-center rounded-l-lg transition-colors ${
                viewMode === "table"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-9 w-9 items-center justify-center rounded-r-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20"
        >
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
            {selectedIds.length} selected
          </span>
          <Button variant="ghost" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="mr-1 h-4 w-4" /> Export
          </Button>
        </motion.div>
      )}

      {viewMode === "table" ? (
        <motion.div variants={fadeIn}>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Price
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
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            {product.image_url ? (
                              <img src={resolveImageUrl(product.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">{product.brand?.name ?? ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                        {formatCurrency(product.cost_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(product.selling_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={getStatusColor(product.is_active ? "active" : "inactive")}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenActionId(openActionId === product.id ? null : product.id)}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {openActionId === product.id && (
                            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                              <button
                                onClick={() => {
                                  setOpenActionId(null);
                                  navigate(`/products/${product.id}/edit`);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Eye className="h-4 w-4" /> View
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionId(null);
                                  navigate(`/products/${product.id}/edit`);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                <Edit className="h-4 w-4" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setOpenActionId(null);
                                  setDeleteConfirmId(product.id);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeIn}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredProducts.map((product) => (
            <motion.div key={product.id} variants={fadeIn}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                  {product.image_url ? (
                    <img src={resolveImageUrl(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  <Badge
                    className={`absolute left-2 top-2 ${getStatusColor(
                      product.is_active ? "active" : "inactive"
                    )}`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {product.name}
                  </h3>
                  <p className="truncate text-xs text-slate-500">{product.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(product.selling_price)}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(product.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {filteredProducts.length === 0 && (
        <motion.div variants={fadeIn} className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <Package className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            No products found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try a different name or add a new product
          </p>
          <Button
            className="mt-4 h-11 px-5"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate("/products/new")}
          >
            Add New Product
          </Button>
        </motion.div>
      )}

      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </motion.div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Delete Product?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              This action cannot be undone. The product will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
