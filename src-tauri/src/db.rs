use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use std::time::Duration;
use thiserror::Error;

const DB_NAME: &str = "wqs_ims";
const MAX_RETRIES: u32 = 10;
const RETRY_DELAY_MS: u64 = 2000;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("MySQL connection refused after {attempts} attempts. Please ensure XAMPP MySQL is running on port 3306")]
    ConnectionRefused { attempts: u32 },

    #[error("Database '{0}' could not be created: {1}")]
    DatabaseCreateFailed(String, String),

    #[error("Migration #{number} failed: {message}")]
    MigrationFailed { number: u32, message: String },

    #[error("Seed failed: {0}")]
    SeedFailed(String),

    #[error("Database error: {0}")]
    Sqlx(#[from] sqlx::Error),
}

pub struct DatabaseManager {
    pool: MySqlPool,
}

impl DatabaseManager {
    pub async fn new() -> Result<Self, DatabaseError> {
        let base_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "mysql://root:@127.0.0.1:3306".to_string());

        let db_url = if base_url.contains(DB_NAME) {
            base_url.clone()
        } else {
            format!("{}/{}", base_url.trim_end_matches('/'), DB_NAME)
        };

        // Step 1: Ensure MySQL is reachable and the database exists
        Self::ensure_database(&base_url).await?;

        // Step 2: Connect to the database with retry
        let pool = Self::connect_with_retry(&db_url).await?;

        // Step 3: Run all migrations
        Self::run_migrations(&pool).await?;

        // Step 4: Seed initial data
        Self::seed_data(&pool).await?;

        Ok(Self { pool })
    }

    /// Connect to MySQL server (without database) and create the database if missing.
    async fn ensure_database(base_url: &str) -> Result<(), DatabaseError> {
        let pool = MySqlPoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_secs(5))
            .connect(base_url)
            .await
            .map_err(|e| match &e {
                sqlx::Error::Database(db_err) => {
                    let msg = db_err.message();
                    if msg.contains("connection refused") || msg.contains("Can't connect") {
                        DatabaseError::ConnectionRefused { attempts: 0 }
                    } else {
                        DatabaseError::Sqlx(e)
                    }
                }
                sqlx::Error::Io(io_err) => {
                    if io_err.kind() == std::io::ErrorKind::ConnectionRefused {
                        DatabaseError::ConnectionRefused { attempts: 0 }
                    } else {
                        DatabaseError::Sqlx(e)
                    }
                }
                _ => DatabaseError::Sqlx(e),
            })?;

        let create_sql = format!(
            "CREATE DATABASE IF NOT EXISTS `{}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
            DB_NAME
        );
        sqlx::query(&create_sql)
            .execute(&pool)
            .await
            .map_err(|e| DatabaseError::DatabaseCreateFailed(DB_NAME.to_string(), e.to_string()))?;

        log::info!("Database '{}' ensured", DB_NAME);
        Ok(())
    }

    /// Connect to the database URL, retrying up to MAX_RETRIES times.
    async fn connect_with_retry(db_url: &str) -> Result<MySqlPool, DatabaseError> {
        let mut last_err = None;

        for attempt in 1..=MAX_RETRIES {
            match MySqlPoolOptions::new()
                .max_connections(5)
                .acquire_timeout(Duration::from_secs(10))
                .connect(db_url)
                .await
            {
                Ok(pool) => {
                    log::info!("Connected to database on attempt {}", attempt);
                    return Ok(pool);
                }
                Err(e) => {
                    log::warn!("Connection attempt {}/{} failed: {}", attempt, MAX_RETRIES, e);
                    last_err = Some(e);

                    if attempt < MAX_RETRIES {
                        tokio::time::sleep(Duration::from_millis(RETRY_DELAY_MS)).await;
                    }
                }
            }
        }

        Err(match last_err {
            Some(sqlx::Error::Database(db_err)) => {
                let msg = db_err.message();
                if msg.contains("connection refused") || msg.contains("Can't connect") {
                    DatabaseError::ConnectionRefused { attempts: MAX_RETRIES }
                } else {
                    DatabaseError::Sqlx(sqlx::Error::Database(db_err))
                }
            }
            Some(sqlx::Error::Io(io_err)) => {
                if io_err.kind() == std::io::ErrorKind::ConnectionRefused {
                    DatabaseError::ConnectionRefused { attempts: MAX_RETRIES }
                } else {
                    DatabaseError::Sqlx(sqlx::Error::Io(io_err))
                }
            }
            Some(e) => DatabaseError::Sqlx(e),
            None => DatabaseError::ConnectionRefused { attempts: MAX_RETRIES },
        })
    }

    /// Run all CREATE TABLE migrations in order, tracking applied versions.
    async fn run_migrations(pool: &MySqlPool) -> Result<(), DatabaseError> {
        // Create migration tracking table
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS `schema_migrations` (
                `version` INT UNSIGNED NOT NULL PRIMARY KEY,
                `description` VARCHAR(255) NOT NULL,
                `applied_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        )
        .execute(pool)
        .await
        .map_err(|e| DatabaseError::MigrationFailed { number: 0, message: e.to_string() })?;

        let migrations: Vec<(u32, &str, &str)> = vec![
            (1, "roles", "CREATE TABLE IF NOT EXISTS `roles` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(50) NOT NULL UNIQUE,
                `description` TEXT,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (2, "permissions", "CREATE TABLE IF NOT EXISTS `permissions` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL UNIQUE,
                `description` TEXT,
                `created_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (3, "role_permissions", "CREATE TABLE IF NOT EXISTS `role_permissions` (
                `role_id` VARCHAR(36),
                `permission_id` VARCHAR(36),
                PRIMARY KEY (`role_id`, `permission_id`),
                FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (4, "users", "CREATE TABLE IF NOT EXISTS `users` (
                `id` VARCHAR(36) PRIMARY KEY,
                `username` VARCHAR(50) NOT NULL UNIQUE,
                `email` VARCHAR(100) NOT NULL UNIQUE,
                `password_hash` VARCHAR(255) NOT NULL,
                `first_name` VARCHAR(50),
                `last_name` VARCHAR(50),
                `role_id` VARCHAR(36),
                `is_active` BOOLEAN DEFAULT TRUE,
                `last_login` DATETIME NULL,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (5, "companies", "CREATE TABLE IF NOT EXISTS `companies` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `address` TEXT,
                `phone` VARCHAR(20),
                `email` VARCHAR(100),
                `tax_number` VARCHAR(50),
                `logo_url` TEXT,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (6, "branches", "CREATE TABLE IF NOT EXISTS `branches` (
                `id` VARCHAR(36) PRIMARY KEY,
                `company_id` VARCHAR(36),
                `name` VARCHAR(100) NOT NULL,
                `address` TEXT,
                `phone` VARCHAR(20),
                `is_active` BOOLEAN DEFAULT TRUE,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (7, "warehouses", "CREATE TABLE IF NOT EXISTS `warehouses` (
                `id` VARCHAR(36) PRIMARY KEY,
                `branch_id` VARCHAR(36),
                `name` VARCHAR(100) NOT NULL,
                `address` TEXT,
                `is_active` BOOLEAN DEFAULT TRUE,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (8, "categories", "CREATE TABLE IF NOT EXISTS `categories` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `description` TEXT,
                `parent_id` VARCHAR(36),
                `created_at` DATETIME NULL,
                FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (9, "brands", "CREATE TABLE IF NOT EXISTS `brands` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(100) NOT NULL,
                `description` TEXT,
                `logo_url` TEXT,
                `created_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (10, "units", "CREATE TABLE IF NOT EXISTS `units` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(50) NOT NULL,
                `symbol` VARCHAR(10) NOT NULL,
                `created_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (11, "products", "CREATE TABLE IF NOT EXISTS `products` (
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
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
                FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE SET NULL,
                FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (12, "stock_levels", "CREATE TABLE IF NOT EXISTS `stock_levels` (
                `id` VARCHAR(36) PRIMARY KEY,
                `product_id` VARCHAR(36),
                `warehouse_id` VARCHAR(36),
                `quantity` INT DEFAULT 0,
                `reserved_quantity` INT DEFAULT 0,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
                UNIQUE KEY `unique_product_warehouse` (`product_id`, `warehouse_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (13, "stock_movements", "CREATE TABLE IF NOT EXISTS `stock_movements` (
                `id` VARCHAR(36) PRIMARY KEY,
                `product_id` VARCHAR(36),
                `warehouse_id` VARCHAR(36),
                `movement_type` ENUM('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT') NOT NULL,
                `quantity` INT NOT NULL,
                `reference_type` VARCHAR(50),
                `reference_id` VARCHAR(36),
                `notes` TEXT,
                `user_id` VARCHAR(36),
                `created_at` DATETIME NULL,
                FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (14, "customers", "CREATE TABLE IF NOT EXISTS `customers` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(200) NOT NULL,
                `email` VARCHAR(100),
                `phone` VARCHAR(20),
                `address` TEXT,
                `tax_number` VARCHAR(50),
                `credit_limit` DECIMAL(15,2) DEFAULT 0,
                `is_active` BOOLEAN DEFAULT TRUE,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (15, "suppliers", "CREATE TABLE IF NOT EXISTS `suppliers` (
                `id` VARCHAR(36) PRIMARY KEY,
                `name` VARCHAR(200) NOT NULL,
                `email` VARCHAR(100),
                `phone` VARCHAR(20),
                `address` TEXT,
                `tax_number` VARCHAR(50),
                `is_active` BOOLEAN DEFAULT TRUE,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (16, "purchase_orders", "CREATE TABLE IF NOT EXISTS `purchase_orders` (
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
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
                FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL,
                FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (17, "purchase_order_items", "CREATE TABLE IF NOT EXISTS `purchase_order_items` (
                `id` VARCHAR(36) PRIMARY KEY,
                `purchase_order_id` VARCHAR(36),
                `product_id` VARCHAR(36),
                `quantity` INT NOT NULL,
                `unit_price` DECIMAL(15,2) NOT NULL,
                `total_price` DECIMAL(15,2) NOT NULL,
                `received_quantity` INT DEFAULT 0,
                `created_at` DATETIME NULL,
                FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (18, "sales_orders", "CREATE TABLE IF NOT EXISTS `sales_orders` (
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
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
                FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL,
                FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (19, "sales_order_items", "CREATE TABLE IF NOT EXISTS `sales_order_items` (
                `id` VARCHAR(36) PRIMARY KEY,
                `sales_order_id` VARCHAR(36),
                `product_id` VARCHAR(36),
                `quantity` INT NOT NULL,
                `unit_price` DECIMAL(15,2) NOT NULL,
                `discount` DECIMAL(15,2) DEFAULT 0,
                `total_price` DECIMAL(15,2) NOT NULL,
                `created_at` DATETIME NULL,
                FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (20, "invoices", "CREATE TABLE IF NOT EXISTS `invoices` (
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
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE SET NULL,
                FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (21, "invoice_items", "CREATE TABLE IF NOT EXISTS `invoice_items` (
                `id` VARCHAR(36) PRIMARY KEY,
                `invoice_id` VARCHAR(36),
                `product_id` VARCHAR(36),
                `description` VARCHAR(200),
                `quantity` INT NOT NULL,
                `unit_price` DECIMAL(15,2) NOT NULL,
                `total_price` DECIMAL(15,2) NOT NULL,
                `created_at` DATETIME NULL,
                FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
                FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (22, "journal_entries", "CREATE TABLE IF NOT EXISTS `journal_entries` (
                `id` VARCHAR(36) PRIMARY KEY,
                `entry_number` VARCHAR(50) NOT NULL UNIQUE,
                `entry_date` DATE NOT NULL,
                `description` TEXT,
                `reference_type` VARCHAR(50),
                `reference_id` VARCHAR(36),
                `is_posted` BOOLEAN DEFAULT FALSE,
                `created_by` VARCHAR(36),
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL,
                FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (23, "journal_lines", "CREATE TABLE IF NOT EXISTS `journal_lines` (
                `id` VARCHAR(36) PRIMARY KEY,
                `journal_entry_id` VARCHAR(36),
                `account_code` VARCHAR(50) NOT NULL,
                `description` VARCHAR(200),
                `debit` DECIMAL(15,2) DEFAULT 0,
                `credit` DECIMAL(15,2) DEFAULT 0,
                `created_at` DATETIME NULL,
                FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (24, "notifications", "CREATE TABLE IF NOT EXISTS `notifications` (
                `id` VARCHAR(36) PRIMARY KEY,
                `user_id` VARCHAR(36),
                `title` VARCHAR(200) NOT NULL,
                `message` TEXT,
                `notification_type` ENUM('INFO', 'WARNING', 'ERROR', 'SUCCESS') DEFAULT 'INFO',
                `is_read` BOOLEAN DEFAULT FALSE,
                `link` VARCHAR(500),
                `created_at` DATETIME NULL,
                FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (25, "app_settings", "CREATE TABLE IF NOT EXISTS `app_settings` (
                `id` VARCHAR(36) PRIMARY KEY,
                `setting_key` VARCHAR(100) NOT NULL UNIQUE,
                `setting_value` TEXT,
                `setting_type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') DEFAULT 'STRING',
                `description` TEXT,
                `created_at` DATETIME NULL,
                `updated_at` DATETIME NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

            (26, "add_missing_columns", "ALTER TABLE `customers`
                ADD COLUMN `customer_code` VARCHAR(50) AFTER `id`,
                ADD COLUMN `city` VARCHAR(100) AFTER `address`,
                ADD COLUMN `state` VARCHAR(100) AFTER `city`,
                ADD COLUMN `country` VARCHAR(100) AFTER `state`,
                ADD COLUMN `outstanding_balance` DECIMAL(15,2) DEFAULT 0 AFTER `credit_limit`,
                ADD COLUMN `loyalty_points` INT DEFAULT 0 AFTER `outstanding_balance`"),

            (27, "add_supplier_columns", "ALTER TABLE `suppliers`
                ADD COLUMN `supplier_code` VARCHAR(50) AFTER `id`,
                ADD COLUMN `city` VARCHAR(100) AFTER `address`,
                ADD COLUMN `state` VARCHAR(100) AFTER `city`,
                ADD COLUMN `country` VARCHAR(100) AFTER `state`,
                ADD COLUMN `payment_terms` VARCHAR(100) AFTER `tax_number`,
                ADD COLUMN `lead_time_days` INT DEFAULT 0 AFTER `payment_terms`,
                ADD COLUMN `rating` INT DEFAULT 0 AFTER `lead_time_days`"),

            (28, "add_warehouse_columns", "ALTER TABLE `warehouses`
                ADD COLUMN `code` VARCHAR(50) AFTER `id`,
                ADD COLUMN `capacity` INT DEFAULT 0 AFTER `address`,
                ADD COLUMN `manager_id` VARCHAR(36) AFTER `capacity`"),

            (29, "add_po_columns", "ALTER TABLE `purchase_orders`
                ADD COLUMN `branch_id` VARCHAR(36) AFTER `supplier_id`,
                ADD COLUMN `subtotal` DECIMAL(15,2) DEFAULT 0 AFTER `total_amount`,
                ADD COLUMN `tax_amount` DECIMAL(15,2) DEFAULT 0 AFTER `subtotal`,
                ADD COLUMN `discount_amount` DECIMAL(15,2) DEFAULT 0 AFTER `tax_amount`,
                ADD COLUMN `shipping_cost` DECIMAL(15,2) DEFAULT 0 AFTER `discount_amount`,
                ADD COLUMN `approved_by` VARCHAR(36) AFTER `notes`,
                ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`"),

            (30, "add_so_columns", "ALTER TABLE `sales_orders`
                ADD COLUMN `branch_id` VARCHAR(36) AFTER `customer_id`,
                ADD COLUMN `subtotal` DECIMAL(15,2) DEFAULT 0 AFTER `total_amount`,
                ADD COLUMN `tax_amount` DECIMAL(15,2) DEFAULT 0 AFTER `subtotal`,
                ADD COLUMN `discount_amount` DECIMAL(15,2) DEFAULT 0 AFTER `tax_amount`,
                ADD COLUMN `shipping_cost` DECIMAL(15,2) DEFAULT 0 AFTER `discount_amount`"),

            (31, "add_invoice_columns", "ALTER TABLE `invoices`
                ADD COLUMN `branch_id` VARCHAR(36) AFTER `customer_id`,
                ADD COLUMN `created_by` VARCHAR(36) AFTER `notes`"),

            (32, "add_po_items_columns", "ALTER TABLE `purchase_order_items`
                ADD COLUMN `tax_rate` DECIMAL(5,2) DEFAULT 0 AFTER `unit_price`,
                ADD COLUMN `discount` DECIMAL(15,2) DEFAULT 0 AFTER `tax_rate`"),

            (33, "add_so_items_columns", "ALTER TABLE `sales_order_items`
                ADD COLUMN `tax_rate` DECIMAL(5,2) DEFAULT 0 AFTER `unit_price`"),

            (34, "alter_app_settings_value_to_longtext", "ALTER TABLE `app_settings` MODIFY COLUMN `setting_value` LONGTEXT"),

            (35, "add_avatar_to_users", "ALTER TABLE `users` ADD COLUMN `avatar` LONGTEXT AFTER `last_name`"),

            (36, "alter_products_image_url_to_longtext", "ALTER TABLE `products` MODIFY COLUMN `image_url` LONGTEXT"),

            (37, "alter_brands_logo_url_to_longtext", "ALTER TABLE `brands` MODIFY COLUMN `logo_url` LONGTEXT"),
        ];

        // Get already applied migrations
        let applied: Vec<(u32,)> = sqlx::query_as("SELECT `version` FROM `schema_migrations`")
            .fetch_all(pool)
            .await
            .map_err(|e| DatabaseError::MigrationFailed { number: 0, message: e.to_string() })?;

        let applied_set: std::collections::HashSet<u32> =
            applied.into_iter().map(|(v,)| v).collect();

        let mut applied_count = 0u32;
        let mut skipped_count = 0u32;

        for (version, description, sql) in &migrations {
            if applied_set.contains(version) {
                skipped_count += 1;
                continue;
            }

            sqlx::query(sql)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::MigrationFailed {
                    number: *version,
                    message: e.to_string(),
                })?;

            sqlx::query(
                "INSERT IGNORE INTO `schema_migrations` (`version`, `description`) VALUES (?, ?)",
            )
            .bind(version)
            .bind(description)
            .execute(pool)
            .await
            .map_err(|e| DatabaseError::MigrationFailed {
                number: *version,
                message: e.to_string(),
            })?;

            applied_count += 1;
            log::info!("  Applied migration #{}: {}", version, description);
        }

        log::info!(
            "Migrations complete: {} applied, {} already existed, {} total",
            applied_count,
            skipped_count,
            migrations.len()
        );

        Ok(())
    }

    /// Seed default roles, admin user, and sample data if tables are empty.
    async fn seed_data(pool: &MySqlPool) -> Result<(), DatabaseError> {
        // Seed roles
        let role_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM `roles`")
            .fetch_one(pool)
            .await
            .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

        if role_count.0 == 0 {
            log::info!("Seeding default roles...");

            let admin_role_id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO `roles` (`id`, `name`, `description`) VALUES (?, 'Admin', 'Full system access')")
                .bind(&admin_role_id)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            let staff_role_id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO `roles` (`id`, `name`, `description`) VALUES (?, 'Staff', 'Standard staff access')")
                .bind(&staff_role_id)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            let manager_role_id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO `roles` (`id`, `name`, `description`) VALUES (?, 'Manager', 'Department manager access')")
                .bind(&manager_role_id)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            log::info!("  Seeded 3 roles: Admin, Staff, Manager");
        }

        // Seed admin user
        let user_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM `users`")
            .fetch_one(pool)
            .await
            .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

        if user_count.0 == 0 {
            log::info!("Seeding default admin user...");

            let admin_role: Option<(String,)> = sqlx::query_as(
                "SELECT `id` FROM `roles` WHERE `name` = 'Admin' LIMIT 1",
            )
            .fetch_optional(pool)
            .await
            .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            let admin_id = uuid::Uuid::new_v4().to_string();
            let password_hash = bcrypt::hash("admin123", 10)
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            sqlx::query(
                "INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `role_id`) VALUES (?, 'admin', 'admin@wqs.com', ?, 'Admin', 'User', ?)"
            )
            .bind(&admin_id)
            .bind(&password_hash)
            .bind(&admin_role.map(|r| r.0))
            .execute(pool)
            .await
            .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            log::info!("  Seeded admin user (admin / admin123)");
        }

        // Seed default units
        let unit_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM `units`")
            .fetch_one(pool)
            .await
            .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

        if unit_count.0 == 0 {
            log::info!("Seeding default units...");
            let units = vec![
                ("Piece", "pc"),
                ("Kilogram", "kg"),
                ("Gram", "g"),
                ("Liter", "L"),
                ("Milliliter", "mL"),
                ("Meter", "m"),
                ("Centimeter", "cm"),
                ("Box", "box"),
                ("Pack", "pack"),
                ("Set", "set"),
                ("Dozen", "dz"),
                ("Pair", "pair"),
            ];

            for (name, symbol) in &units {
                let id = uuid::Uuid::new_v4().to_string();
                sqlx::query("INSERT INTO `units` (`id`, `name`, `symbol`) VALUES (?, ?, ?)")
                    .bind(&id)
                    .bind(name)
                    .bind(symbol)
                    .execute(pool)
                    .await
                    .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;
            }
            log::info!("  Seeded {} units", units.len());
        }

        // Seed default app settings
        let settings_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM `app_settings`")
            .fetch_one(pool)
            .await
            .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

        if settings_count.0 == 0 {
            log::info!("Seeding default app settings...");
            let settings = vec![
                ("company_name", "My Company", "STRING"),
                ("currency", "NGN", "STRING"),
                ("tax_rate", "18", "NUMBER"),
                ("low_stock_threshold", "10", "NUMBER"),
                ("enable_notifications", "true", "BOOLEAN"),
            ];

            for (key, value, r#type) in &settings {
                let id = uuid::Uuid::new_v4().to_string();
                sqlx::query(
                    "INSERT INTO `app_settings` (`id`, `setting_key`, `setting_value`, `setting_type`) VALUES (?, ?, ?, ?)",
                )
                .bind(&id)
                .bind(key)
                .bind(value)
                .bind(r#type)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;
            }
            log::info!("  Seeded {} app settings", settings.len());
        }

        // Seed default company, branch, and warehouse
        let company_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM `companies`")
            .fetch_one(pool)
            .await
            .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

        if company_count.0 == 0 {
            log::info!("Seeding default company, branch, and warehouse...");

            let company_id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO `companies` (`id`, `name`) VALUES (?, 'My Company')")
                .bind(&company_id)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            let branch_id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO `branches` (`id`, `company_id`, `name`, `is_active`) VALUES (?, ?, 'Main Branch', TRUE)")
                .bind(&branch_id)
                .bind(&company_id)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            let warehouse_id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO `warehouses` (`id`, `branch_id`, `name`, `code`, `capacity`, `is_active`) VALUES (?, ?, 'Main Warehouse', 'WH-001', 10000, TRUE)")
                .bind(&warehouse_id)
                .bind(&branch_id)
                .execute(pool)
                .await
                .map_err(|e| DatabaseError::SeedFailed(e.to_string()))?;

            log::info!("  Seeded company, branch, and warehouse");
        }

        Ok(())
    }

    pub fn get_pool(&self) -> &MySqlPool {
        &self.pool
    }
}
