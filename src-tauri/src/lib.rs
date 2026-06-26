use tauri::Manager;

use crate::db::DatabaseManager;

pub struct AppState {
    pub db: std::sync::OnceLock<DatabaseManager>,
    pub jwt_secret: String,
}

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let jwt_secret = std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "wqs-ims-default-secret-change-in-production".to_string());

            let state = AppState {
                db: std::sync::OnceLock::new(),
                jwt_secret,
            };
            app.manage(state);

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match DatabaseManager::new().await {
                    Ok(db) => {
                        log::info!("✓ Database ready — connected, migrated, and seeded");
                        let state = handle.state::<AppState>();
                        let _ = state.db.set(db);
                        log::info!("✓ Application state initialized");
                    }
                    Err(e) => {
                        log::error!("Database initialization failed: {}", e);
                        eprintln!();
                        eprintln!("╔══════════════════════════════════════════════╗");
                        eprintln!("║        WQS IMS — DATABASE ERROR             ║");
                        eprintln!("╠══════════════════════════════════════════════╣");
                        eprintln!("║                                              ║");
                        eprintln!("║  {}", format!("{:<42}", e));
                        eprintln!("║                                              ║");
                        eprintln!("║  To fix this:                                ║");
                        eprintln!("║  1. Open XAMPP Control Panel                 ║");
                        eprintln!("║  2. Click Start on MySQL                     ║");
                        eprintln!("║  3. Restart this application                 ║");
                        eprintln!("║                                              ║");
                        eprintln!("║  Connection: root@127.0.0.1:3306             ║");
                        eprintln!("║  Database:   wqs_ims (auto-created)          ║");
                        eprintln!("║                                              ║");
                        eprintln!("╚══════════════════════════════════════════════╝");
                        eprintln!();
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::login,
            commands::logout,
            commands::register,
            commands::get_current_user,
            commands::change_password,
            commands::get_users,
            commands::create_user,
            commands::update_user,
            commands::delete_user,
            commands::get_roles,
            commands::get_products,
            commands::get_product_by_id,
            commands::create_product,
            commands::update_product,
            commands::delete_product,
            commands::get_categories,
            commands::create_category,
            commands::delete_category,
            commands::get_brands,
            commands::create_brand,
            commands::get_units,
            commands::create_unit,
            commands::get_stock_levels,
            commands::create_stock_movement,
            commands::get_stock_movements,
            commands::get_warehouses,
            commands::create_warehouse,
            commands::update_warehouse,
            commands::get_purchase_orders,
            commands::create_purchase_order,
            commands::update_po_status,
            commands::get_sales_orders,
            commands::create_sales_order,
            commands::update_so_status,
            commands::get_invoices,
            commands::create_invoice,
            commands::update_invoice_status,
            commands::get_customers,
            commands::create_customer,
            commands::update_customer,
            commands::delete_customer,
            commands::get_suppliers,
            commands::create_supplier,
            commands::update_supplier,
            commands::get_dashboard_stats,
            commands::get_revenue_chart,
            commands::get_top_products,
            commands::get_stock_alerts,
            commands::get_settings,
            commands::update_setting,
            commands::get_notifications,
            commands::mark_notification_read,
            commands::mark_all_read,
            commands::global_search,
            commands::get_sales_report,
            commands::get_purchase_report,
            commands::get_inventory_report,
            commands::create_backup,
            commands::restore_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod db;
mod commands;
mod models;
mod auth;
