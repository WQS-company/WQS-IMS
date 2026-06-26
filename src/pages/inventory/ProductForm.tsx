import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Camera,
  X,
  Package,
  Warehouse,
  Image,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { invoke } from "@/lib/tauri";
import { getCurrencySymbol } from "@/lib/utils";
import type { Category, Brand, Unit, Product } from "@/types";

function PriceIcon({ className }: { className?: string }) {
  const symbol = getCurrencySymbol();
  return (
    <span className={`${className} font-bold text-base leading-none select-none flex items-center justify-center`}>
      {symbol}
    </span>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ProductImage {
  file: File;
  preview: string;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currencySymbol = getCurrencySymbol();
  const isEditing = Boolean(id);

  const [step, setStep] = useState(0);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category_id: "",
    brand_id: "",
    unit_id: "",
    description: "",
    cost_price: "",
    selling_price: "",
    min_stock: "10",
    max_stock: "100",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [cats, brds, unitsData] = await Promise.all([
          invoke<Category[]>("get_categories"),
          invoke<Brand[]>("get_brands"),
          invoke<Unit[]>("get_units"),
        ]);
        setCategories(cats);
        setBrands(brds);
        setUnits(unitsData);
      } catch (e) {
        console.error("Failed to load options:", e);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      try {
        const p = await invoke<Product>("get_product_by_id", { id });
        setForm({
          name: p.name ?? "",
          sku: p.sku ?? "",
          barcode: p.barcode ?? "",
          category_id: p.category_id ?? "",
          brand_id: p.brand_id ?? "",
          unit_id: p.unit_id ?? "",
          description: p.description ?? "",
          cost_price: p.cost_price?.toString() ?? "",
          selling_price: p.selling_price?.toString() ?? "",
          min_stock: p.min_stock?.toString() ?? "10",
          max_stock: p.max_stock?.toString() ?? "100",
        });
        if (p.image_url) {
          setImages([{ file: new File([], ""), preview: p.image_url }]);
        }
      } catch (e) {
        console.error("Failed to load product:", e);
        alert("Product not found");
        navigate("/products");
      }
    };
    loadProduct();
  }, [id, navigate]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: ProductImage[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file.`);
        continue;
      }
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const newImages: ProductImage[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) continue;
      if (!file.type.startsWith("image/")) continue;
      newImages.push({ file, preview: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const profit = form.cost_price && form.selling_price
    ? (Number(form.selling_price) - Number(form.cost_price)).toFixed(2)
    : "0.00";

  const margin = form.cost_price && form.selling_price && Number(form.selling_price) > 0
    ? (((Number(form.selling_price) - Number(form.cost_price)) / Number(form.selling_price)) * 100).toFixed(1)
    : "0";

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "Please enter a product name";
      if (!form.category_id) e.category_id = "Please choose a category";
    }
    if (s === 1) {
      if (!form.cost_price) e.cost_price = "Please enter how much you pay";
      if (!form.selling_price) e.selling_price = "Please enter your selling price";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) return;

    const sku = form.sku.trim() || `SKU-${Date.now()}`;

    let imageUrl: string | null = null;
    if (images.length > 0 && images[0].file.size > 0) {
      imageUrl = await fileToBase64(images[0].file);
    } else if (images.length > 0 && images[0].preview) {
      imageUrl = images[0].preview;
    }

    try {
      setSaving(true);

      if (isEditing && id) {
        await invoke("update_product", {
          id,
          sku: sku,
          name: form.name.trim(),
          description: form.description.trim() || null,
          category_id: form.category_id || null,
          brand_id: form.brand_id || null,
          unit_id: form.unit_id || null,
          cost_price: Number(form.cost_price),
          selling_price: Number(form.selling_price),
          min_stock: Number(form.min_stock),
          max_stock: Number(form.max_stock),
          image_url: imageUrl,
        });
      } else {
        await invoke("create_product", {
          request: {
            sku: sku,
            name: form.name.trim(),
            description: form.description.trim() || null,
            category_id: form.category_id || null,
            brand_id: form.brand_id || null,
            unit_id: form.unit_id || null,
            cost_price: Number(form.cost_price),
            selling_price: Number(form.selling_price),
            min_stock: Number(form.min_stock),
            max_stock: Number(form.max_stock),
            barcode: form.barcode.trim() || null,
            image_url: imageUrl,
          },
        });
      }

      navigate("/products");
    } catch (e) {
      console.error("Failed to save product:", e);
      alert("Failed to save product: " + e);
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const brandOptions = brands.map((b) => ({ value: b.id, label: b.name }));
  const unitOptions = units.map((u) => ({ value: u.id, label: u.name }));

  const STEP_LABELS = ["Product Info", "Price", "Stock", "Photo"];
  const STEP_ICONS = [Package, PriceIcon, Warehouse, Camera];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6 p-6 pb-24"
    >
      <motion.div variants={fadeIn} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Fill in the details step by step
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const Icon = STEP_ICONS[i];
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isDone
                      ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                      : isActive
                        ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`mt-1 text-xs font-medium ${isActive ? "text-indigo-600" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
              {i < 3 && (
                <div className={`mx-2 h-0.5 flex-1 ${i < step ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </motion.div>

      {step === 0 && (
        <motion.div variants={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-500" />
                What is this product?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Product Name *"
                placeholder="e.g. Wireless Mouse"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Product Code (SKU)"
                  placeholder="Auto-generated if empty"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                />
                <Input
                  label="Barcode Number"
                  placeholder="Scan or type barcode"
                  value={form.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select
                  label="Category *"
                  required
                  options={categoryOptions}
                  placeholder="Choose category"
                  value={form.category_id}
                  onChange={(e) => handleChange("category_id", e.target.value)}
                  error={errors.category_id}
                />
                <Select
                  label="Brand"
                  options={brandOptions}
                  placeholder="Choose brand"
                  value={form.brand_id}
                  onChange={(e) => handleChange("brand_id", e.target.value)}
                />
                <Select
                  label="Unit"
                  options={unitOptions}
                  placeholder="Choose unit"
                  value={form.unit_id}
                  onChange={(e) => handleChange("unit_id", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  About this product
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Write a short note about this product..."
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 1 && (
        <motion.div variants={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PriceIcon className="h-5 w-5 text-emerald-500" />
                How much does it cost?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Input
                    label="Your Purchase Price *"
                    type="number"
                    placeholder="How much you pay"
                    value={form.cost_price}
                    onChange={(e) => handleChange("cost_price", e.target.value)}
                    error={errors.cost_price}
                    icon={
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {currencySymbol}
                      </span>
                    }
                  />
                  <p className="mt-1 text-xs text-slate-500">The price you pay to buy this product</p>
                </div>
                <div>
                  <Input
                    label="Your Selling Price *"
                    type="number"
                    placeholder="How much you sell for"
                    value={form.selling_price}
                    onChange={(e) => handleChange("selling_price", e.target.value)}
                    error={errors.selling_price}
                    icon={
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {currencySymbol}
                      </span>
                    }
                  />
                  <p className="mt-1 text-xs text-slate-500">The price customers pay</p>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Profit Summary</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-emerald-600">Profit per item</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{currencySymbol}{profit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">Profit margin</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{margin}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">If you sell 10 items</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{currencySymbol}{(Number(profit) * 10).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div variants={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-amber-500" />
                How much stock do you have?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Input
                    label="Minimum Stock"
                    type="number"
                    value={form.min_stock}
                    onChange={(e) => handleChange("min_stock", e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-500">Alert when stock goes below this</p>
                </div>
                <div>
                  <Input
                    label="Maximum Stock"
                    type="number"
                    value={form.max_stock}
                    onChange={(e) => handleChange("max_stock", e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-500">Maximum you want to keep</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Low Stock Alert</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      When stock falls below {form.min_stock} items, you will get a warning notification
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div variants={fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-violet-500" />
                Add a Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                A photo helps you and your staff identify the product quickly.
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-600 dark:hover:border-indigo-500"
              >
                <Image className="mx-auto h-14 w-14 text-slate-300" />
                <p className="mt-3 text-base font-medium text-slate-700 dark:text-slate-300">
                  Tap here to choose a photo
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  or drag and drop a photo here
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG, WEBP — max 5 MB each
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Choose Photo
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((img, i) => (
                    <div key={i} className="group relative">
                      <img
                        src={img.preview}
                        alt={`Product ${i + 1}`}
                        className="aspect-square rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-2 top-2 rounded-full bg-rose-500 p-1.5 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 rounded bg-indigo-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          Main Photo
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {images.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                  <Camera className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No photos added yet</p>
                  <p className="text-xs text-slate-400">Click the button above to add a photo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={fadeIn} className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Back
        </Button>
        <div className="flex gap-3">
          {step < 3 ? (
            <Button type="button" size="lg" onClick={nextStep}>
              Next Step →
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={handleSubmit} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Product"}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
