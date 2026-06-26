import { useState } from "react";
import { motion } from "framer-motion";
import { invoke } from "@/lib/tauri";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Package,
  BarChart3,
  ClipboardCheck,
  Warehouse,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth-store";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await invoke<{
        token: string;
        user: Record<string, unknown>;
      }>("login", {
        username,
        password,
      });

      login(
        {
          id: String(result.user.id),
          username: result.user.username as string,
          email: result.user.email as string,
          first_name: (result.user.first_name as string) ?? "",
          last_name: (result.user.last_name as string) ?? "",
          phone: null,
          avatar: null,
          role_id: Number(result.user.role_id) || 0,
          branch_id: null,
          is_active: (result.user.is_active as boolean) ?? true,
          two_factor_enabled: false,
          last_login: (result.user.last_login as string) ?? null,
          created_at:
            (result.user.created_at as string) ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        result.token,
      );

      navigate("/dashboard");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#06060f]">
      {/* ============================================================
          FULL-SCREEN ILLUSTRATION BACKGROUND
          The image covers the entire viewport. Multiple gradient
          layers and blur masks hide every edge so the user can
          never see where the image starts or ends.
      ============================================================ */}

      {/* Layer 0 — The illustration itself, covering the full viewport */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/src/assets/get_started_illustration.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Layer 1 — Soft dark tint so illustration recedes behind content */}
      <div className="pointer-events-none absolute inset-0 bg-[#06060f]/45" />

      {/* Layer 2 — Gradient mask left edge (fades image into dark on left) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06060f]/70 via-[#06060f]/50 to-transparent lg:w-[45%]" />

      {/* Layer 3 — Gradient mask right edge */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#06060f]/70 via-[#06060f]/20 to-transparent lg:left-[55%] lg:w-[45%]" />

      {/* Layer 4 — Top vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#06060f]/60 via-transparent to-transparent h-[30%]" />

      {/* Layer 5 — Bottom vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06060f]/70 via-[#06060f]/15 to-transparent h-[40%] bottom-0 top-auto" />

      {/* Layer 6 — Radial glow centre (draws the eye to the illustration) */}
      <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-indigo-500/[0.04] to-transparent" />

      {/* Layer 7 — Floating ambient blurs (depth, no edges visible) */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/6 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/6 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-indigo-500/4 blur-[100px]" />

      {/* Layer 8 — Dot grid (subtle texture over everything) */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ============================================================
          LEFT PANEL — Branding + Features (visible on lg+)
      ============================================================ */}
      <div className="relative z-10 hidden w-1/2 flex-col justify-center px-12 xl:px-20 2xl:px-28 lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-lg space-y-10"
        >
          {/* Logo */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <span className="text-xl font-black text-white">W</span>
                <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#06060f] bg-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-wider text-white">
                  WQS IMS
                </h1>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-indigo-400/60">
                  INVENTORY MANAGEMENT SYSTEM
                </p>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
              Welcome back to
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
                your inventory
              </span>
            </h2>
            <p className="max-w-md text-base leading-relaxed text-indigo-200/50">
              Manage stock across warehouses, track orders, and monitor your
              business performance — all from one secure dashboard.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              {
                icon: Warehouse,
                label: "Multi-Warehouse Inventory",
              },
              {
                icon: BarChart3,
                label: "Live Sales Analytics",
              },
              {
                icon: Shield,
                label: "Role-Based Operations",
              },
              {
                icon: Zap,
                label: "Tauri-Powered Speed",
              },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <f.icon className="h-4 w-4 text-indigo-400/80" />
                </div>
                <span className="text-sm font-medium text-indigo-200/50">
                  {f.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ============================================================
          RIGHT PANEL — Login Card
      ============================================================ */}
      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-3 inline-flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <span className="text-lg font-black text-white">W</span>
              </div>
              <div className="text-left">
                <h1 className="text-lg font-extrabold tracking-wider text-white">
                  WQS IMS
                </h1>
                <p className="text-[9px] font-semibold tracking-[0.2em] text-indigo-400/50">
                  INVENTORY MANAGEMENT
                </p>
              </div>
            </div>
          </div>

          {/* Glassmorphism Card */}
          <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8" style={{ boxShadow: "0 0 40px rgba(99,102,241,0.06), 0 25px 50px -12px rgba(0,0,0,0.2)" }}>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-indigo-300/60">
                Sign in to your account
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
              >
                {error}
              </motion.div>
            )}


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-indigo-200/80">
                  Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/40" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="h-12 w-full rounded-xl border border-white/[0.12] bg-white/[0.06] pl-10 pr-4 text-white placeholder-indigo-300/40 transition-all duration-200 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-indigo-200/80">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-white/[0.12] bg-white/[0.06] pl-10 pr-12 text-white placeholder-indigo-300/40 transition-all duration-200 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300/40 transition-colors hover:text-white/70"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-400/40"
                  />
                  <span className="text-sm text-indigo-200/60">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-indigo-300/50 transition-colors hover:text-white/80"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="group h-12 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/30"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && (
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            </form>

            {/* ── Social login ── */}
            <div className="mt-6 space-y-3">
              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/[0.12] to-transparent" />
              </div>

              {/* Side-by-side buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => {}}
                  className="group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-[0_0_24px_-4px_rgba(255,255,255,0.08)] active:scale-[0.985]"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-1 ring-inset ring-white/10 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[9px] font-normal text-white/40">Sign in with</span>
                    <span className="text-sm font-semibold text-white/80 group-hover:text-white">Google</span>
                  </span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => {}}
                  className="group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 transition-all duration-200 hover:border-[#1877F2]/30 hover:bg-[#1877F2]/[0.08] hover:shadow-[0_0_24px_-4px_rgba(24,119,242,0.20)] active:scale-[0.985]"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-1 ring-inset ring-[#1877F2]/20 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1877F2] shadow-sm shadow-[#1877F2]/30">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[9px] font-normal text-white/40">Sign in with</span>
                    <span className="text-sm font-semibold text-white/80 group-hover:text-white">Facebook</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Register link */}
            <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">
              <p className="text-sm text-indigo-200/45">
                Don&apos;t have an account?{" "}
                <a
                  href="/register"
                  className="font-medium text-white/80 transition-colors hover:text-white"
                >
                  Request Access
                </a>
              </p>
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-[11px] text-indigo-300/25">
            &copy; {new Date().getFullYear()} WQS Inventory Management System
          </p>
        </motion.div>
      </div>
    </div>
  );
}
