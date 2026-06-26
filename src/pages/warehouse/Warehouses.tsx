import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Warehouse,
  MapPin,
  BarChart3,
  Edit,
  Trash2,
  Search,
  Eye,
  Package,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { invoke } from "@/lib/tauri";
import type { Warehouse as WarehouseType } from "@/types";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type WarehouseForm = {
  name: string;
  address: string;
  capacity: string;
  is_active: boolean;
};

const emptyForm: WarehouseForm = {
  name: "",
  address: "",
  capacity: "",
  is_active: true,
};

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<WarehouseForm>(emptyForm);
  const [createLoading, setCreateLoading] = useState(false);

  const [detailWarehouse, setDetailWarehouse] = useState<WarehouseType | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<WarehouseForm>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<WarehouseType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<WarehouseType[]>("get_warehouses");
      setWarehouses(data);
    } catch (e) {
      console.error("Failed to load warehouses:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.code && w.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.address && w.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toForm = (w: WarehouseType): WarehouseForm => ({
    name: w.name,
    address: w.address ?? "",
    capacity: w.capacity != null ? String(w.capacity) : "",
    is_active: w.is_active,
  });

  const warehouseToRequest = (f: WarehouseForm) => ({
    name: f.name.trim(),
    address: f.address.trim() || undefined,
    capacity: f.capacity ? Number(f.capacity) : undefined,
    is_active: f.is_active,
  });

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    try {
      setCreateLoading(true);
      await invoke("create_warehouse", {
        request: {
          name: createForm.name.trim(),
          address: createForm.address.trim() || undefined,
        },
      });
      setCreateOpen(false);
      setCreateForm(emptyForm);
      loadWarehouses();
    } catch (e) {
      console.error("Failed to create warehouse:", e);
      alert("Failed to create warehouse: " + e);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!detailWarehouse || !editForm.name.trim()) return;
    try {
      setEditLoading(true);
      await invoke("update_warehouse", {
        id: detailWarehouse.id,
        ...warehouseToRequest(editForm),
      });
      setEditMode(false);
      loadWarehouses();
      const updated = await invoke<WarehouseType[]>("get_warehouses");
      const fresh = updated.find((w) => w.id === detailWarehouse.id) ?? null;
      setDetailWarehouse(fresh);
    } catch (e) {
      console.error("Failed to update warehouse:", e);
      alert("Failed to update warehouse: " + e);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await invoke("update_warehouse", { id: deleteTarget.id, is_active: false });
      setDeleteTarget(null);
      if (detailWarehouse?.id === deleteTarget.id) {
        setDetailWarehouse(null);
      }
      loadWarehouses();
    } catch (e) {
      console.error("Failed to delete warehouse:", e);
      alert("Failed to delete warehouse: " + e);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
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
            Warehouses
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your storage locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadWarehouses}
            disabled={loading}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setCreateForm(emptyForm);
              setCreateOpen(true);
            }}
          >
            Add Warehouse
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="max-w-md">
        <Input
          placeholder="Search warehouses..."
          icon={<Search className="h-4 w-4" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </motion.div>

      {filteredWarehouses.length === 0 ? (
        <motion.div variants={fadeIn} className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <Warehouse className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            No warehouses found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {warehouses.length === 0
              ? "Add your first warehouse to get started"
              : "Try a different search term"}
          </p>
          {warehouses.length === 0 && (
            <Button
              className="mt-4"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setCreateForm(emptyForm);
                setCreateOpen(true);
              }}
            >
              Add Warehouse
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={fadeIn}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredWarehouses.map((warehouse) => (
            <motion.div key={warehouse.id} variants={fadeIn}>
              <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
                <div className="absolute right-0 top-0 h-20 w-20 bg-gradient-to-bl from-indigo-100 to-transparent dark:from-indigo-900/20" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5">
                        <Warehouse className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {warehouse.name}
                        </h3>
                        {warehouse.code && (
                          <p className="text-xs text-slate-500">{warehouse.code}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={warehouse.is_active ? "success" : "secondary"}>
                      {warehouse.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    {warehouse.address && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{warehouse.address}</span>
                      </div>
                    )}
                    {warehouse.branch && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <BarChart3 className="h-4 w-4 shrink-0" />
                        <span>{warehouse.branch.name}</span>
                      </div>
                    )}
                    {warehouse.capacity != null && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Package className="h-4 w-4 shrink-0" />
                        <span>Capacity: {warehouse.capacity.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      icon={<Eye className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setDetailWarehouse(warehouse);
                        setEditForm(toForm(warehouse));
                        setEditMode(false);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      icon={<Edit className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setDetailWarehouse(warehouse);
                        setEditForm(toForm(warehouse));
                        setEditMode(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20"
                      onClick={() => setDeleteTarget(warehouse)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div variants={fadeIn} className="text-sm text-slate-500">
        Showing {filteredWarehouses.length} of {warehouses.length} warehouses
      </motion.div>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Warehouse"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLoading || !createForm.name.trim()}>
              {createLoading ? "Creating..." : "Create Warehouse"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Warehouse Name"
            placeholder="Enter warehouse name"
            required
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Textarea
            label="Address"
            placeholder="Full address"
            value={createForm.address}
            onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
          />
          <Input
            label="Capacity"
            type="number"
            placeholder="Max capacity"
            value={createForm.capacity}
            onChange={(e) => setCreateForm((p) => ({ ...p, capacity: e.target.value }))}
          />
        </div>
      </Modal>

      {/* View / Edit Modal */}
      <Modal
        open={!!detailWarehouse}
        onClose={() => {
          setDetailWarehouse(null);
          setEditMode(false);
        }}
        title={editMode ? "Edit Warehouse" : detailWarehouse?.name}
        footer={
          <>
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={editLoading || !editForm.name.trim()}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => {
                    if (detailWarehouse) {
                      setDeleteTarget(detailWarehouse);
                    }
                  }}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400"
                >
                  Delete
                </Button>
                <Button
                  icon={<Edit className="h-4 w-4" />}
                  onClick={() => {
                    if (detailWarehouse) {
                      setEditForm(toForm(detailWarehouse));
                      setEditMode(true);
                    }
                  }}
                >
                  Edit
                </Button>
              </>
            )}
          </>
        }
      >
        {detailWarehouse && (
          <div className="space-y-4">
            {editMode ? (
              <>
                <Input
                  label="Warehouse Name"
                  placeholder="Enter warehouse name"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Textarea
                  label="Address"
                  placeholder="Full address"
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
                <Input
                  label="Capacity"
                  type="number"
                  placeholder="Max capacity"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm((p) => ({ ...p, capacity: e.target.value }))}
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm((p) => ({ ...p, is_active: !p.is_active }))}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      editForm.is_active ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform",
                        editForm.is_active ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <DetailRow label="Status">
                  <Badge variant={detailWarehouse.is_active ? "success" : "secondary"}>
                    {detailWarehouse.is_active ? "Active" : "Inactive"}
                  </Badge>
                </DetailRow>
                {detailWarehouse.code && (
                  <DetailRow label="Code">{detailWarehouse.code}</DetailRow>
                )}
                {detailWarehouse.address && (
                  <DetailRow label="Address">{detailWarehouse.address}</DetailRow>
                )}
                {detailWarehouse.capacity != null && (
                  <DetailRow label="Capacity">
                    {detailWarehouse.capacity.toLocaleString()}
                  </DetailRow>
                )}
                {detailWarehouse.branch && (
                  <DetailRow label="Branch">{detailWarehouse.branch.name}</DetailRow>
                )}
                <DetailRow label="Created">
                  {new Date(detailWarehouse.created_at).toLocaleDateString()}
                </DetailRow>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Warehouse?"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500">
          This will deactivate <strong>{deleteTarget?.name}</strong>. You can reactivate it later from the edit screen.
        </p>
      </Modal>
    </motion.div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{children}</span>
    </div>
  );
}
