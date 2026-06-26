-- ==============================================================
-- WQS IMS Desktop App Database Schema
-- ==============================================================
-- Tables are auto-created by the app on first launch.
-- This file is a reference copy.

-- --------------------------------------------------------------
-- MIGRATION TRACKING
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schema_migrations` (
    `version` INT UNSIGNED NOT NULL PRIMARY KEY,
    `description` VARCHAR(255) NOT NULL,
    `applied_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- ROLES
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- PERMISSIONS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- ROLE ↔ PERMISSION (many-to-many)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
    `role_id` VARCHAR(36),
    `permission_id` VARCHAR(36),
    PRIMARY KEY (`role_id`, `permission_id`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- USERS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(50),
    `last_name` VARCHAR(50),
    `role_id` VARCHAR(36),
    `is_active` BOOLEAN DEFAULT TRUE,
    `last_login` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- COMPANIES
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `companies` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `address` TEXT,
    `phone` VARCHAR(20),
    `email` VARCHAR(100),
    `tax_number` VARCHAR(50),
    `logo_url` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- BRANCHES
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `branches` (
    `id` VARCHAR(36) PRIMARY KEY,
    `company_id` VARCHAR(36),
    `name` VARCHAR(100) NOT NULL,
    `address` TEXT,
    `phone` VARCHAR(20),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- WAREHOUSES
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `warehouses` (
    `id` VARCHAR(36) PRIMARY KEY,
    `branch_id` VARCHAR(36),
    `name` VARCHAR(100) NOT NULL,
    `address` TEXT,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- CATEGORIES (hierarchical)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `parent_id` VARCHAR(36),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- BRANDS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `brands` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `logo_url` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- UNITS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `units` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- PRODUCTS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
    `id` VARCHAR(36) PRIMARY KEY,
    `sku` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `category_id` VARCHAR(36),
    `brand_id` VARCHAR(36),
    `unit_id` VARCHAR(36),
    `cost_price` DECIMAL(15,2) DEFAULT 0,
    `selling_price` DECIMAL(15,2) DEFAULT 0,
    `min_stock` INT DEFAULT 0,
    `max_stock` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `image_url` TEXT,
    `barcode` VARCHAR(100),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- STOCK LEVELS (per product per warehouse)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_levels` (
    `id` VARCHAR(36) PRIMARY KEY,
    `product_id` VARCHAR(36),
    `warehouse_id` VARCHAR(36),
    `quantity` INT DEFAULT 0,
    `reserved_quantity` INT DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_product_warehouse` (`product_id`, `warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- STOCK MOVEMENTS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
    `id` VARCHAR(36) PRIMARY KEY,
    `product_id` VARCHAR(36),
    `warehouse_id` VARCHAR(36),
    `movement_type` ENUM('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT') NOT NULL,
    `quantity` INT NOT NULL,
    `reference_type` VARCHAR(50),
    `reference_id` VARCHAR(36),
    `notes` TEXT,
    `user_id` VARCHAR(36),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- CUSTOMERS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `email` VARCHAR(100),
    `phone` VARCHAR(20),
    `address` TEXT,
    `tax_number` VARCHAR(50),
    `credit_limit` DECIMAL(15,2) DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- SUPPLIERS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(200) NOT NULL,
    `email` VARCHAR(100),
    `phone` VARCHAR(20),
    `address` TEXT,
    `tax_number` VARCHAR(50),
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- PURCHASE ORDERS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_orders` (
    `id` VARCHAR(36) PRIMARY KEY,
    `po_number` VARCHAR(50) NOT NULL UNIQUE,
    `supplier_id` VARCHAR(36),
    `warehouse_id` VARCHAR(36),
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED') DEFAULT 'DRAFT',
    `order_date` DATE,
    `expected_date` DATE,
    `received_date` DATE NULL,
    `total_amount` DECIMAL(15,2) DEFAULT 0,
    `notes` TEXT,
    `created_by` VARCHAR(36),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- PURCHASE ORDER ITEMS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
    `id` VARCHAR(36) PRIMARY KEY,
    `purchase_order_id` VARCHAR(36),
    `product_id` VARCHAR(36),
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL,
    `total_price` DECIMAL(15,2) NOT NULL,
    `received_quantity` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- SALES ORDERS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales_orders` (
    `id` VARCHAR(36) PRIMARY KEY,
    `so_number` VARCHAR(50) NOT NULL UNIQUE,
    `customer_id` VARCHAR(36),
    `warehouse_id` VARCHAR(36),
    `status` ENUM('DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'DRAFT',
    `order_date` DATE,
    `delivery_date` DATE,
    `total_amount` DECIMAL(15,2) DEFAULT 0,
    `discount` DECIMAL(15,2) DEFAULT 0,
    `tax` DECIMAL(15,2) DEFAULT 0,
    `notes` TEXT,
    `created_by` VARCHAR(36),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- SALES ORDER ITEMS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales_order_items` (
    `id` VARCHAR(36) PRIMARY KEY,
    `sales_order_id` VARCHAR(36),
    `product_id` VARCHAR(36),
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL,
    `discount` DECIMAL(15,2) DEFAULT 0,
    `total_price` DECIMAL(15,2) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- INVOICES
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
    `id` VARCHAR(36) PRIMARY KEY,
    `invoice_number` VARCHAR(50) NOT NULL UNIQUE,
    `sales_order_id` VARCHAR(36),
    `customer_id` VARCHAR(36),
    `status` ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'DRAFT',
    `invoice_date` DATE,
    `due_date` DATE,
    `subtotal` DECIMAL(15,2) DEFAULT 0,
    `tax` DECIMAL(15,2) DEFAULT 0,
    `discount` DECIMAL(15,2) DEFAULT 0,
    `total` DECIMAL(15,2) DEFAULT 0,
    `paid_amount` DECIMAL(15,2) DEFAULT 0,
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- INVOICE ITEMS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoice_items` (
    `id` VARCHAR(36) PRIMARY KEY,
    `invoice_id` VARCHAR(36),
    `product_id` VARCHAR(36),
    `description` VARCHAR(200),
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15,2) NOT NULL,
    `total_price` DECIMAL(15,2) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- JOURNAL ENTRIES (Accounting)
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `journal_entries` (
    `id` VARCHAR(36) PRIMARY KEY,
    `entry_number` VARCHAR(50) NOT NULL UNIQUE,
    `entry_date` DATE NOT NULL,
    `description` TEXT,
    `reference_type` VARCHAR(50),
    `reference_id` VARCHAR(36),
    `is_posted` BOOLEAN DEFAULT FALSE,
    `created_by` VARCHAR(36),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- JOURNAL LINES
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `journal_lines` (
    `id` VARCHAR(36) PRIMARY KEY,
    `journal_entry_id` VARCHAR(36),
    `account_code` VARCHAR(50) NOT NULL,
    `description` VARCHAR(200),
    `debit` DECIMAL(15,2) DEFAULT 0,
    `credit` DECIMAL(15,2) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- NOTIFICATIONS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36),
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT,
    `notification_type` ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS') DEFAULT 'INFO',
    `is_read` BOOLEAN DEFAULT FALSE,
    `link` VARCHAR(500),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- APP SETTINGS
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_settings` (
    `id` VARCHAR(36) PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `setting_type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
    `description` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- End of schema
