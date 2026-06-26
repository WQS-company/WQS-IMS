import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  AlertTriangle,
  Star,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, getStatusColor, getInitials, cn } from "@/lib/utils";
import { invoke } from "@/lib/tauri";
import type { Customer } from "@/types";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  tax_number: "",
  credit_limit: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [addForm, setAddForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<Customer[]>("get_customers");
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.customer_code.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q);
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && c.is_active) ||
      (activeFilter === "inactive" && !c.is_active);
    return matchesSearch && matchesActive;
  });

  const totalOutstanding = customers.reduce((s, c) => s + c.outstanding_balance, 0);
  const totalLoyalty = customers.reduce((s, c) => s + c.loyalty_points, 0);
  const activeCount = customers.filter((c) => c.is_active).length;

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
      country: customer.country ?? "",
      tax_number: customer.tax_id ?? "",
      credit_limit: customer.credit_limit.toString(),
    });
    setShowEditModal(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async () => {
    if (!addForm.name.trim()) return;
    setSubmitting(true);
    try {
      await invoke("create_customer", {
        request: {
          name: addForm.name.trim(),
          email: addForm.email.trim() || undefined,
          phone: addForm.phone.trim() || undefined,
          address: addForm.address.trim() || undefined,
          city: addForm.city.trim() || undefined,
          state: addForm.state.trim() || undefined,
          country: addForm.country.trim() || undefined,
          tax_number: addForm.tax_number.trim() || undefined,
          credit_limit: addForm.credit_limit ? parseFloat(addForm.credit_limit) : undefined,
        },
      });
      setShowAddModal(false);
      setAddForm(emptyForm);
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedCustomer || !editForm.name.trim()) return;
    setSubmitting(true);
    try {
      await invoke("update_customer", {
        id: selectedCustomer.id,
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        address: editForm.address.trim() || undefined,
        city: editForm.city.trim() || undefined,
        state_val: editForm.state.trim() || undefined,
        country: editForm.country.trim() || undefined,
        tax_number: editForm.tax_number.trim() || undefined,
        credit_limit: editForm.credit_limit ? parseFloat(editForm.credit_limit) : undefined,
      });
      setShowEditModal(false);
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;
    try {
      await invoke("delete_customer", { id: selectedCustomer.id });
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete not yet implemented");
      setShowDeleteModal(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Customers
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCustomers}
            disabled={loading}
            className="h-11 w-11 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
            className="h-11"
          >
            Add Customer
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-3"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Customers
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {customers.length}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5">
                <Users className="h-5 w-5 text-white" />
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
                  {activeCount}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Outstanding Balance
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Loyalty Points
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalLoyalty.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 p-2.5">
                <Star className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="w-full sm:w-64"
            />
            <div className="flex gap-1 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "rounded-md px-3 py-2 text-xs font-medium capitalize transition-colors",
                    activeFilter === f
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchCustomers()}
              title="Refresh"
              className="h-9 w-9 shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">
                Loading customers...
              </span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Add your first customer to get started"
              action={{
                label: "Add Customer",
                onClick: () => setShowAddModal(true),
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
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Outstanding
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Loyalty
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
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3 text-sm font-medium text-indigo-600">
                        {customer.customer_code}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-medium text-white">
                            {getInitials(customer.name)}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {customer.email ?? "—"}
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {customer.phone ?? "—"}
                      </td>
                      <td
                        className={cn(
                          "py-3 text-right text-sm font-medium",
                          customer.outstanding_balance > 0
                            ? "text-rose-600"
                            : "text-slate-500"
                        )}
                      >
                        {formatCurrency(customer.outstanding_balance)}
                      </td>
                      <td className="py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                        {customer.loyalty_points.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          className={getStatusColor(
                            customer.is_active ? "active" : "inactive"
                          )}
                        >
                          {customer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleView(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleEdit(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-rose-500 hover:text-rose-700"
                            onClick={() => handleDelete(customer)}
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

      {/* Add Customer Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Customer"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSubmit}
              loading={submitting}
              disabled={!addForm.name.trim()}
            >
              Create Customer
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Name *"
            placeholder="Company name"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
          />
          <Input
            label="Phone"
            placeholder="9876543210"
            value={addForm.phone}
            onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
          />
          <Input
            label="Tax ID"
            placeholder="GSTIN / Tax number"
            value={addForm.tax_number}
            onChange={(e) =>
              setAddForm({ ...addForm, tax_number: e.target.value })
            }
          />
          <Input
            label="Address"
            placeholder="Full address"
            className="md:col-span-2"
            value={addForm.address}
            onChange={(e) =>
              setAddForm({ ...addForm, address: e.target.value })
            }
          />
          <Input
            label="City"
            placeholder="City"
            value={addForm.city}
            onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
          />
          <Input
            label="State"
            placeholder="State"
            value={addForm.state}
            onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
          />
          <Input
            label="Country"
            placeholder="Country"
            value={addForm.country}
            onChange={(e) =>
              setAddForm({ ...addForm, country: e.target.value })
            }
          />
          <Input
            label="Credit Limit"
            type="number"
            placeholder="0"
            value={addForm.credit_limit}
            onChange={(e) =>
              setAddForm({ ...addForm, credit_limit: e.target.value })
            }
          />
        </div>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              loading={submitting}
              disabled={!editForm.name.trim()}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Name *"
            placeholder="Company name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            value={editForm.email}
            onChange={(e) =>
              setEditForm({ ...editForm, email: e.target.value })
            }
          />
          <Input
            label="Phone"
            placeholder="9876543210"
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
          />
          <Input
            label="Tax ID"
            placeholder="GSTIN / Tax number"
            value={editForm.tax_number}
            onChange={(e) =>
              setEditForm({ ...editForm, tax_number: e.target.value })
            }
          />
          <Input
            label="Address"
            placeholder="Full address"
            className="md:col-span-2"
            value={editForm.address}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.target.value })
            }
          />
          <Input
            label="City"
            placeholder="City"
            value={editForm.city}
            onChange={(e) =>
              setEditForm({ ...editForm, city: e.target.value })
            }
          />
          <Input
            label="State"
            placeholder="State"
            value={editForm.state}
            onChange={(e) =>
              setEditForm({ ...editForm, state: e.target.value })
            }
          />
          <Input
            label="Country"
            placeholder="Country"
            value={editForm.country}
            onChange={(e) =>
              setEditForm({ ...editForm, country: e.target.value })
            }
          />
          <Input
            label="Credit Limit"
            type="number"
            placeholder="0"
            value={editForm.credit_limit}
            onChange={(e) =>
              setEditForm({ ...editForm, credit_limit: e.target.value })
            }
          />
        </div>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Customer Details"
        size="lg"
        footer={
          <Button
            variant="outline"
            onClick={() => {
              setShowDetailModal(false);
              if (selectedCustomer) handleEdit(selectedCustomer);
            }}
          >
            Edit Customer
          </Button>
        }
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xl font-bold text-white">
                {getInitials(selectedCustomer.name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {selectedCustomer.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedCustomer.customer_code}
                </p>
              </div>
              <Badge
                className={cn(
                  getStatusColor(
                    selectedCustomer.is_active ? "active" : "inactive"
                  ),
                  "ml-auto"
                )}
              >
                {selectedCustomer.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.email ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.phone ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.address ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">City</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.city ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">State</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.state ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Country</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.country ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tax ID</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.tax_id ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Credit Limit</p>
                <p className="text-sm font-medium">
                  {formatCurrency(selectedCustomer.credit_limit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Outstanding Balance</p>
                <p className="text-sm font-medium text-rose-600">
                  {formatCurrency(selectedCustomer.outstanding_balance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Loyalty Points</p>
                <p className="text-sm font-medium">
                  {selectedCustomer.loyalty_points.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Customer"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              loading={submitting}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Are you sure you want to delete this customer?
              </p>
              <p className="text-sm text-slate-500">
                {selectedCustomer?.name} ({selectedCustomer?.customer_code})
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            This action cannot be undone. All customer data will be permanently
            removed.
          </p>
        </div>
      </Modal>
    </motion.div>
  );
}
