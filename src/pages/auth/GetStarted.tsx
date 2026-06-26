import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn, ShieldCheck, Zap, BarChart3, Warehouse, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#06060f]">
      {/* ============================================================
          FULL-SCREEN ILLUSTRATION BACKGROUND
      ============================================================ */}

      {/* Layer 0 — The illustration covering the entire viewport */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/src/assets/get_started_illustration.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Layer 1 — Very subtle dark tint */}
      <div className="pointer-events-none absolute inset-0 bg-[#06060f]/20" />

      {/* Layer 2 — Gradient mask: darken left edge only for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06060f]/60 via-[#06060f]/10 to-transparent lg:w-[42%]" />

      {/* Layer 3 — Right side: removed so the person illustration is fully visible */}

      {/* Layer 4 — Top vignette (lighter) */}
      <div className="pointer-events-none absolute inset-0 h-[20%] bg-gradient-to-b from-[#06060f]/40 to-transparent" />

      {/* Layer 5 — Bottom vignette (lighter) */}
      <div className="pointer-events-none absolute inset-0 top-auto h-[20%] bg-gradient-to-t from-[#06060f]/50 to-transparent" />

      {/* Layer 6 — Radial centre glow */}
      <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-indigo-500/[0.05] to-transparent" />

      {/* Layer 7 — Ambient blurs */}
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[120px]" />

      {/* Layer 8 — Dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ============================================================
          HEADER
      ============================================================ */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <span className="text-lg font-black text-white">W</span>
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-[#06060f] bg-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wider text-white">WQS IMS</span>
            <span className="text-[9px] font-medium tracking-widest text-indigo-400/50">INVENTORY MANAGEMENT</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="gap-2 text-indigo-200/80 hover:text-white hover:bg-white/5"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </motion.div>
      </header>

      {/* ============================================================
          MAIN CONTENT — Left text, Right CTA card
      ============================================================ */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pt-16 pb-8 md:px-12 lg:flex-row lg:gap-14 lg:px-20">
        {/* Left: Text */}
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-xl space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-indigo-300 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
              </span>
              Next-Gen Inventory Control System
            </div>

            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              <span className="text-white">Master Your</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
                Warehouse Operations
              </span>
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-indigo-200/50 sm:text-base">
              Streamline stock levels, track purchase and sales orders, manage
              multiple branches, and gain deep insights — all in one secure
              desktop app.
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 pt-1 lg:justify-start">
              {[
                { icon: Warehouse, label: "Multi-Warehouse Inventory" },
                { icon: BarChart3, label: "Live Sales Analytics" },
                { icon: ShieldCheck, label: "Role-Based Operations" },
                { icon: Zap, label: "Tauri-Powered Speed" },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                  className="flex items-center gap-2"
                >
                  <f.icon className="h-3.5 w-3.5 text-indigo-400/60" />
                  <span className="text-xs font-medium text-indigo-200/45">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: CTA Card */}
        <div className="relative mt-10 flex flex-1 items-center justify-center lg:mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-sm"
          >
            {/* Glassmorphism card — transparent so illustration shows through */}
            <div className="rounded-2xl border border-white/[0.15] bg-white/[0.06] p-6 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:p-8" style={{ boxShadow: "0 0 40px rgba(99,102,241,0.06), 0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <Package className="h-7 w-7 text-indigo-400" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white sm:text-2xl">
                    Get Started Today
                  </h2>
                  <p className="text-sm text-indigo-200/45">
                    Choose an action below to access your inventory control center
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => navigate("/login")}
                      className="group h-12 w-full bg-gradient-to-r from-indigo-600 to-purple-600 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/30"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/register")}
                      className="h-12 w-full border-white/15 bg-white/[0.04] font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08]"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register
                    </Button>
                  </motion.div>
                </div>

                <p className="pt-2 text-[11px] text-indigo-300/25">
                  By continuing, you agree to our{" "}
                  <a href="/terms" target="_blank" className="underline hover:text-white/50">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" className="underline hover:text-white/50">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <footer className="absolute inset-x-0 bottom-0 z-20 py-3 text-center">
        <p className="text-[11px] text-indigo-300/25">
          &copy; {new Date().getFullYear()} WQS Inventory Management System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}


