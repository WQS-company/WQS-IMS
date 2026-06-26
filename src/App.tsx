import { useSettingsStore } from "@/stores/settings-store";
import { lazy, Suspense, useEffect } from "react";

import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/Skeleton";

const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const GetStarted = lazy(() => import("@/pages/auth/GetStarted"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Products = lazy(() => import("@/pages/inventory/Products"));
const ProductForm = lazy(() => import("@/pages/inventory/ProductForm"));
const Categories = lazy(() => import("@/pages/inventory/Categories"));
const StockLevels = lazy(() => import("@/pages/inventory/StockLevels"));
const StockMovements = lazy(() => import("@/pages/inventory/StockMovements"));
const Warehouses = lazy(() => import("@/pages/warehouse/Warehouses"));
const PurchaseOrders = lazy(() => import("@/pages/purchases/PurchaseOrders"));
const PurchaseOrderForm = lazy(() => import("@/pages/purchases/PurchaseOrderForm"));
const SalesOrders = lazy(() => import("@/pages/sales/SalesOrders"));
const Customers = lazy(() => import("@/pages/customers/Customers"));
const Suppliers = lazy(() => import("@/pages/suppliers/Suppliers"));
const Settings = lazy(() => import("@/pages/Settings"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-4 p-8">
        <div className="flex justify-center">
          <Skeleton variant="circle" className="h-16 w-16" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

import { useAuthStore } from "@/stores/auth-store";
import { invoke } from "@/lib/tauri";

function App() {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const { token, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    loadSettings();
    const splash = document.getElementById("splash-screen");
    if (splash) {
      const timer = setTimeout(() => splash.classList.add("hide"), 400);
      const remove = setTimeout(() => splash.remove(), 1100);
      return () => { clearTimeout(timer); clearTimeout(remove); };
    }
  }, [loadSettings]);

  useEffect(() => {
    async function initUser() {
      if (token && !user) {
        try {
          const userProfile = await invoke<any>("get_current_user", { token });
          setUser(userProfile);
        } catch (e) {
          console.error("Failed to fetch current user:", e);
          logout();
        }
      }
    }
    initUser();
  }, [token, user, setUser, logout]);


  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/get-started" element={<GetStarted />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />

            {/* Inventory */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/:id/edit" element={<ProductForm />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/stock-levels" element={<StockLevels />} />
            <Route path="/stock-movements" element={<StockMovements />} />

            {/* Warehouse */}
            <Route path="/warehouses" element={<Warehouses />} />

            {/* Purchasing */}
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/new" element={<PurchaseOrderForm />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderForm />} />

            {/* Sales */}
            <Route path="/sales-orders" element={<SalesOrders />} />

            {/* People */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />} />

            {/* Legal */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
