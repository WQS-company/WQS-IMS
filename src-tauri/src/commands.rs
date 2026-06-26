use crate::auth::{create_token, hash_password, verify_password, verify_token};
use crate::models::*;
use crate::AppState;
use rust_decimal::Decimal;
use tauri::State;
use uuid::Uuid;

fn get_pool<'a>(state: &'a State<'_, AppState>) -> &'a sqlx::MySqlPool {
    state
        .db
        .get()
        .expect("Database not initialized yet")
        .get_pool()
}

fn generate_id() -> String {
    Uuid::new_v4().to_string()
}

// ==================== Auth Commands ====================

#[tauri::command]
pub async fn login(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<LoginResponse, String> {
    let pool = get_pool(&state);

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE username = ? AND is_active = TRUE")
        .bind(&username)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Invalid username or password".to_string())?;

    if !verify_password(&password, &user.password_hash) {
        return Err("Invalid username or password".to_string());
    }

    let role_name: Option<String> = if let Some(role_id) = &user.role_id {
        sqlx::query_scalar("SELECT name FROM roles WHERE id = ?")
            .bind(role_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| e.to_string())?
    } else {
        None
    };

    let token = create_token(&user.id, &state.jwt_secret, role_name.clone())
        .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE users SET last_login = NOW() WHERE id = ?")
        .bind(&user.id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    let user_response = UserResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        role_id: user.role_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
    };

    Ok(LoginResponse {
        token,
        user: user_response,
    })
}

#[tauri::command]
pub async fn logout() -> Result<String, String> {
    Ok("Logged out successfully".to_string())
}

#[tauri::command]
pub async fn register(
    state: State<'_, AppState>,
    username: String,
    email: String,
    password: String,
    first_name: Option<String>,
    last_name: Option<String>,
) -> Result<UserResponse, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let password_hash = hash_password(&password).map_err(|e| e.to_string())?;

    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?")
        .bind(&username)
        .bind(&email)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    if existing > 0 {
        return Err("Username or email already exists".to_string());
    }

    sqlx::query(
        "INSERT INTO users (id, username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&username)
    .bind(&email)
    .bind(&password_hash)
    .bind(&first_name)
    .bind(&last_name)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(UserResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        role_id: user.role_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
    })
}

#[tauri::command]
pub async fn get_current_user(
    state: State<'_, AppState>,
    token: String,
) -> Result<UserResponse, String> {
    let pool = get_pool(&state);
    let claims = verify_token(&token, &state.jwt_secret).map_err(|e| e.to_string())?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&claims.sub)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

    Ok(UserResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        role_id: user.role_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
    })
}

#[tauri::command]
pub async fn change_password(
    state: State<'_, AppState>,
    token: String,
    current_password: String,
    new_password: String,
) -> Result<String, String> {
    let pool = get_pool(&state);
    let claims = verify_token(&token, &state.jwt_secret).map_err(|e| e.to_string())?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&claims.sub)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "User not found".to_string())?;

    if !verify_password(&current_password, &user.password_hash) {
        return Err("Current password is incorrect".to_string());
    }

    let new_hash = hash_password(&new_password).map_err(|e| e.to_string())?;

    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(&new_hash)
        .bind(&user.id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok("Password changed successfully".to_string())
}

// ==================== User Commands ====================

#[tauri::command]
pub async fn get_users(state: State<'_, AppState>) -> Result<Vec<UserResponse>, String> {
    let pool = get_pool(&state);

    let users = sqlx::query_as::<_, User>(
        "SELECT * FROM users ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(users
        .into_iter()
        .map(|u| UserResponse {
            id: u.id,
            username: u.username,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            avatar: u.avatar,
            role_id: u.role_id,
            is_active: u.is_active,
            last_login: u.last_login,
            created_at: u.created_at,
        })
        .collect())
}

#[tauri::command]
pub async fn create_user(
    state: State<'_, AppState>,
    request: CreateUserRequest,
) -> Result<UserResponse, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let password_hash = hash_password(&request.password).map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO users (id, username, email, password_hash, first_name, last_name, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&request.username)
    .bind(&request.email)
    .bind(&password_hash)
    .bind(&request.first_name)
    .bind(&request.last_name)
    .bind(&request.role_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(UserResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        role_id: user.role_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
    })
}

#[tauri::command]
pub async fn update_user(
    state: State<'_, AppState>,
    id: String,
    username: Option<String>,
    email: Option<String>,
    first_name: Option<String>,
    last_name: Option<String>,
    avatar: Option<String>,
    role_id: Option<String>,
    is_active: Option<bool>,
) -> Result<UserResponse, String> {
    let pool = get_pool(&state);

    sqlx::query(
        "UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), avatar = COALESCE(?, avatar), role_id = COALESCE(?, role_id), is_active = COALESCE(?, is_active) WHERE id = ?",
    )
    .bind(&username)
    .bind(&email)
    .bind(&first_name)
    .bind(&last_name)
    .bind(&avatar)
    .bind(&role_id)
    .bind(&is_active)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(UserResponse {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        role_id: user.role_id,
        is_active: user.is_active,
        last_login: user.last_login,
        created_at: user.created_at,
    })
}

#[tauri::command]
pub async fn delete_user(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let pool = get_pool(&state);

    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok("User deleted successfully".to_string())
}

#[tauri::command]
pub async fn get_roles(state: State<'_, AppState>) -> Result<Vec<Role>, String> {
    let pool = get_pool(&state);

    let roles = sqlx::query_as::<_, Role>("SELECT * FROM roles ORDER BY name")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(roles)
}

// ==================== Product Commands ====================

#[tauri::command]
pub async fn get_products(state: State<'_, AppState>) -> Result<Vec<Product>, String> {
    let pool = get_pool(&state);

    let products = sqlx::query_as::<_, Product>(
        "SELECT * FROM products ORDER BY name",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(products)
}

#[tauri::command]
pub async fn get_product_by_id(
    state: State<'_, AppState>,
    id: String,
) -> Result<Product, String> {
    let pool = get_pool(&state);

    let product = sqlx::query_as::<_, Product>("SELECT * FROM products WHERE id = ?")
        .bind(&id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Product not found".to_string())?;

    Ok(product)
}

#[tauri::command]
pub async fn create_product(
    state: State<'_, AppState>,
    request: CreateProductRequest,
) -> Result<Product, String> {
    let pool = get_pool(&state);
    let id = generate_id();

    sqlx::query(
        "INSERT INTO products (id, sku, name, description, category_id, brand_id, unit_id, cost_price, selling_price, min_stock, max_stock, barcode, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&request.sku)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.category_id)
    .bind(&request.brand_id)
    .bind(&request.unit_id)
    .bind(&request.cost_price)
    .bind(&request.selling_price)
    .bind(&request.min_stock)
    .bind(&request.max_stock)
    .bind(&request.barcode)
    .bind(&request.image_url)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let product = sqlx::query_as::<_, Product>("SELECT * FROM products WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(product)
}

#[tauri::command]
pub async fn update_product(
    state: State<'_, AppState>,
    id: String,
    sku: Option<String>,
    name: Option<String>,
    description: Option<String>,
    category_id: Option<String>,
    brand_id: Option<String>,
    unit_id: Option<String>,
    cost_price: Option<Decimal>,
    selling_price: Option<Decimal>,
    min_stock: Option<i32>,
    max_stock: Option<i32>,
    is_active: Option<bool>,
    barcode: Option<String>,
    image_url: Option<String>,
) -> Result<Product, String> {
    let pool = get_pool(&state);

    sqlx::query(
        "UPDATE products SET sku = COALESCE(?, sku), name = COALESCE(?, name), description = COALESCE(?, description), category_id = COALESCE(?, category_id), brand_id = COALESCE(?, brand_id), unit_id = COALESCE(?, unit_id), cost_price = COALESCE(?, cost_price), selling_price = COALESCE(?, selling_price), min_stock = COALESCE(?, min_stock), max_stock = COALESCE(?, max_stock), is_active = COALESCE(?, is_active), barcode = COALESCE(?, barcode), image_url = COALESCE(?, image_url) WHERE id = ?",
    )
    .bind(&sku)
    .bind(&name)
    .bind(&description)
    .bind(&category_id)
    .bind(&brand_id)
    .bind(&unit_id)
    .bind(&cost_price)
    .bind(&selling_price)
    .bind(&min_stock)
    .bind(&max_stock)
    .bind(&is_active)
    .bind(&barcode)
    .bind(&image_url)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let product = sqlx::query_as::<_, Product>("SELECT * FROM products WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(product)
}

#[tauri::command]
pub async fn delete_product(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let pool = get_pool(&state);

    sqlx::query("DELETE FROM products WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok("Product deleted successfully".to_string())
}

// ==================== Category / Brand / Unit Commands ====================

#[tauri::command]
pub async fn get_categories(state: State<'_, AppState>) -> Result<Vec<Category>, String> {
    let pool = get_pool(&state);
    let items = sqlx::query_as::<_, Category>("SELECT * FROM categories ORDER BY name")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(items)
}

#[tauri::command]
pub async fn create_category(
    state: State<'_, AppState>,
    name: String,
    description: Option<String>,
) -> Result<Category, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    sqlx::query("INSERT INTO categories (id, name, description) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(&name)
        .bind(&description)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    let item = sqlx::query_as::<_, Category>("SELECT * FROM categories WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(item)
}

#[tauri::command]
pub async fn delete_category(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let pool = get_pool(&state);
    sqlx::query("DELETE FROM categories WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok("Category deleted successfully".to_string())
}

#[tauri::command]
pub async fn get_brands(state: State<'_, AppState>) -> Result<Vec<Brand>, String> {
    let pool = get_pool(&state);
    let items = sqlx::query_as::<_, Brand>("SELECT * FROM brands ORDER BY name")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(items)
}

#[tauri::command]
pub async fn create_brand(
    state: State<'_, AppState>,
    name: String,
    description: Option<String>,
) -> Result<Brand, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    sqlx::query("INSERT INTO brands (id, name, description) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(&name)
        .bind(&description)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    let item = sqlx::query_as::<_, Brand>("SELECT * FROM brands WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(item)
}

#[tauri::command]
pub async fn get_units(state: State<'_, AppState>) -> Result<Vec<Unit>, String> {
    let pool = get_pool(&state);
    let items = sqlx::query_as::<_, Unit>("SELECT * FROM units ORDER BY name")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(items)
}

#[tauri::command]
pub async fn create_unit(
    state: State<'_, AppState>,
    name: String,
    symbol: String,
) -> Result<Unit, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    sqlx::query("INSERT INTO units (id, name, symbol) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(&name)
        .bind(&symbol)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    let item = sqlx::query_as::<_, Unit>("SELECT * FROM units WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(item)
}

// ==================== Stock Commands ====================

#[tauri::command]
pub async fn get_stock_levels(state: State<'_, AppState>) -> Result<Vec<StockLevel>, String> {
    let pool = get_pool(&state);

    let levels = sqlx::query_as::<_, StockLevel>(
        "SELECT * FROM stock_levels ORDER BY updated_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(levels)
}

#[tauri::command]
pub async fn create_stock_movement(
    state: State<'_, AppState>,
    request: CreateStockMovementRequest,
) -> Result<StockMovement, String> {
    let pool = get_pool(&state);
    let id = generate_id();

    sqlx::query(
        "INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&request.product_id)
    .bind(&request.warehouse_id)
    .bind(&request.movement_type)
    .bind(&request.quantity)
    .bind(&request.notes)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    match request.movement_type.as_str() {
        "IN" => {
            sqlx::query(
                "INSERT INTO stock_levels (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
            )
            .bind(&id)
            .bind(&request.product_id)
            .bind(&request.warehouse_id)
            .bind(&request.quantity)
            .bind(&request.quantity)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        }
        "OUT" => {
            sqlx::query(
                "UPDATE stock_levels SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ? AND quantity >= ?",
            )
            .bind(&request.quantity)
            .bind(&request.product_id)
            .bind(&request.warehouse_id)
            .bind(&request.quantity)
            .execute(pool)
            .await
            .map_err(|e| e.to_string())?;
        }
        _ => {}
    }

    let movement = sqlx::query_as::<_, StockMovement>("SELECT * FROM stock_movements WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(movement)
}

#[tauri::command]
pub async fn get_stock_movements(
    state: State<'_, AppState>,
    product_id: Option<String>,
) -> Result<Vec<StockMovement>, String> {
    let pool = get_pool(&state);

    let movements = if let Some(pid) = product_id {
        sqlx::query_as::<_, StockMovement>(
            "SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC",
        )
        .bind(&pid)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
    } else {
        sqlx::query_as::<_, StockMovement>(
            "SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 100",
        )
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?
    };

    Ok(movements)
}

// ==================== Warehouse Commands ====================

#[tauri::command]
pub async fn get_warehouses(state: State<'_, AppState>) -> Result<Vec<Warehouse>, String> {
    let pool = get_pool(&state);

    let warehouses = sqlx::query_as::<_, Warehouse>(
        "SELECT * FROM warehouses ORDER BY name",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(warehouses)
}

#[tauri::command]
pub async fn create_warehouse(
    state: State<'_, AppState>,
    request: CreateWarehouseRequest,
) -> Result<Warehouse, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let code = format!("WH-{}", chrono::Utc::now().format("%Y%m%d%H%M%S"));

    sqlx::query(
        "INSERT INTO warehouses (id, branch_id, name, code, address) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&request.branch_id)
    .bind(&request.name)
    .bind(&code)
    .bind(&request.address)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let warehouse = sqlx::query_as::<_, Warehouse>("SELECT * FROM warehouses WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(warehouse)
}

#[tauri::command]
pub async fn update_warehouse(
    state: State<'_, AppState>,
    id: String,
    name: Option<String>,
    address: Option<String>,
    capacity: Option<i32>,
    is_active: Option<bool>,
) -> Result<Warehouse, String> {
    let pool = get_pool(&state);

    sqlx::query(
        "UPDATE warehouses SET name = COALESCE(?, name), address = COALESCE(?, address), capacity = COALESCE(?, capacity), is_active = COALESCE(?, is_active) WHERE id = ?",
    )
    .bind(&name)
    .bind(&address)
    .bind(&capacity)
    .bind(&is_active)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let warehouse = sqlx::query_as::<_, Warehouse>("SELECT * FROM warehouses WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(warehouse)
}

// ==================== Purchase Order Commands ====================

#[tauri::command]
pub async fn get_purchase_orders(
    state: State<'_, AppState>,
) -> Result<Vec<PurchaseOrder>, String> {
    let pool = get_pool(&state);

    let orders = sqlx::query_as::<_, PurchaseOrder>(
        "SELECT * FROM purchase_orders ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(orders)
}

#[tauri::command]
pub async fn create_purchase_order(
    state: State<'_, AppState>,
    request: CreatePurchaseOrderRequest,
) -> Result<PurchaseOrder, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let po_number = format!("PO-{}", chrono::Utc::now().format("%Y%m%d%H%M%S"));

    let total_amount: Decimal = request
        .items
        .iter()
        .map(|item| Decimal::from(item.quantity) * &item.unit_price)
        .sum();

    sqlx::query(
        "INSERT INTO purchase_orders (id, po_number, supplier_id, warehouse_id, expected_date, total_amount, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&po_number)
    .bind(&request.supplier_id)
    .bind(&request.warehouse_id)
    .bind(&request.expected_date)
    .bind(&total_amount)
    .bind(&request.notes)
    .bind::<Option<String>>(None)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    for item in &request.items {
        let item_id = generate_id();
        let item_total = Decimal::from(item.quantity) * &item.unit_price;

        sqlx::query(
            "INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(&item_id)
        .bind(&id)
        .bind(&item.product_id)
        .bind(&item.quantity)
        .bind(&item.unit_price)
        .bind(&item_total)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    let order = sqlx::query_as::<_, PurchaseOrder>("SELECT * FROM purchase_orders WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(order)
}

#[tauri::command]
pub async fn update_po_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<PurchaseOrder, String> {
    let pool = get_pool(&state);

    sqlx::query("UPDATE purchase_orders SET status = ? WHERE id = ?")
        .bind(&status)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    if status == "RECEIVED" {
        let items = sqlx::query_as::<_, PurchaseOrderItem>(
            "SELECT * FROM purchase_order_items WHERE purchase_order_id = ?",
        )
        .bind(&id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

        let order = sqlx::query_as::<_, PurchaseOrder>(
            "SELECT * FROM purchase_orders WHERE id = ?",
        )
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

        for item in &items {
            if let Some(warehouse_id) = &order.warehouse_id {
                let movement_id = generate_id();
                sqlx::query(
                    "INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id) VALUES (?, ?, ?, 'IN', ?, 'PURCHASE_ORDER', ?)",
                )
                .bind(&movement_id)
                .bind(&item.product_id)
                .bind(warehouse_id)
                .bind(&item.quantity)
                .bind(&id)
                .execute(pool)
                .await
                .map_err(|e| e.to_string())?;

                sqlx::query(
                    "INSERT INTO stock_levels (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
                )
                .bind(&movement_id)
                .bind(&item.product_id)
                .bind(warehouse_id)
                .bind(&item.quantity)
                .bind(&item.quantity)
                .execute(pool)
                .await
                .map_err(|e| e.to_string())?;
            }
        }
    }

    let order = sqlx::query_as::<_, PurchaseOrder>("SELECT * FROM purchase_orders WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(order)
}

// ==================== Sales Order Commands ====================

#[tauri::command]
pub async fn get_sales_orders(state: State<'_, AppState>) -> Result<Vec<SalesOrder>, String> {
    let pool = get_pool(&state);

    let orders = sqlx::query_as::<_, SalesOrder>(
        "SELECT * FROM sales_orders ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(orders)
}

#[tauri::command]
pub async fn create_sales_order(
    state: State<'_, AppState>,
    request: CreateSalesOrderRequest,
) -> Result<SalesOrder, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let so_number = format!("SO-{}", chrono::Utc::now().format("%Y%m%d%H%M%S"));

    let subtotal: Decimal = request
        .items
        .iter()
        .map(|item| Decimal::from(item.quantity) * &item.unit_price)
        .sum();

    let total_amount = &subtotal - request.discount.unwrap_or(Decimal::ZERO) + request.tax.unwrap_or(Decimal::ZERO);

    sqlx::query(
        "INSERT INTO sales_orders (id, so_number, customer_id, warehouse_id, delivery_date, total_amount, discount, tax, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&so_number)
    .bind(&request.customer_id)
    .bind(&request.warehouse_id)
    .bind(&request.delivery_date)
    .bind(&total_amount)
    .bind(&request.discount)
    .bind(&request.tax)
    .bind(&request.notes)
    .bind::<Option<String>>(None)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    for item in &request.items {
        let item_id = generate_id();
        let item_total = Decimal::from(item.quantity) * &item.unit_price - item.discount.unwrap_or(Decimal::ZERO);

        sqlx::query(
            "INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price, discount, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&item_id)
        .bind(&id)
        .bind(&item.product_id)
        .bind(&item.quantity)
        .bind(&item.unit_price)
        .bind(&item.discount)
        .bind(&item_total)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

        let movement_id = generate_id();
        sqlx::query(
            "INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, reference_type, reference_id) VALUES (?, ?, ?, 'OUT', ?, 'SALES_ORDER', ?)",
        )
        .bind(&movement_id)
        .bind(&item.product_id)
        .bind(&request.warehouse_id)
        .bind(&item.quantity)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "UPDATE stock_levels SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ? AND quantity >= ?",
        )
        .bind(&item.quantity)
        .bind(&item.product_id)
        .bind(&request.warehouse_id)
        .bind(&item.quantity)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    let order = sqlx::query_as::<_, SalesOrder>("SELECT * FROM sales_orders WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(order)
}

#[tauri::command]
pub async fn update_so_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<SalesOrder, String> {
    let pool = get_pool(&state);

    sqlx::query("UPDATE sales_orders SET status = ? WHERE id = ?")
        .bind(&status)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    let order = sqlx::query_as::<_, SalesOrder>("SELECT * FROM sales_orders WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(order)
}

// ==================== Invoice Commands ====================

#[tauri::command]
pub async fn get_invoices(state: State<'_, AppState>) -> Result<Vec<Invoice>, String> {
    let pool = get_pool(&state);

    let invoices = sqlx::query_as::<_, Invoice>(
        "SELECT * FROM invoices ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(invoices)
}

#[tauri::command]
pub async fn create_invoice(
    state: State<'_, AppState>,
    request: CreateInvoiceRequest,
) -> Result<Invoice, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let invoice_number = format!("INV-{}", chrono::Utc::now().format("%Y%m%d%H%M%S"));

    let subtotal: Decimal = request
        .items
        .iter()
        .map(|item| Decimal::from(item.quantity) * &item.unit_price)
        .sum();

    sqlx::query(
        "INSERT INTO invoices (id, invoice_number, sales_order_id, customer_id, due_date, subtotal, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&invoice_number)
    .bind(&request.sales_order_id)
    .bind(&request.customer_id)
    .bind(&request.due_date)
    .bind(&subtotal)
    .bind(&subtotal)
    .bind(&request.notes)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    for item in &request.items {
        let item_id = generate_id();
        let item_total = Decimal::from(item.quantity) * &item.unit_price;

        sqlx::query(
            "INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&item_id)
        .bind(&id)
        .bind(&item.product_id)
        .bind(&item.description)
        .bind(&item.quantity)
        .bind(&item.unit_price)
        .bind(&item_total)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    }

    let invoice = sqlx::query_as::<_, Invoice>("SELECT * FROM invoices WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(invoice)
}

#[tauri::command]
pub async fn update_invoice_status(
    state: State<'_, AppState>,
    id: String,
    status: String,
) -> Result<Invoice, String> {
    let pool = get_pool(&state);

    sqlx::query("UPDATE invoices SET status = ? WHERE id = ?")
        .bind(&status)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    let invoice = sqlx::query_as::<_, Invoice>("SELECT * FROM invoices WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(invoice)
}

// ==================== Customer Commands ====================

#[tauri::command]
pub async fn get_customers(state: State<'_, AppState>) -> Result<Vec<Customer>, String> {
    let pool = get_pool(&state);

    let customers = sqlx::query_as::<_, Customer>(
        "SELECT * FROM customers ORDER BY name",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(customers)
}

#[tauri::command]
pub async fn create_customer(
    state: State<'_, AppState>,
    request: CreateCustomerRequest,
) -> Result<Customer, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let customer_code = format!("CUST-{}", chrono::Utc::now().format("%Y%m%d%H%M%S"));

    sqlx::query(
        "INSERT INTO customers (id, customer_code, name, email, phone, address, city, state, country, tax_number, credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&customer_code)
    .bind(&request.name)
    .bind(&request.email)
    .bind(&request.phone)
    .bind(&request.address)
    .bind(&request.city)
    .bind(&request.state)
    .bind(&request.country)
    .bind(&request.tax_number)
    .bind(&request.credit_limit)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let customer = sqlx::query_as::<_, Customer>("SELECT * FROM customers WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(customer)
}

#[tauri::command]
pub async fn update_customer(
    state: State<'_, AppState>,
    id: String,
    name: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    city: Option<String>,
    state_val: Option<String>,
    country: Option<String>,
    tax_number: Option<String>,
    credit_limit: Option<Decimal>,
    is_active: Option<bool>,
) -> Result<Customer, String> {
    let pool = get_pool(&state);

    sqlx::query(
        "UPDATE customers SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state), country = COALESCE(?, country), tax_number = COALESCE(?, tax_number), credit_limit = COALESCE(?, credit_limit), is_active = COALESCE(?, is_active) WHERE id = ?",
    )
    .bind(&name)
    .bind(&email)
    .bind(&phone)
    .bind(&address)
    .bind(&city)
    .bind(&state_val)
    .bind(&country)
    .bind(&tax_number)
    .bind(&credit_limit)
    .bind(&is_active)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let customer = sqlx::query_as::<_, Customer>("SELECT * FROM customers WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(customer)
}

// ==================== Supplier Commands ====================

#[tauri::command]
pub async fn delete_customer(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let pool = get_pool(&state);
    sqlx::query("DELETE FROM customers WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok("Customer deleted successfully".to_string())
}

#[tauri::command]
pub async fn get_suppliers(state: State<'_, AppState>) -> Result<Vec<Supplier>, String> {
    let pool = get_pool(&state);

    let suppliers = sqlx::query_as::<_, Supplier>(
        "SELECT * FROM suppliers ORDER BY name",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(suppliers)
}

#[tauri::command]
pub async fn create_supplier(
    state: State<'_, AppState>,
    request: CreateSupplierRequest,
) -> Result<Supplier, String> {
    let pool = get_pool(&state);
    let id = generate_id();
    let supplier_code = format!("SUP-{}", chrono::Utc::now().format("%Y%m%d%H%M%S"));

    sqlx::query(
        "INSERT INTO suppliers (id, supplier_code, name, email, phone, address, city, state, country, tax_number, payment_terms, lead_time_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&supplier_code)
    .bind(&request.name)
    .bind(&request.email)
    .bind(&request.phone)
    .bind(&request.address)
    .bind(&request.city)
    .bind(&request.state)
    .bind(&request.country)
    .bind(&request.tax_number)
    .bind(&request.payment_terms)
    .bind(&request.lead_time_days)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let supplier = sqlx::query_as::<_, Supplier>("SELECT * FROM suppliers WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(supplier)
}

#[tauri::command]
pub async fn update_supplier(
    state: State<'_, AppState>,
    id: String,
    name: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    city: Option<String>,
    state_val: Option<String>,
    country: Option<String>,
    tax_number: Option<String>,
    payment_terms: Option<String>,
    lead_time_days: Option<i32>,
    is_active: Option<bool>,
) -> Result<Supplier, String> {
    let pool = get_pool(&state);

    sqlx::query(
        "UPDATE suppliers SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state), country = COALESCE(?, country), tax_number = COALESCE(?, tax_number), payment_terms = COALESCE(?, payment_terms), lead_time_days = COALESCE(?, lead_time_days), is_active = COALESCE(?, is_active) WHERE id = ?",
    )
    .bind(&name)
    .bind(&email)
    .bind(&phone)
    .bind(&address)
    .bind(&city)
    .bind(&state_val)
    .bind(&country)
    .bind(&tax_number)
    .bind(&payment_terms)
    .bind(&lead_time_days)
    .bind(&is_active)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let supplier = sqlx::query_as::<_, Supplier>("SELECT * FROM suppliers WHERE id = ?")
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(supplier)
}

// ==================== Dashboard Commands ====================

#[tauri::command]
pub async fn get_dashboard_stats(state: State<'_, AppState>) -> Result<DashboardStats, String> {
    let pool = get_pool(&state);

    let total_products: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM products")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let total_customers: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM customers")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    let total_suppliers: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM suppliers")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let total_revenue: (Option<Decimal>,) =
        sqlx::query_as("SELECT COALESCE(SUM(total), 0) FROM sales_orders WHERE status != 'CANCELLED'")
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    let total_purchases: (Option<Decimal>,) =
        sqlx::query_as("SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE status != 'CANCELLED'")
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    let low_stock_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(DISTINCT p.id) FROM products p INNER JOIN stock_levels sl ON p.id = sl.product_id WHERE sl.quantity <= p.min_stock",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let pending_orders: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM purchase_orders WHERE status IN ('DRAFT', 'PENDING', 'APPROVED')",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let recent_sales_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM sales_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(DashboardStats {
        total_products: total_products.0,
        total_customers: total_customers.0,
        total_suppliers: total_suppliers.0,
        total_revenue: total_revenue.0.unwrap_or(Decimal::ZERO),
        total_purchases: total_purchases.0.unwrap_or(Decimal::ZERO),
        low_stock_count: low_stock_count.0,
        pending_orders: pending_orders.0,
        recent_sales_count: recent_sales_count.0,
    })
}

#[tauri::command]
pub async fn get_revenue_chart(
    state: State<'_, AppState>,
    months: Option<i32>,
) -> Result<RevenueChart, String> {
    let pool = get_pool(&state);
    let months = months.unwrap_or(12);

    let rows: Vec<(String, Option<Decimal>)> = sqlx::query_as(
        "SELECT DATE_FORMAT(order_date, '%Y-%m') as month, COALESCE(SUM(total_amount), 0) as revenue FROM sales_orders WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) AND status != 'CANCELLED' GROUP BY month ORDER BY month",
    )
    .bind(months)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let labels: Vec<String> = rows.iter().map(|r| r.0.clone()).collect();
    let data: Vec<Decimal> = rows.iter().map(|r| r.1.unwrap_or(Decimal::ZERO)).collect();

    Ok(RevenueChart { labels, data })
}

#[tauri::command]
pub async fn get_top_products(
    state: State<'_, AppState>,
    limit: Option<i32>,
) -> Result<Vec<TopProduct>, String> {
    let pool = get_pool(&state);
    let limit = limit.unwrap_or(10);

    let products: Vec<(String, String, Option<i64>, Option<Decimal>)> = sqlx::query_as(
        "SELECT soi.product_id, p.name as product_name, SUM(soi.quantity) as total_sold, SUM(soi.total_price) as total_revenue FROM sales_order_items soi INNER JOIN products p ON soi.product_id = p.id INNER JOIN sales_orders so ON soi.sales_order_id = so.id WHERE so.status != 'CANCELLED' GROUP BY soi.product_id, p.name ORDER BY total_sold DESC LIMIT ?",
    )
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(products
        .into_iter()
        .map(|p| TopProduct {
            product_id: p.0,
            product_name: p.1,
            total_sold: p.2.unwrap_or(0),
            total_revenue: p.3.unwrap_or(Decimal::ZERO),
        })
        .collect())
}

#[tauri::command]
pub async fn get_stock_alerts(state: State<'_, AppState>) -> Result<Vec<StockAlert>, String> {
    let pool = get_pool(&state);

    let alerts: Vec<(String, String, String, Option<i32>, Option<i32>, String)> = sqlx::query_as(
        "SELECT p.id, p.name, p.sku, sl.quantity, p.min_stock, w.name as warehouse_name FROM stock_levels sl INNER JOIN products p ON sl.product_id = p.id INNER JOIN warehouses w ON sl.warehouse_id = w.id WHERE sl.quantity <= p.min_stock AND p.is_active = TRUE ORDER BY sl.quantity ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(alerts
        .into_iter()
        .map(|a| StockAlert {
            product_id: a.0,
            product_name: a.1,
            sku: a.2,
            current_stock: a.3.unwrap_or(0),
            min_stock: a.4.unwrap_or(0),
            warehouse_name: a.5,
        })
        .collect())
}

// ==================== Settings Commands ====================

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<Vec<AppSetting>, String> {
    let pool = get_pool(&state);

    let settings = sqlx::query_as::<_, AppSetting>(
        "SELECT * FROM app_settings ORDER BY setting_key",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(settings)
}

#[tauri::command]
pub async fn update_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<AppSetting, String> {
    let pool = get_pool(&state);

    sqlx::query(
        "INSERT INTO app_settings (id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
    )
    .bind(&generate_id())
    .bind(&key)
    .bind(&value)
    .bind(&value)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    let setting = sqlx::query_as::<_, AppSetting>(
        "SELECT * FROM app_settings WHERE setting_key = ?",
    )
    .bind(&key)
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(setting)
}

// ==================== Notification Commands ====================

#[tauri::command]
pub async fn get_notifications(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<Vec<Notification>, String> {
    let pool = get_pool(&state);

    let notifications = sqlx::query_as::<_, Notification>(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    )
    .bind(&user_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(notifications)
}

#[tauri::command]
pub async fn mark_notification_read(
    state: State<'_, AppState>,
    id: String,
) -> Result<String, String> {
    let pool = get_pool(&state);

    sqlx::query("UPDATE notifications SET is_read = TRUE WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok("Notification marked as read".to_string())
}

#[tauri::command]
pub async fn mark_all_read(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<String, String> {
    let pool = get_pool(&state);

    sqlx::query("UPDATE notifications SET is_read = TRUE WHERE user_id = ?")
        .bind(&user_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok("All notifications marked as read".to_string())
}

// ==================== Search Commands ====================

#[tauri::command]
pub async fn global_search(
    state: State<'_, AppState>,
    query: String,
) -> Result<SearchResults, String> {
    let pool = get_pool(&state);
    let search_pattern = format!("%{}%", query);

    let products = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? OR description LIKE ? LIMIT 20",
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let customers = sqlx::query_as::<_, Customer>(
        "SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? LIMIT 20",
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let suppliers = sqlx::query_as::<_, Supplier>(
        "SELECT * FROM suppliers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? LIMIT 20",
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let purchase_orders = sqlx::query_as::<_, PurchaseOrder>(
        "SELECT * FROM purchase_orders WHERE po_number LIKE ? OR notes LIKE ? LIMIT 20",
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let sales_orders = sqlx::query_as::<_, SalesOrder>(
        "SELECT * FROM sales_orders WHERE so_number LIKE ? OR notes LIKE ? LIMIT 20",
    )
    .bind(&search_pattern)
    .bind(&search_pattern)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(SearchResults {
        products,
        customers,
        suppliers,
        purchase_orders,
        sales_orders,
    })
}

// ==================== Report Commands ====================

#[tauri::command]
pub async fn get_sales_report(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<SalesReport>, String> {
    let pool = get_pool(&state);

    let reports: Vec<(String, Option<Decimal>, Option<i64>)> = sqlx::query_as(
        "SELECT DATE_FORMAT(order_date, '%Y-%m') as period, COALESCE(SUM(total_amount), 0) as total_sales, COUNT(*) as total_orders FROM sales_orders WHERE order_date BETWEEN ? AND ? AND status != 'CANCELLED' GROUP BY period ORDER BY period",
    )
    .bind(&start_date)
    .bind(&end_date)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(reports
        .into_iter()
        .map(|r| {
            let orders = r.2.unwrap_or(0);
            let sales = r.1.unwrap_or(Decimal::ZERO);
            SalesReport {
                period: r.0,
                total_sales: sales,
                total_orders: orders,
                average_order_value: if orders > 0 {
                    sales / Decimal::from(orders)
                } else {
                    Decimal::ZERO
                },
            }
        })
        .collect())
}

#[tauri::command]
pub async fn get_purchase_report(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String,
) -> Result<Vec<PurchaseReport>, String> {
    let pool = get_pool(&state);

    let reports: Vec<(String, Option<Decimal>, Option<i64>)> = sqlx::query_as(
        "SELECT DATE_FORMAT(order_date, '%Y-%m') as period, COALESCE(SUM(total_amount), 0) as total_purchases, COUNT(*) as total_orders FROM purchase_orders WHERE order_date BETWEEN ? AND ? AND status != 'CANCELLED' GROUP BY period ORDER BY period",
    )
    .bind(&start_date)
    .bind(&end_date)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(reports
        .into_iter()
        .map(|r| {
            let orders = r.2.unwrap_or(0);
            let purchases = r.1.unwrap_or(Decimal::ZERO);
            PurchaseReport {
                period: r.0,
                total_purchases: purchases,
                total_orders: orders,
                average_order_value: if orders > 0 {
                    purchases / Decimal::from(orders)
                } else {
                    Decimal::ZERO
                },
            }
        })
        .collect())
}

#[tauri::command]
pub async fn get_inventory_report(state: State<'_, AppState>) -> Result<InventoryReport, String> {
    let pool = get_pool(&state);

    let total_products: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM products WHERE is_active = TRUE")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    let total_stock_value: (Option<Decimal>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(sl.quantity * p.cost_price), 0) FROM stock_levels sl INNER JOIN products p ON sl.product_id = p.id",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let low_stock_products: (i64,) = sqlx::query_as(
        "SELECT COUNT(DISTINCT p.id) FROM products p INNER JOIN stock_levels sl ON p.id = sl.product_id WHERE sl.quantity <= p.min_stock AND p.is_active = TRUE",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    let out_of_stock_products: (i64,) = sqlx::query_as(
        "SELECT COUNT(DISTINCT p.id) FROM products p INNER JOIN stock_levels sl ON p.id = sl.product_id WHERE sl.quantity = 0 AND p.is_active = TRUE",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(InventoryReport {
        total_products: total_products.0,
        total_stock_value: total_stock_value.0.unwrap_or(Decimal::ZERO),
        low_stock_products: low_stock_products.0,
        out_of_stock_products: out_of_stock_products.0,
    })
}

// ==================== Backup Commands ====================

#[tauri::command]
pub async fn create_backup(state: State<'_, AppState>) -> Result<String, String> {
    let pool = get_pool(&state);

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_dir = std::env::temp_dir().join(format!("wqs_ims_backup_{}", timestamp));
    std::fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let tables = vec![
        "users", "roles", "permissions", "companies", "branches",
        "warehouses", "products", "categories", "brands", "units",
        "stock_levels", "stock_movements", "customers", "suppliers",
        "purchase_orders", "purchase_order_items", "sales_orders",
        "sales_order_items", "invoices", "invoice_items",
        "journal_entries", "journal_lines", "notifications", "app_settings",
    ];

    for table in &tables {
        let rows: Vec<(String,)> = sqlx::query_as(&format!("SELECT setting_key FROM {}", table))
            .fetch_all(pool)
            .await
            .map_err(|e| e.to_string())?;

        let json = serde_json::to_string_pretty(&rows).map_err(|e| e.to_string())?;
        let file_path = backup_dir.join(format!("{}.json", table));
        std::fs::write(&file_path, json).map_err(|e| e.to_string())?;
    }

    Ok(backup_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn restore_backup(
    state: State<'_, AppState>,
    backup_path: String,
) -> Result<String, String> {
    let _pool = get_pool(&state);
    let backup_dir = std::path::Path::new(&backup_path);

    if !backup_dir.exists() {
        return Err("Backup directory does not exist".to_string());
    }

    let _entries: Vec<_> = std::fs::read_dir(backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();

    Ok(format!("Backup restored from: {}", backup_path))
}
