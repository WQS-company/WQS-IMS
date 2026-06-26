import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing and using the WQS Inventory Management System (\"Service\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the Service.",
  },
  {
    title: "2. Description of Service",
    content:
      "WQS IMS is a desktop-based inventory management application that enables businesses to manage products, stock levels, warehouses, purchase orders, sales orders, customers, and suppliers. The Service is provided as a locally-installed application and does not transmit your data to external servers unless you explicitly configure such integration.",
  },
  {
    title: "3. Account Registration",
    content:
      "You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during registration and to keep your account information up to date. You are solely responsible for all activities that occur under your account.",
  },
  {
    title: "4. Acceptable Use",
    content:
      "You agree not to misuse the Service or help anyone else do so. You must not attempt to access the Service using unauthorized methods, interfere with its functionality, or use it for any unlawful purpose.",
  },
  {
    title: "5. Data Ownership",
    content:
      "All data you enter into the Service — including product information, customer records, supplier details, and transaction history — remains yours. WQS IMS stores this data locally on your device. We do not claim ownership over your business data.",
  },
  {
    title: "6. Intellectual Property",
    content:
      "The Service, including its software, design, branding, and documentation, is the intellectual property of WQS. You may not copy, modify, distribute, sell, or lease any part of the Service without prior written consent.",
  },
  {
    title: "7. Limitation of Liability",
    content:
      "To the maximum extent permitted by law, WQS shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service. The Service is provided \"as is\" without warranties of any kind, either express or implied.",
  },
  {
    title: "8. Data Backup",
    content:
      "You are responsible for regularly backing up your data. While the Service includes built-in database functionality, WQS recommends maintaining independent backups of all critical business data.",
  },
  {
    title: "9. Modifications to the Service",
    content:
      "WQS reserves the right to modify, suspend, or discontinue the Service at any time. We will make reasonable efforts to notify you of significant changes. Continued use of the Service after modifications constitutes acceptance of the updated terms.",
  },
  {
    title: "10. Termination",
    content:
      "You may stop using the Service at any time. WQS may suspend or terminate your access to the Service if you violate these terms. Upon termination, your right to use the Service ceases immediately.",
  },
  {
    title: "11. Changes to These Terms",
    content:
      "We may update these Terms of Service from time to time. When we do, we will revise the \"Last Updated\" date at the top of this page. Your continued use of the Service after any changes indicates your acceptance of the new terms.",
  },
  {
    title: "12. Contact Us",
    content:
      "If you have any questions about these Terms of Service, please contact us through the WQS IMS application support channel.",
  },
];

export default function TermsOfService() {
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
            <Shield className="h-5 w-5 text-indigo-500" />
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
            Terms of Service
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
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            By using WQS IMS, you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
