import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Package,
  Bell,
  User,
  Save,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { invoke } from "@/lib/tauri";
import { getCurrencySymbol } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { AppSetting } from "@/types";

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <span className={`${className} flex items-center justify-center font-bold`}>
      {getCurrencySymbol()}
    </span>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type Tab = "company" | "financial" | "inventory" | "notifications" | "profile";

const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "financial", label: "Financial", icon: CurrencyIcon },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "My Profile", icon: User },
];

export default function Settings() {
  const { user, token, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("company");

  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileFirstName(user.first_name ?? "");
      setProfileLastName(user.last_name ?? "");
      setProfileAvatar(user.avatar ?? "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSavingProfile(true);
      setError(null);
      const updatedUser = await invoke<any>("update_user", {
        id: user.id,
        firstName: profileFirstName,
        lastName: profileLastName,
        avatar: profileAvatar,
      });
      setUser(updatedUser);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to update profile:", e);
      setError(String(e));
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as Tab;
    if (tabParam && ["company", "financial", "inventory", "notifications", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoke<AppSetting[]>("get_settings");
      const map: Record<string, string> = {};
      data.forEach((s) => {
        map[s.setting_key] = s.setting_value ?? "";
      });
      setSettings(map);
    } catch (e) {
      console.error("Failed to load settings:", e);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleImageUpload = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleChange(key, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const keys = Object.keys(settings);
      for (const key of keys) {
        await invoke("update_setting", { key, value: settings[key] });
      }
      await useSettingsStore.getState().loadSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save settings:", e);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      setError("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      setChangingPw(true);
      setError(null);
      await invoke("change_password", {
        token,
        currentPassword,
        newPassword,
      });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to change password:", e);
      setError(String(e));
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
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
      <motion.div variants={fadeIn} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Configure your inventory system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadSettings}
            disabled={loading}
            className="h-10 w-10"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleSave} disabled={saving} icon={<Save className="h-4 w-4" />}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={fadeIn}
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
        >
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </motion.div>
      )}

      {saved && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
          Settings saved successfully!
        </motion.div>
      )}

      <motion.div variants={fadeIn} className="flex flex-col gap-6 lg:flex-row">
        {/* Tab Navigation */}
        <div className="w-full shrink-0 lg:w-56">
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === "company" && (
            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Top Row: Logo and Basic Information */}
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    {/* Company Logo Upload */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Company Logo
                      </label>
                      <div className="relative group h-24 w-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                        {settings.company_logo ? (
                          <img
                            src={settings.company_logo}
                            alt="Company Logo"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <Building2 className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-600" />
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Upload</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload("company_logo", file);
                          }}
                        />
                      </div>
                      {settings.company_logo && (
                        <button
                          type="button"
                          onClick={() => handleChange("company_logo", "")}
                          className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    {/* Basic Grid */}
                    <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label="Company Name"
                        value={settings.company_name ?? ""}
                        onChange={(e) => handleChange("company_name", e.target.value)}
                        placeholder="Your company name"
                      />
                      <Input
                        label="Tax Number / GST"
                        value={settings.tax_number ?? ""}
                        onChange={(e) => handleChange("tax_number", e.target.value)}
                        placeholder="Tax registration number"
                      />
                      <Input
                        label="Company Reg. Number (RC)"
                        value={settings.company_reg_number ?? ""}
                        onChange={(e) => handleChange("company_reg_number", e.target.value)}
                        placeholder="Registration number"
                      />
                      <Input
                        label="Business Type"
                        value={settings.company_business_type ?? ""}
                        onChange={(e) => handleChange("company_business_type", e.target.value)}
                        placeholder="e.g. Retail, Wholesale, LLC"
                      />
                    </div>
                  </div>

                  {/* Contact Info Row */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input
                      label="Phone"
                      value={settings.company_phone ?? ""}
                      onChange={(e) => handleChange("company_phone", e.target.value)}
                      placeholder="Contact phone number"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={settings.company_email ?? ""}
                      onChange={(e) => handleChange("company_email", e.target.value)}
                      placeholder="Contact email"
                    />
                    <Input
                      label="Website"
                      value={settings.company_website ?? ""}
                      onChange={(e) => handleChange("company_website", e.target.value)}
                      placeholder="e.g. www.company.com"
                    />
                  </div>

                  {/* Address Row */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Address
                    </label>
                    <textarea
                      value={settings.company_address ?? ""}
                      onChange={(e) => handleChange("company_address", e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Full company address"
                    />
                  </div>

                  {/* Signature Section */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                      Authorized Signatory
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <Input
                        label="Signatory Name / Designation"
                        value={settings.company_signatory_name ?? ""}
                        onChange={(e) => handleChange("company_signatory_name", e.target.value)}
                        placeholder="e.g. Managing Director, CEO"
                      />

                      {/* Signature Image Upload */}
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Signature (Image)
                        </label>
                        <div className="flex items-start gap-4">
                          <div className="relative group h-20 w-48 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                            {settings.company_signature ? (
                              <img
                                src={settings.company_signature}
                                alt="Authorized Signature"
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <div className="text-center p-2">
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">Upload signature image</span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload("company_signature", file);
                              }}
                            />
                          </div>
                          {settings.company_signature && (
                            <button
                              type="button"
                              onClick={() => handleChange("company_signature", "")}
                              className="text-xs text-rose-500 hover:text-rose-600 font-medium mt-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "financial" && (
            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyIcon className="h-5 w-5 text-emerald-500" />
                    Financial Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Currency
                      </label>
                      <select
                        value={settings.currency ?? "INR"}
                        onChange={(e) => handleChange("currency", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="NGN">NGN - Nigerian Naira (₦)</option>
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="AED">AED - UAE Dirham</option>
                        <option value="SAR">SAR - Saudi Riyal</option>
                      </select>
                    </div>
                    <Input
                      label="Default Tax Rate (%)"
                      type="number"
                      value={settings.tax_rate ?? "18"}
                      onChange={(e) => handleChange("tax_rate", e.target.value)}
                      placeholder="18"
                    />
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      The tax rate is applied to new products by default. You can override it for individual products.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "inventory" && (
            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-amber-500" />
                    Inventory Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Low Stock Alert Threshold"
                    type="number"
                    value={settings.low_stock_threshold ?? "10"}
                    onChange={(e) => handleChange("low_stock_threshold", e.target.value)}
                    placeholder="10"
                  />
                  <p className="text-xs text-slate-500">
                    When a product's stock falls below this number, you will see an alert on the dashboard.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div variants={fadeIn}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-violet-500" />
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Low Stock Alerts
                      </p>
                      <p className="text-xs text-slate-500">
                        Get notified when products are running low
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleChange(
                          "enable_notifications",
                          settings.enable_notifications === "true" ? "false" : "true"
                        )
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        settings.enable_notifications === "true"
                          ? "bg-indigo-600"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.enable_notifications === "true" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div variants={fadeIn} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-500" />
                    My Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profileSuccess && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Profile updated successfully!
                    </div>
                  )}

                  {/* Profile Picture / Avatar Row */}
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="relative group h-20 w-20 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden">
                      {profileAvatar ? (
                        <img
                          src={profileAvatar}
                          alt="Profile Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          {profileFirstName?.[0] || user?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Profile Picture
                      </h4>
                      <p className="text-xs text-slate-500 mb-2">
                        Click on the image to upload a new profile picture. JPG, PNG or WEBP.
                      </p>
                      {profileAvatar && (
                        <button
                          type="button"
                          onClick={() => setProfileAvatar("")}
                          className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="First Name"
                      value={profileFirstName}
                      onChange={(e) => setProfileFirstName(e.target.value)}
                      placeholder="First Name"
                    />
                    <Input
                      label="Last Name"
                      value={profileLastName}
                      onChange={(e) => setProfileLastName(e.target.value)}
                      placeholder="Last Name"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Username"
                      value={user?.username ?? ""}
                      disabled
                      placeholder="Username"
                    />
                    <Input
                      label="Email Address"
                      value={user?.email ?? ""}
                      disabled
                      placeholder="Email"
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    icon={<Save className="h-4 w-4" />}
                  >
                    {savingProfile ? "Saving..." : "Save Profile Details"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-500" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pwSuccess && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Password changed successfully!
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-1 top-7 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-1 top-7 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPw}
                    icon={<Lock className="h-4 w-4" />}
                  >
                    {changingPw ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
