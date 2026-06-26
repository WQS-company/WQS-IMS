import { useState } from "react";
import { motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Save,
  Send,
  X,
  Plus,
  Trash2,
  Search,
  FileText,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency } from "@/lib/utils";

interface POItemForm {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
}

interface POFormData {
  po_number: string;
  supplier_id: string;
  branch_id: string;
  warehouse_id: string;
  order_date: string;
  expected_date: string;
  notes: string;
  items: POItemForm[];
  shipping_cost: number;
}

const mockProducts = [
  { id: "1", name: "Wireless Mouse", sku: "WM-001", price: 899 },
  { id: "2", name: "USB-C Hub", sku: "UH-002", price: 1599 },
  { id: "3", name: "Mechanical Keyboard", sku: "MK-003", price: 2499 },
  { id: "4", name: "Monitor Stand", sku: "MS-004", price: 1299 },
  { id: "5", name: "Desk Lamp", sku: "DL-005", price: 749 },
  { id: "6", name: "Webcam HD", sku: "WC-006", price: 1999 },
  { id: "7", name: "USB-C Cable", sku: "UC-007", price: 299 },
  { id: "8", name: "Headphones", sku: "HP-008", price: 1299 },
];

const supplierOptions = [
  { value: "1", label: "Tech Supplies Co." },
  { value: "2", label: "Global Traders" },
  { value: "3", label: "Digital World Imports" },
  { value: "4", label: "Smart Devices Ltd." },
];

const branchOptions = [
  { value: "1", label: "Main Branch - Mumbai" },
  { value: "2", label: "City Center - Delhi" },
  { value: "3", label: "Tech Park - Bangalore" },
];

const warehouseOptions = [
  { value: "1", label: "Main Warehouse" },
  { value: "2", label: "Secondary Warehouse" },
  { value: "3", label: "Cold Storage" },
];

export default function PurchaseOrderForm() {
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  const [showProductDropdown, setShowProductDropdown] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<POFormData>({
    defaultValues: {
      po_number: `PO-${Date.now().toString().slice(-6)}`,
      order_date: new Date().toISOString().split("T")[0],
      expected_date: "",
      notes: "",
      shipping_cost: 0,
      items: [
        { product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 18, discount: 0, total: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedShipping = watch("shipping_cost");

  const calculateItemTotal = (index: number) => {
    const item = watchedItems[index];
    if (!item) return 0;
    const subtotal = item.quantity * item.unit_price;
    const tax = subtotal * (item.tax_rate / 100);
    const discount = item.discount;
    return subtotal + tax - discount;
  };

  const subtotal = watchedItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalTax = watchedItems.reduce((sum, item) => sum + item.quantity * item.unit_price * (item.tax_rate / 100), 0);
  const totalDiscount = watchedItems.reduce((sum, item) => sum + item.discount, 0);
  const total = subtotal + totalTax - totalDiscount + (watchedShipping || 0);

  const addItem = () => {
    append({ product_id: "", product_name: "", quantity: 1, unit_price: 0, tax_rate: 18, discount: 0, total: 0 });
  };

  const selectProduct = (index: number, product: typeof mockProducts[0]) => {
    setValue(`items.${index}.product_id`, product.id);
    setValue(`items.${index}.product_name`, product.name);
    setValue(`items.${index}.unit_price`, product.price);
    setProductSearch((prev) => ({ ...prev, [index]: product.name }));
    setShowProductDropdown(null);
  };

  const getFilteredProducts = (index: number) => {
    const search = productSearch[index]?.toLowerCase() || "";
    return mockProducts.filter(
      (p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
    );
  };

  const onSubmit = (data: POFormData) => {
    console.log("Purchase Order:", { ...data, subtotal, totalTax, totalDiscount, total });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Create Purchase Order
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Fill in the details to create a new purchase order
          </p>
        </div>
        <Button variant="ghost" onClick={() => window.history.back()}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input
                label="PO Number"
                {...register("po_number", { required: "PO number is required" })}
                error={errors.po_number?.message}
                icon={<FileText className="h-4 w-4" />}
              />
              <Select
                label="Supplier"
                options={supplierOptions}
                placeholder="Select supplier"
                {...register("supplier_id", { required: "Supplier is required" })}
                error={errors.supplier_id?.message}
              />
              <Select
                label="Branch"
                options={branchOptions}
                placeholder="Select branch"
                {...register("branch_id", { required: "Branch is required" })}
                error={errors.branch_id?.message}
              />
              <Select
                label="Warehouse"
                options={warehouseOptions}
                placeholder="Select warehouse"
                {...register("warehouse_id", { required: "Warehouse is required" })}
                error={errors.warehouse_id?.message}
              />
              <Input
                label="Order Date"
                type="date"
                {...register("order_date", { required: "Order date is required" })}
                error={errors.order_date?.message}
              />
              <Input
                label="Expected Date"
                type="date"
                {...register("expected_date")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
              <Button type="button" size="sm" onClick={addItem} icon={<Plus className="h-4 w-4" />}>
                Add Item
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
                      Qty
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Unit Price
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Tax %
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Discount
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                    <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="py-3">
                        <div className="relative">
                          <Input
                            placeholder="Search product..."
                            value={productSearch[index] || ""}
                            onChange={(e) => {
                              setProductSearch((prev) => ({ ...prev, [index]: e.target.value }));
                              setShowProductDropdown(index);
                            }}
                            onFocus={() => setShowProductDropdown(index)}
                            icon={<Search className="h-4 w-4" />}
                          />
                          {showProductDropdown === index && (
                            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                              {getFilteredProducts(index).map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                                  onClick={() => selectProduct(index, product)}
                                >
                                  <span className="font-medium">{product.name}</span>
                                  <span className="ml-2 text-slate-500">{product.sku}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          min="1"
                          className="w-20 text-right"
                          {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                        />
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          step="0.01"
                          className="w-28 text-right"
                          {...register(`items.${index}.unit_price`, { required: true, min: 0 })}
                        />
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          step="0.01"
                          className="w-20 text-right"
                          {...register(`items.${index}.tax_rate`)}
                        />
                      </td>
                      <td className="py-3">
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24 text-right"
                          {...register(`items.${index}.discount`)}
                        />
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(calculateItemTotal(index))}
                      </td>
                      <td className="py-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-rose-500 hover:text-rose-700"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional notes or instructions..."
                rows={4}
                {...register("notes")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium">{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-rose-500">-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Shipping</span>
                <Input
                  type="number"
                  step="0.01"
                  className="w-24 text-right"
                  {...register("shipping_cost")}
                />
              </div>
              <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Total
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" icon={<Save className="h-4 w-4" />}>
            Save Draft
          </Button>
          <Button type="submit" icon={<Send className="h-4 w-4" />}>
            Submit for Approval
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
