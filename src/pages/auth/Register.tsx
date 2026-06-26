import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@/lib/tauri";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Package,
  BarChart3,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const STEP_FIELDS: (keyof FormState)[][] = [
  ["firstName", "lastName"],
  ["email", "username", "phone"],
  ["password", "confirmPassword"],
];

const STEP_LABELS = ["Personal Info", "Account Details", "Security"];
const STEP_ICONS = [User, Mail, Lock];

const features = [
  {
    icon: Package,
    title: "Inventory Control",
    desc: "Track stock across warehouses in real time",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    desc: "Dashboards and reports for data-driven decisions",
  },
  {
    icon: ClipboardCheck,
    title: "Order Management",
    desc: "Streamlined purchase orders and sales workflows",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Granular permissions for every team member",
  },
];

export default function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const passwordChecks = useMemo(() => {
    const p = form.password;
    return [
      { label: "At least 8 characters", met: p.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(p) },
      { label: "One lowercase letter", met: /[a-z]/.test(p) },
      { label: "One number", met: /[0-9]/.test(p) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(p) },
    ];
  }, [form.password]);

  const passwordStrength = useMemo(
    () => passwordChecks.filter((c) => c.met).length,
    [passwordChecks]
  );

  const strengthColor = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-lime-500",
    "bg-emerald-500",
  ];
  const strengthLabel = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  const validate = useCallback(
    (fields: (keyof FormState)[]): FormErrors => {
      const e: FormErrors = {};
      for (const f of fields) {
        switch (f) {
          case "firstName":
            if (!form.firstName.trim()) e.firstName = "First name is required";
            break;
          case "lastName":
            if (!form.lastName.trim()) e.lastName = "Last name is required";
            break;
          case "email":
            if (!form.email.trim()) e.email = "Email is required";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
              e.email = "Enter a valid email";
            break;
          case "username":
            if (!form.username.trim()) e.username = "Username is required";
            else if (form.username.length < 3)
              e.username = "At least 3 characters";
            else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
              e.username = "Letters, numbers, and underscores only";
            break;
          case "phone":
            if (form.phone && !/^[0-9+\-\s()]{7,15}$/.test(form.phone))
              e.phone = "Enter a valid phone number";
            break;
          case "password":
            if (!form.password) e.password = "Password is required";
            else if (form.password.length < 8) e.password = "At least 8 characters";
            break;
          case "confirmPassword":
            if (!form.confirmPassword)
              e.confirmPassword = "Please confirm your password";
            else if (form.password !== form.confirmPassword)
              e.confirmPassword = "Passwords do not match";
            break;
        }
      }
      return e;
    },
    [form]
  );

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const e = validate([field]);
    setErrors((prev) => ({ ...prev, ...e }));
  };

  const nextStep = () => {
    const stepErrors = validate(STEP_FIELDS[step]);
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    setTouched((prev) => {
      const next = { ...prev };
      STEP_FIELDS[step].forEach((f) => (next[f] = true));
      return next;
    });
    if (Object.keys(stepErrors).length === 0 && step < 2) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    const allErrors = validate([
      "firstName",
      "lastName",
      "email",
      "username",
      "password",
      "confirmPassword",
    ]);
    setErrors(allErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });
    if (Object.keys(allErrors).length > 0) return;

    setLoading(true);
    setServerError("");

    try {
      await invoke("register", {
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      });

      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setServerError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: keyof FormState) =>
    touched[field] && errors[field] ? errors[field] : undefined;

  const inputBase =
    "h-10 w-full rounded-lg border bg-white/[0.06] px-3 text-sm text-white placeholder-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0";

  const inputNormal = `${inputBase} border-white/[0.12] focus:border-indigo-400 focus:ring-indigo-400/40`;
  const inputError = `${inputBase} border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/40`;

  const fieldInput = (field: keyof FormState, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className={fieldError(field) ? inputError : inputNormal}
      onChange={(e) => handleChange(field, e.target.value)}
      onBlur={() => handleBlur(field)}
    />
  );

  return (
    <div className="relative flex min-h-screen w-screen overflow-hidden bg-[#06060f]">

      {/* ============================================================
          FULL-SCREEN ILLUSTRATION BACKGROUND
      ============================================================ */}

      {/* Layer 0 — Illustration covering the full viewport */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/src/assets/get_started_illustration.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Layer 1 — Soft dark tint */}
      <div className="pointer-events-none absolute inset-0 bg-[#06060f]/55" />

      {/* Layer 2 — Left gradient mask */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06060f]/80 via-[#06060f]/30 to-transparent lg:w-[45%]" />

      {/* Layer 3 — Right gradient mask */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#06060f]/75 via-[#06060f]/30 to-transparent lg:left-[55%] lg:w-[45%]" />

      {/* Layer 4 — Top vignette */}
      <div className="pointer-events-none absolute inset-0 h-[25%] bg-gradient-to-b from-[#06060f]/60 to-transparent" />

      {/* Layer 5 — Bottom vignette */}
      <div className="pointer-events-none absolute inset-0 top-auto h-[25%] bg-gradient-to-t from-[#06060f]/70 to-transparent" />

      {/* Layer 6 — Ambient blurs */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[120px]" />

      {/* Layer 7 — Dot grid texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Left panel — branding */}
      <div className="relative z-10 hidden w-1/2 items-center justify-center overflow-hidden lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10 max-w-md px-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-10">
              <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-6xl font-extrabold text-transparent">
                WQS
              </h1>
              <p className="mt-1 text-sm font-semibold tracking-[0.3em] text-indigo-300">
                INVENTORY MANAGEMENT SYSTEM
              </p>
            </div>

            <div className="space-y-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <f.icon className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{f.title}</p>
                    <p className="text-sm text-indigo-300/70">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="mb-6 text-center lg:hidden">
            <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-4xl font-extrabold text-transparent">
              WQS
            </h1>
            <p className="mt-1 text-xs font-semibold tracking-[0.25em] text-indigo-300">
              IMS
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            {/* Header */}
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                Create Account
              </h2>
              <p className="mt-0.5 text-xs text-white/40">
                Set up your account in a few steps
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
              >
                {serverError}
              </motion.div>
            )}

            {/* Success message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              >
                Account created successfully! Redirecting to login...
              </motion.div>
            )}


            {/* Step indicator */}
            <div className="mb-6">
              <div className="flex items-center gap-0">
                {STEP_LABELS.map((label, i) => {
                  const Icon = STEP_ICONS[i];
                  const isActive = i === step;
                  const isDone = i < step;
                  return (
                    <div key={label} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isDone
                              ? "border-emerald-400 bg-emerald-400/20 shadow-[0_0_12px_rgba(52,211,153,0.2)]"
                              : isActive
                                ? "border-indigo-400 bg-indigo-400/20 shadow-[0_0_12px_rgba(129,140,248,0.25)]"
                                : "border-white/15 bg-white/5"
                          }`}
                        >
                          {isDone ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Icon
                              className={`h-3.5 w-3.5 ${isActive ? "text-indigo-300" : "text-white/30"}`}
                            />
                          )}
                        </div>
                        <span
                          className={`mt-1 text-[10px] font-medium tracking-wide ${isActive ? "text-indigo-300" : isDone ? "text-emerald-400" : "text-white/30"}`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          className={`mx-1.5 h-px flex-1 transition-colors duration-300 ${i < step ? "bg-emerald-400/40" : "bg-white/10"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1 — Personal Info */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                      Your Name
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-white/50">
                          First Name <span className="text-rose-400">*</span>
                        </label>
                        {fieldInput("firstName", {
                          type: "text",
                          value: form.firstName,
                          placeholder: "John",
                        })}
                        {fieldError("firstName") && (
                          <p className="mt-1 text-[11px] text-rose-300">
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-white/50">
                          Last Name <span className="text-rose-400">*</span>
                        </label>
                        {fieldInput("lastName", {
                          type: "text",
                          value: form.lastName,
                          placeholder: "Doe",
                        })}
                        {fieldError("lastName") && (
                          <p className="mt-1 text-[11px] text-rose-300">
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 — Account Details */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                      Account Information
                    </p>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/50">
                        Email <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                        {fieldInput("email", {
                          type: "email",
                          value: form.email,
                          placeholder: "you@example.com",
                          className: `${fieldError("email") ? inputError : inputNormal} pl-9`,
                        })}
                      </div>
                      {fieldError("email") && (
                        <p className="mt-1 text-[11px] text-rose-300">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className="w-[55%]">
                        <label className="mb-1 block text-xs font-medium text-white/50">
                          Username <span className="text-rose-400">*</span>
                        </label>
                        {fieldInput("username", {
                          type: "text",
                          value: form.username,
                          placeholder: "johndoe",
                        })}
                        {fieldError("username") && (
                          <p className="mt-1 text-[11px] text-rose-300">
                            {errors.username}
                          </p>
                        )}
                      </div>
                      <div className="w-[45%]">
                        <label className="mb-1 block text-xs font-medium text-white/50">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                          {fieldInput("phone", {
                            type: "tel",
                            value: form.phone,
                            placeholder: "9876543210",
                            className: `${fieldError("phone") ? inputError : inputNormal} pl-9`,
                          })}
                        </div>
                        {fieldError("phone") && (
                          <p className="mt-1 text-[11px] text-rose-300">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Security */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-white/30">
                      Secure Your Account
                    </p>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/50">
                        Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) =>
                            handleChange("password", e.target.value)
                          }
                          onBlur={() => handleBlur("password")}
                          placeholder="Create a password"
                          className={`${fieldError("password") ? inputError : inputNormal} pl-9 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60"
                        >
                          {showPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {fieldError("password") && (
                        <p className="mt-1 text-[11px] text-rose-300">
                          {errors.password}
                        </p>
                      )}

                      {form.password && (
                        <div className="mt-2.5">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                  i < passwordStrength
                                    ? strengthColor[passwordStrength - 1]
                                    : "bg-white/10"
                                }`}
                              />
                            ))}
                          </div>
                          <p
                            className={`mt-1 text-[11px] ${passwordStrength >= 4 ? "text-emerald-300" : passwordStrength >= 2 ? "text-amber-300" : "text-rose-300"}`}
                          >
                            {passwordStrength > 0
                              ? strengthLabel[passwordStrength - 1]
                              : "Enter a password"}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                            {passwordChecks.map((c) => (
                              <div
                                key={c.label}
                                className="flex items-center gap-1.5"
                              >
                                <div
                                  className={`flex h-3 w-3 items-center justify-center rounded-full transition-colors ${
                                    c.met
                                      ? "bg-emerald-400/20 text-emerald-400"
                                      : "bg-white/5 text-white/20"
                                  }`}
                                >
                                  <Check className="h-2 w-2" />
                                </div>
                                <span
                                  className={`text-[10px] ${c.met ? "text-emerald-300/80" : "text-white/30"}`}
                                >
                                  {c.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/50">
                        Confirm Password <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) =>
                            handleChange("confirmPassword", e.target.value)
                          }
                          onBlur={() => handleBlur("confirmPassword")}
                          placeholder="Confirm your password"
                          className={`${fieldError("confirmPassword") ? inputError : inputNormal} pl-9 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      {fieldError("confirmPassword") && (
                        <p className="mt-1 text-[11px] text-rose-300">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms — only on final step */}
              {step === 2 && (
                <label className="mt-5 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/15 bg-white/[0.06] text-indigo-500 focus:ring-indigo-400/40"
                  />
                  <span className="text-[11px] leading-relaxed text-white/40">
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="font-medium text-white/70 hover:text-white">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" className="font-medium text-white/70 hover:text-white">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              )}

              {/* Navigation */}
              <div className="mt-5 flex gap-2.5">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1 border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                    onClick={prevStep}
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back
                  </Button>
                )}

                {step < 2 ? (
                  <Button
                    type="button"
                    className="h-10 flex-1"
                    onClick={nextStep}
                  >
                    Continue
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-10 flex-1"
                    loading={loading}
                    disabled={!agreeTerms || loading}
                  >
                    {loading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        Create Account
                        <Check className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* ── Social signup ── */}
            <div className="mt-5 space-y-3">
              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/[0.12] to-transparent" />
              </div>

              {/* Side-by-side social buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Google */}
                <button
                  type="button"
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
                    <span className="text-[9px] font-normal text-white/40">Sign up with</span>
                    <span className="text-sm font-semibold text-white/80 group-hover:text-white">Google</span>
                  </span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  className="group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 transition-all duration-200 hover:border-[#1877F2]/30 hover:bg-[#1877F2]/[0.08] hover:shadow-[0_0_24px_-4px_rgba(24,119,242,0.20)] active:scale-[0.985]"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 ring-1 ring-inset ring-[#1877F2]/20 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1877F2] shadow-sm shadow-[#1877F2]/30">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </span>
                  <span className="flex flex-col items-start leading-none">
                    <span className="text-[9px] font-normal text-white/40">Sign up with</span>
                    <span className="text-sm font-semibold text-white/80 group-hover:text-white">Facebook</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-white/[0.06] pt-4 text-center">
              <p className="text-[11px] text-white/35">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-white/60 transition-colors hover:text-white"
                >
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
