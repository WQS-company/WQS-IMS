// Auth & Users
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar: string | null;
  role_id: number;
  branch_id: number | null;
  is_active: boolean;
  two_factor_enabled: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  role?: Role;
  branch?: Branch;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  description: string | null;
}

// Company & Organization
export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  registration_number: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  logo: string | null;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  manager_id: string | null;
  is_main: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Warehouse {
  id: string;
  branch_id: string | null;
  name: string;
  code: string | null;
  address: string | null;
  capacity: number | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  branch?: Branch;
}

// Products
export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  children?: Category[];
  product_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  unit_id: string | null;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number;
  is_active: boolean;
  image_url: string | null;
  barcode: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  brand?: Brand;
  unit?: Unit;
  variants?: ProductVariant[];
  stock_levels?: StockLevel[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  attributes_json: Record<string, string> | null;
  is_active: boolean;
}

// Inventory
export interface StockLevel {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_updated: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  from_warehouse_id: string | null;
  to_warehouse_id: string | null;
  type: "purchase" | "sale" | "transfer" | "adjustment" | "return" | "damaged" | "opening";
  quantity: number;
  unit_cost: number;
  reference_type: string | null;
  reference_id: string | null;
  batch_number: string | null;
  serial_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  product?: Product;
  warehouse?: Warehouse;
}

// Purchases
export interface PurchaseOrder {
  id: string;
  po_number: string;
  rfq_id: string | null;
  supplier_id: string;
  branch_id: string;
  warehouse_id: string;
  order_date: string;
  expected_date: string | null;
  status: "draft" | "pending_approval" | "approved" | "ordered" | "partially_received" | "received" | "cancelled";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
  received_quantity: number;
  notes: string | null;
  product?: Product;
}

// Sales
export interface Quotation {
  id: string;
  quote_number: string;
  customer_id: string;
  branch_id: string;
  valid_until: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quote_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
  product?: Product;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  quote_id: string | null;
  customer_id: string;
  branch_id: string;
  warehouse_id: string;
  order_date: string;
  expected_date: string | null;
  status: "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  so_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
  delivered_quantity: number;
  notes: string | null;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  so_id: string | null;
  customer_id: string;
  branch_id: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
  paid_amount: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
  product?: Product;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// POS
export interface POSSession {
  id: string;
  session_number: string;
  branch_id: string;
  cashier_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  status: "open" | "closed";
}

export interface POSTransaction {
  id: string;
  transaction_number: string;
  session_id: string;
  customer_id: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items?: POSItem[];
}

export interface POSItem {
  id: string;
  transaction_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_amount: number;
  total: number;
  product?: Product;
}

// Customers & Suppliers
export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  tax_id: string | null;
  credit_limit: number;
  outstanding_balance: number;
  loyalty_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  supplier_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  lead_time_days: number;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Accounting
export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "income" | "expense";
  sub_type: string | null;
  parent_id: string | null;
  is_active: boolean;
  description: string | null;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  total_debit: number;
  total_credit: number;
  status: "draft" | "posted" | "reversed";
  created_by: string;
  created_at: string;
  lines?: JournalLine[];
}

export interface JournalLine {
  id: string;
  entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string | null;
  account?: ChartOfAccount;
}

// HR
export interface Department {
  id: string;
  name: string;
  manager_id: string | null;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  employee_id: string;
  user_id: string | null;
  department_id: string;
  branch_id: string;
  designation: string;
  join_date: string;
  salary: number;
  phone: string | null;
  emergency_contact: string | null;
  status: "active" | "inactive" | "terminated";
  created_at: string;
  department?: Department;
  user?: User;
}

// CRM
export interface Lead {
  id: string;
  lead_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  assigned_to: string | null;
  notes: string | null;
  next_follow_up: string | null;
  created_at: string;
}

export interface Opportunity {
  id: string;
  opportunity_number: string;
  lead_id: string | null;
  customer_id: string | null;
  title: string;
  value: number;
  stage: "prospect" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  probability: number;
  expected_close: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
}

// Assets
export interface Asset {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  depreciation_method: string;
  useful_life: number;
  branch_id: string;
  assigned_to: string | null;
  status: "active" | "maintenance" | "disposed" | "retired";
  notes: string | null;
  created_at: string;
}

// Notifications
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  module: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// Settings
export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_group: string;
  created_at: string;
  updated_at: string;
}

// Dashboard
export interface DashboardStats {
  total_products: number;
  total_customers: number;
  total_suppliers: number;
  total_stock_value: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_profit: number;
  pending_orders: number;
  low_stock_count: number;
  overdue_invoices: number;
  recent_sales: SalesOrder[];
  recent_purchases: PurchaseOrder[];
  stock_alerts: StockLevel[];
  revenue_trend: { date: string; revenue: number; expenses: number }[];
  top_products: { product: Product; total_sold: number; revenue: number }[];
  branch_performance: { branch: Branch; revenue: number; orders: number }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SearchResults {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  orders: (SalesOrder | PurchaseOrder)[];
}
