import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Truck,
  CheckCircle,
  Clock,
  Star,
  Filter,
  StarHalf,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { getStatusColor, getInitials } from "@/lib/utils";
import { invoke } from "@/lib/tauri";

interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  lead_time_days: number;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupplierForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  tax_id: string;
  payment_terms: string;
  lead_time_days: number;
}

const emptyForm: SupplierForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  tax_id: "",
  payment_terms: "",
  lead_time_days: 7,
};

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const paymentTermsOptions = [
  { value: "Net 15", label: "Net 15" },
  { value: "Net 30", label: "Net 30" },
  { value: "Net 45", label: "Net 45" },
  { value: "Net 60", label: "Net 60" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < Math.floor(rating)) {
          return <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />;
        }
        if (i === Math.floor(rating) && rating % 1 >= 0.5) {
          return <StarHalf key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />;
        }
        return <Star key={i} className="h-4 w-4 text-slate-300" />;
      })}
      <span className="ml-1 text-sm text-slate-500">{rating}</span>
    </div>
  );
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadSuppliers = useCallback(async () => {
    try {
      setError(null);
      const data = await invoke<Supplier[]>("get_suppliers");
      setSuppliers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.supplier_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && s.is_active) ||
      (statusFilter === "inactive" && !s.is_active);
    return matchesSearch && matchesStatus;
  });

  const activeCount = suppliers.filter((s) => s.is_active).length;
  const avgRating =
    suppliers.length > 0
      ? suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length
      : 0;

  const updateField = (field: keyof SupplierForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await invoke("create_supplier", {
        request: {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          country: form.country.trim() || undefined,
          tax_number: form.tax_id.trim() || undefined,
          payment_terms: form.payment_terms || undefined,
          lead_time_days: form.lead_time_days,
        },
      });
      setShowAddModal(false);
      setForm(emptyForm);
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create supplier");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setForm({
      name: supplier.name,
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
      city: supplier.city ?? "",
      state: supplier.state ?? "",
      country: supplier.country ?? "",
      tax_id: supplier.tax_id ?? "",
      payment_terms: supplier.payment_terms ?? "",
      lead_time_days: supplier.lead_time_days,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedSupplier || !form.name.trim()) return;
    setSaving(true);
    try {
      await invoke("update_supplier", {
        id: selectedSupplier.id,
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state_val: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        tax_number: form.tax_id.trim() || undefined,
        payment_terms: form.payment_terms || undefined,
        lead_time_days: form.lead_time_days,
      });
      setShowEditModal(false);
      setSelectedSupplier(null);
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update supplier");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    setSaving(true);
    try {
      await invoke("update_supplier", {
        id: selectedSupplier.id,
        is_active: false,
      });
      setShowDeleteConfirm(false);
      setSelectedSupplier(null);
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete supplier");
    } finally {
      setSaving(false);
    }
  };

  const SupplierFormFields = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        label="Name *"
        placeholder="Company name"
        value={form.name}
        onChange={(e) => updateField("name", e.target.value)}
      />
      <Input
        label="Email"
        type="email"
        placeholder="email@example.com"
        value={form.email}
        onChange={(e) => updateField("email", e.target.value)}
      />
      <Input
        label="Phone"
        placeholder="9876543210"
        value={form.phone}
        onChange={(e) => updateField("phone", e.target.value)}
      />
      <Input
        label="Tax ID"
        placeholder="GSTIN / Tax number"
        value={form.tax_id}
        onChange={(e) => updateField("tax_id", e.target.value)}
      />
      <Input
        label="Address"
        placeholder="Full address"
        className="md:col-span-2"
        value={form.address}
        onChange={(e) => updateField("address", e.target.value)}
      />
      <Input
        label="City"
        placeholder="City"
        value={form.city}
        onChange={(e) => updateField("city", e.target.value)}
      />
      <Input
        label="State"
        placeholder="State"
        value={form.state}
        onChange={(e) => updateField("state", e.target.value)}
      />
      <Input
        label="Country"
        placeholder="Country"
        value={form.country}
        onChange={(e) => updateField("country", e.target.value)}
      />
      <Select
        label="Payment Terms"
        options={paymentTermsOptions}
        value={form.payment_terms}
        onChange={(e) => updateField("payment_terms", e.target.value)}
      />
      <Input
        label="Lead Time (Days)"
        type="number"
        placeholder="7"
        value={form.lead_time_days}
        onChange={(e) => updateField("lead_time_days", Number(e.target.value))}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Suppliers
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your supplier relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadSuppliers}
            disabled={loading}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setForm(emptyForm);
              setShowAddModal(true);
            }}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-rose-500 hover:text-rose-700"
          >
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Suppliers
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {loading ? "—" : suppliers.length}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5">
                <Truck className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {loading ? "—" : activeCount}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Bills
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  0
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Avg Rating
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {loading ? "—" : avgRating.toFixed(1)}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 p-2.5">
                <Star className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="w-64"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">
                Loading suppliers...
              </span>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers found"
              description="Add your first supplier to get started"
              action={{
                label: "Add Supplier",
                onClick: () => {
                  setForm(emptyForm);
                  setShowAddModal(true);
                },
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Code
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Name
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Phone
                    </th>
                    <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      Rating
                    </th>
                    <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      Payment Terms
                    </th>
                    <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3 text-sm font-medium text-indigo-600">
                        {supplier.supplier_code}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-medium text-white">
                            {getInitials(supplier.name)}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {supplier.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {supplier.email ?? "—"}
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {supplier.phone ?? "—"}
                      </td>
                      <td className="py-3 text-center">
                        <StarRating rating={supplier.rating} />
                      </td>
                      <td className="py-3 text-center text-sm text-slate-700 dark:text-slate-300">
                        {supplier.payment_terms ?? "—"}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          className={getStatusColor(
                            supplier.is_active ? "active" : "inactive"
                          )}
                        >
                          {supplier.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(supplier)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-700"
                            onClick={() => openDeleteConfirm(supplier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Supplier"
        size="lg"
      >
        <SupplierFormFields />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAddModal(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={saving || !form.name.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Supplier"
            )}
          </Button>
        </div>
      </Modal>

      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSupplier(null);
        }}
        title="View / Edit Supplier"
        size="lg"
      >
        {selectedSupplier && (
          <>
            <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <span className="font-medium">Code:</span>{" "}
              {selectedSupplier.supplier_code} &middot;{" "}
              <span className="font-medium">Created:</span>{" "}
              {new Date(selectedSupplier.created_at).toLocaleDateString()}
            </div>
            <SupplierFormFields />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSupplier(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={saving || !form.name.trim()}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedSupplier(null);
        }}
        title="Confirm Delete"
        size="sm"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to deactivate{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {selectedSupplier.name}
              </span>
              ? This will mark the supplier as inactive.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedSupplier(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Deactivate"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
