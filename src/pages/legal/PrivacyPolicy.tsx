import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const sections = [
  {
    title: "1. Introduction",
    content:
      "This Privacy Policy explains how WQS IMS collects, uses, and protects information when you use our Inventory Management System. We are committed to protecting your privacy and ensuring transparency in our data practices.",
  },
  {
    title: "2. Information We Collect",
    content:
      "WQS IMS is a locally-installed desktop application. The data you enter — including product details, customer information, supplier records, stock movements, purchase orders, and sales orders — is stored entirely on your local device. We do not collect, transmit, or have access to your business data.",
  },
  {
    title: "3. Account Information",
    content:
      "When you create an account, we store your username, email address, name, and password hash locally in the application database. This information never leaves your device unless you choose to back up or export it.",
  },
  {
    title: "4. How We Use Your Information",
    content:
      "Since your data remains on your device, we do not use your information for advertising, analytics, or any third-party purposes. The application uses your data solely to provide inventory management functionality.",
  },
  {
    title: "5. Data Storage and Security",
    content:
      "Your data is stored in a local MySQL database on your device. We implement industry-standard security practices within the application, including password hashing and role-based access control. You are responsible for securing your device and database.",
  },
  {
    title: "6. Data Sharing",
    content:
      "We do not share, sell, or distribute your data to any third parties. Your business information remains confidential and under your exclusive control.",
  },
  {
    title: "7. Data Backup and Export",
    content:
      "The application provides database export and backup capabilities. Any backups you create are your responsibility. We recommend storing backups securely and encrypting them if they contain sensitive information.",
  },
  {
    title: "8. Cookies and Tracking",
    content:
      "WQS IMS is a desktop application and does not use cookies, web beacons, or tracking technologies. The application does not connect to external analytics or advertising services.",
  },
  {
    title: "9. Third-Party Services",
    content:
      "The Service does not integrate with third-party services that collect your data. If you choose to configure external integrations in the future, those services will be subject to their own privacy policies.",
  },
  {
    title: "10. Children's Privacy",
    content:
      "The Service is intended for business use and is not directed at children under 13. We do not knowingly collect personal information from children.",
  },
  {
    title: "11. Your Rights",
    content:
      "Since all data is stored locally on your device, you have full control over your information. You can view, modify, export, or delete your data at any time through the application or directly from the database.",
  },
  {
    title: "12. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. When we do, we will revise the \"Last Updated\" date at the top of this page. We encourage you to review this policy periodically.",
  },
  {
    title: "13. Contact Us",
    content:
      "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us through the WQS IMS application support channel.",
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">WQS IMS</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        className="mx-auto max-w-4xl px-6 py-12"
      >
        <motion.div variants={fadeIn} className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Last Updated: June 26, 2026
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section) => (
            <motion.div key={section.title} variants={fadeIn}>
              <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                {section.title}
              </h2>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeIn}
          className="mt-12 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Your data stays on your device.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                WQS IMS is designed with privacy in mind. All business data is stored locally in
                your MySQL database and is never transmitted to external servers.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
