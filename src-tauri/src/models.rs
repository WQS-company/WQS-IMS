#![allow(dead_code)]

use chrono::{NaiveDate, NaiveDateTime, DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Role {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Permission {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar: Option<String>,
    pub role_id: Option<String>,
    pub is_active: Option<bool>,
    pub last_login: Option<NaiveDateTime>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub avatar: Option<String>,
    pub role_id: Option<String>,
    pub is_active: Option<bool>,
    pub last_login: Option<NaiveDateTime>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Company {
    pub id: String,
    pub name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub tax_number: Option<String>,
    pub logo_url: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Branch {
    pub id: String,
    pub company_id: Option<String>,
    pub name: String,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Warehouse {
    pub id: String,
    pub branch_id: Option<String>,
    pub name: String,
    pub code: Option<String>,
    pub address: Option<String>,
    pub capacity: Option<i32>,
    pub manager_id: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Brand {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Unit {
    pub id: String,
    pub name: String,
    pub symbol: String,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id: String,
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub brand_id: Option<String>,
    pub unit_id: Option<String>,
    pub cost_price: Option<Decimal>,
    pub selling_price: Option<Decimal>,
    pub min_stock: Option<i32>,
    pub max_stock: Option<i32>,
    pub is_active: Option<bool>,
    pub image_url: Option<String>,
    pub barcode: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockLevel {
    pub id: String,
    pub product_id: Option<String>,
    pub warehouse_id: Option<String>,
    pub quantity: Option<i32>,
    pub reserved_quantity: Option<i32>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StockMovement {
    pub id: String,
    pub product_id: Option<String>,
    pub warehouse_id: Option<String>,
    pub movement_type: String,
    pub quantity: i32,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub notes: Option<String>,
    pub user_id: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub id: String,
    pub format: String,
    pub data: String,
    pub timestamp: DateTime<Utc>,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncState {
    Idle,
    Syncing,
    Error,
    Completed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OperationType {
    Create,
    Update,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: String,
    pub entity_type: String,
    pub operation: OperationType,
    pub entity_id: String,
    pub data: Option<String>,
    pub version: i32,
    pub local_timestamp: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub retry_count: i32,
    pub max_retries: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub status: SyncState,
    pub last_sync: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
    pub pending_changes: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalEntity {
    pub id: String,
    pub entity_type: String,
    pub data: String,
    pub version: i32,
    pub local_version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub remote_updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Notification {
    pub id: String,
    pub user_id: Option<String>,
    pub title: String,
    pub message: Option<String>,
    pub notification_type: String,
    pub is_read: Option<bool>,
    pub link: Option<String>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintJob {
    pub id: String,
    pub job_type: PrintJobType,
    pub data: Vec<u8>,
    pub printer: Option<String>,
    pub options: Option<serde_json::Value>,
    pub status: PrintJobStatus,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PrintJobType {
    Receipt,
    Label,
    Invoice,
    Statement,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PrintJobStatus {
    Pending,
    Printing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PrinterType {
    Thermal,
    Laserjet,
    Inkjet,
    Usb,
    Network,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationChannel {
    StockAlert,
    OrderStatus,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationPriority {
    Low,
    Normal,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalNotification {
    pub id: String,
    pub title: String,
    pub body: String,
    pub icon: Option<String>,
    pub duration: Option<u64>,
    pub timestamp: DateTime<Utc>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InAppNotification {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub body: String,
    pub event_type: String,
    pub data: Option<serde_json::Value>,
    pub is_dismissible: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemNotification {
    pub id: String,
    pub title: String,
    pub body: String,
    pub tray_icon: Option<String>,
    pub actions: Option<Vec<String>>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailNotification {
    pub id: String,
    pub email: String,
    pub subject: String,
    pub body: String,
    pub template: Option<String>,
    pub attachments: Option<Vec<String>>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmsNotification {
    pub id: String,
    pub phone: String,
    pub message: String,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BarcodeScannerInfo {
    pub name: String,
    pub device_id: String,
    pub scan_mode: ScanMode,
    pub capabilities: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ScanMode {
    Continuous,
    Trigger,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Customer {
    pub id: String,
    pub customer_code: Option<String>,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub tax_number: Option<String>,
    pub credit_limit: Option<Decimal>,
    pub outstanding_balance: Option<Decimal>,
    pub loyalty_points: Option<i32>,
    pub is_active: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Supplier {
    pub id: String,
    pub supplier_code: Option<String>,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub tax_number: Option<String>,
    pub payment_terms: Option<String>,
    pub lead_time_days: Option<i32>,
    pub rating: Option<i32>,
    pub is_active: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PurchaseOrder {
    pub id: String,
    pub po_number: String,
    pub supplier_id: Option<String>,
    pub branch_id: Option<String>,
    pub warehouse_id: Option<String>,
    pub status: String,
    pub order_date: Option<NaiveDate>,
    pub expected_date: Option<NaiveDate>,
    pub received_date: Option<NaiveDate>,
    pub total_amount: Option<Decimal>,
    pub subtotal: Option<Decimal>,
    pub tax_amount: Option<Decimal>,
    pub discount_amount: Option<Decimal>,
    pub shipping_cost: Option<Decimal>,
    pub notes: Option<String>,
    pub approved_by: Option<String>,
    pub approved_at: Option<NaiveDateTime>,
    pub created_by: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PurchaseOrderItem {
    pub id: String,
    pub purchase_order_id: Option<String>,
    pub product_id: Option<String>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub tax_rate: Option<Decimal>,
    pub discount: Option<Decimal>,
    pub total_price: Decimal,
    pub received_quantity: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SalesOrder {
    pub id: String,
    pub so_number: String,
    pub customer_id: Option<String>,
    pub branch_id: Option<String>,
    pub warehouse_id: Option<String>,
    pub status: String,
    pub order_date: Option<NaiveDate>,
    pub delivery_date: Option<NaiveDate>,
    pub total_amount: Option<Decimal>,
    pub subtotal: Option<Decimal>,
    pub discount: Option<Decimal>,
    pub discount_amount: Option<Decimal>,
    pub tax: Option<Decimal>,
    pub tax_amount: Option<Decimal>,
    pub shipping_cost: Option<Decimal>,
    pub notes: Option<String>,
    pub created_by: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SalesOrderItem {
    pub id: String,
    pub sales_order_id: Option<String>,
    pub product_id: Option<String>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub discount: Option<Decimal>,
    pub total_price: Decimal,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub sales_order_id: Option<String>,
    pub customer_id: Option<String>,
    pub branch_id: Option<String>,
    pub status: String,
    pub invoice_date: Option<NaiveDate>,
    pub due_date: Option<NaiveDate>,
    pub subtotal: Option<Decimal>,
    pub tax: Option<Decimal>,
    pub discount: Option<Decimal>,
    pub total: Option<Decimal>,
    pub paid_amount: Option<Decimal>,
    pub notes: Option<String>,
    pub created_by: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InvoiceItem {
    pub id: String,
    pub invoice_id: Option<String>,
    pub product_id: Option<String>,
    pub description: Option<String>,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub total_price: Decimal,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct JournalEntry {
    pub id: String,
    pub entry_number: String,
    pub entry_date: NaiveDate,
    pub description: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub is_posted: Option<bool>,
    pub created_by: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct JournalLine {
    pub id: String,
    pub journal_entry_id: Option<String>,
    pub account_code: String,
    pub description: Option<String>,
    pub debit: Option<Decimal>,
    pub credit: Option<Decimal>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AppSetting {
    pub id: String,
    pub setting_key: String,
    pub setting_value: Option<String>,
    pub setting_type: String,
    pub description: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_products: i64,
    pub total_customers: i64,
    pub total_suppliers: i64,
    pub total_revenue: Decimal,
    pub total_purchases: Decimal,
    pub low_stock_count: i64,
    pub pending_orders: i64,
    pub recent_sales_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevenueChart {
    pub labels: Vec<String>,
    pub data: Vec<Decimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopProduct {
    pub product_id: String,
    pub product_name: String,
    pub total_sold: i64,
    pub total_revenue: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockAlert {
    pub product_id: String,
    pub product_name: String,
    pub sku: String,
    pub current_stock: i32,
    pub min_stock: i32,
    pub warehouse_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesReport {
    pub period: String,
    pub total_sales: Decimal,
    pub total_orders: i64,
    pub average_order_value: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseReport {
    pub period: String,
    pub total_purchases: Decimal,
    pub total_orders: i64,
    pub average_order_value: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryReport {
    pub total_products: i64,
    pub total_stock_value: Decimal,
    pub low_stock_products: i64,
    pub out_of_stock_products: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProductRequest {
    pub sku: String,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub brand_id: Option<String>,
    pub unit_id: Option<String>,
    pub cost_price: Option<Decimal>,
    pub selling_price: Option<Decimal>,
    pub min_stock: Option<i32>,
    pub max_stock: Option<i32>,
    pub barcode: Option<String>,
    pub image_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStockMovementRequest {
    pub product_id: String,
    pub warehouse_id: String,
    pub movement_type: String,
    pub quantity: i32,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWarehouseRequest {
    pub branch_id: Option<String>,
    pub name: String,
    pub address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePurchaseOrderRequest {
    pub supplier_id: String,
    pub warehouse_id: String,
    pub expected_date: Option<String>,
    pub notes: Option<String>,
    pub items: Vec<PurchaseOrderItemRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseOrderItemRequest {
    pub product_id: String,
    pub quantity: i32,
    pub unit_price: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSalesOrderRequest {
    pub customer_id: String,
    pub warehouse_id: String,
    pub delivery_date: Option<String>,
    pub discount: Option<Decimal>,
    pub tax: Option<Decimal>,
    pub notes: Option<String>,
    pub items: Vec<SalesOrderItemRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesOrderItemRequest {
    pub product_id: String,
    pub quantity: i32,
    pub unit_price: Decimal,
    pub discount: Option<Decimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateInvoiceRequest {
    pub sales_order_id: Option<String>,
    pub customer_id: String,
    pub due_date: Option<String>,
    pub notes: Option<String>,
    pub items: Vec<InvoiceItemRequest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceItemRequest {
    pub product_id: String,
    pub description: Option<String>,
    pub quantity: i32,
    pub unit_price: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCustomerRequest {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub tax_number: Option<String>,
    pub credit_limit: Option<Decimal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSupplierRequest {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub tax_number: Option<String>,
    pub payment_terms: Option<String>,
    pub lead_time_days: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResults {
    pub products: Vec<Product>,
    pub customers: Vec<Customer>,
    pub suppliers: Vec<Supplier>,
    pub purchase_orders: Vec<PurchaseOrder>,
    pub sales_orders: Vec<SalesOrder>,
}
