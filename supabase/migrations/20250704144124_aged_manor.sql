/*
  # Multi-Vendor E-commerce Platform Database Schema

  This migration creates a comprehensive database schema for a multi-vendor e-commerce platform.

  ## 1. Authentication & Authorization Tables
    - `user_roles` - Define system roles (super_admin, admin, vendor, seller, buyer, visitor)
    - `users` - Extended user profiles beyond Supabase auth
    - `user_permissions` - Role-based permissions system
    - `audit_logs` - System audit trail

  ## 2. Product Management Tables
    - `vendors` - Vendor/seller information
    - `categories` - Product categories with hierarchy
    - `products` - Main product catalog
    - `product_variants` - Product variations (size, color, etc.)
    - `inventory` - Stock management

  ## 3. Order System Tables
    - `order_status` - Order status definitions
    - `orders` - Customer orders
    - `order_items` - Individual items in orders
    - `shipping` - Shipping information
    - `payments` - Payment records
    - `transactions` - Financial transactions

  ## 4. Customer Data Tables
    - `customer_profiles` - Extended customer information
    - `addresses` - Customer addresses
    - `preferences` - Customer preferences
    - `shopping_carts` - Shopping cart items
    - `wishlists` - Customer wishlists
    - `reviews` - Product reviews
    - `ratings` - Product ratings

  ## 5. Security Features
    - Row Level Security (RLS) enabled on all tables
    - Comprehensive RLS policies for different user roles
    - Soft delete functionality
    - Audit logging triggers
    - Data validation constraints
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- AUTHENTICATION & AUTHORIZATION TABLES
-- =============================================

-- User roles lookup table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL CHECK (name IN ('super_admin', 'admin', 'vendor', 'seller', 'buyer', 'visitor')),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extended user profiles
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES user_roles(id) ON DELETE SET NULL,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  phone text CHECK (phone ~ '^[\+]?[1-9][\d]{0,15}$'),
  avatar_url text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  last_login_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  resource text,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission, resource)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- PRODUCT MANAGEMENT TABLES
-- =============================================

-- Vendors/Sellers
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text CHECK (business_type IN ('individual', 'company', 'corporation')),
  tax_id text,
  business_email text CHECK (business_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  business_phone text CHECK (business_phone ~ '^[\+]?[1-9][\d]{0,15}$'),
  website_url text,
  description text,
  logo_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  commission_rate decimal(5,4) DEFAULT 0.1000 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product categories with hierarchy
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  sku text UNIQUE,
  base_price decimal(12,2) NOT NULL CHECK (base_price >= 0),
  compare_price decimal(12,2) CHECK (compare_price >= base_price),
  cost_price decimal(12,2) CHECK (cost_price >= 0),
  weight decimal(8,3) CHECK (weight >= 0),
  dimensions jsonb, -- {length, width, height, unit}
  images jsonb DEFAULT '[]'::jsonb,
  tags text[],
  meta_title text,
  meta_description text,
  is_digital boolean DEFAULT false,
  requires_shipping boolean DEFAULT true,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text UNIQUE,
  price decimal(12,2) NOT NULL CHECK (price >= 0),
  compare_price decimal(12,2) CHECK (compare_price >= price),
  cost_price decimal(12,2) CHECK (cost_price >= 0),
  weight decimal(8,3) CHECK (weight >= 0),
  dimensions jsonb,
  image_url text,
  attributes jsonb DEFAULT '{}'::jsonb, -- {color: "red", size: "L"}
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory management
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity integer DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold integer DEFAULT 5 CHECK (low_stock_threshold >= 0),
  track_inventory boolean DEFAULT true,
  allow_backorder boolean DEFAULT false,
  location text,
  notes text,
  last_restocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, variant_id)
);

-- =============================================
-- ORDER SYSTEM TABLES
-- =============================================

-- Order status lookup
CREATE TABLE IF NOT EXISTS order_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL CHECK (name IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned')),
  description text,
  color text DEFAULT '#6B7280',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status_id uuid REFERENCES order_status(id) ON DELETE SET NULL,
  subtotal decimal(12,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount decimal(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount decimal(12,2) DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount decimal(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount decimal(12,2) NOT NULL CHECK (total_amount >= 0),
  currency text DEFAULT 'USD' CHECK (length(currency) = 3),
  billing_address jsonb,
  shipping_address jsonb,
  notes text,
  internal_notes text,
  cancelled_at timestamptz,
  cancelled_reason text,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(12,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(12,2) NOT NULL CHECK (total_price >= 0),
  product_snapshot jsonb, -- Store product details at time of order
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shipping information
CREATE TABLE IF NOT EXISTS shipping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  carrier text,
  service text,
  tracking_number text,
  tracking_url text,
  estimated_delivery timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  shipping_cost decimal(12,2) CHECK (shipping_cost >= 0),
  weight decimal(8,3) CHECK (weight >= 0),
  dimensions jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  payment_method text NOT NULL CHECK (payment_method IN ('credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery')),
  payment_provider text,
  provider_payment_id text,
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'USD' CHECK (length(currency) = 3),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  gateway_response jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('sale', 'refund', 'commission', 'payout', 'fee')),
  amount decimal(12,2) NOT NULL,
  currency text DEFAULT 'USD' CHECK (length(currency) = 3),
  description text,
  reference_id text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- CUSTOMER DATA TABLES
-- =============================================

-- Customer profiles (extends users table)
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  preferred_language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  marketing_consent boolean DEFAULT false,
  loyalty_points integer DEFAULT 0 CHECK (loyalty_points >= 0),
  total_orders integer DEFAULT 0 CHECK (total_orders >= 0),
  total_spent decimal(12,2) DEFAULT 0 CHECK (total_spent >= 0),
  average_order_value decimal(12,2) DEFAULT 0 CHECK (average_order_value >= 0),
  last_order_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text DEFAULT 'shipping' CHECK (type IN ('billing', 'shipping', 'both')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state_province text,
  postal_code text CHECK (postal_code ~ '^[A-Za-z0-9\s\-]{3,10}$'),
  country text NOT NULL CHECK (length(country) = 2), -- ISO country code
  phone text CHECK (phone ~ '^[\+]?[1-9][\d]{0,15}$'),
  is_default boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer preferences
CREATE TABLE IF NOT EXISTS preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, key)
);

-- Shopping carts
CREATE TABLE IF NOT EXISTS shopping_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  notes text,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Product reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  images jsonb DEFAULT '[]'::jsonb,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  helpful_count integer DEFAULT 0 CHECK (helpful_count >= 0),
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);

-- Product ratings (separate from reviews for performance)
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Product-related indexes
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active) WHERE is_active = true;

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);

-- Order-related indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_id ON orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);

-- Customer data indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved) WHERE is_approved = true;

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT ur.name 
    FROM users u 
    JOIN user_roles ur ON u.role_id = ur.id 
    WHERE u.id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User roles policies
CREATE POLICY "Super admins can manage all user roles" ON user_roles
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Everyone can view active user roles" ON user_roles
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Users policies
CREATE POLICY "Super admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Admins can manage non-admin users" ON users
  FOR ALL TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin' AND 
    get_user_role(id) NOT IN ('super_admin', 'admin')
  );

CREATE POLICY "Users can view and update their own profile" ON users
  FOR ALL TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Vendors can view customer profiles" ON users
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('vendor', 'seller') AND
    get_user_role(id) = 'buyer'
  );

-- Vendors policies
CREATE POLICY "Super admins and admins can manage all vendors" ON vendors
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Vendors can manage their own profile" ON vendors
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view active vendors" ON vendors
  FOR SELECT TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Categories policies
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Everyone can view active categories" ON categories
  FOR SELECT TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Products policies
CREATE POLICY "Admins can manage all products" ON products
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Vendors can manage their own products" ON products
  FOR ALL TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('vendor', 'seller') AND
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Everyone can view active products" ON products
  FOR SELECT TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Product variants policies
CREATE POLICY "Admins can manage all product variants" ON product_variants
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Vendors can manage their product variants" ON product_variants
  FOR ALL TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('vendor', 'seller') AND
    product_id IN (
      SELECT p.id FROM products p 
      JOIN vendors v ON p.vendor_id = v.id 
      WHERE v.user_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view active product variants" ON product_variants
  FOR SELECT TO authenticated
  USING (is_active = true AND deleted_at IS NULL);

-- Inventory policies
CREATE POLICY "Admins can manage all inventory" ON inventory
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Vendors can manage their inventory" ON inventory
  FOR ALL TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('vendor', 'seller') AND
    product_id IN (
      SELECT p.id FROM products p 
      JOIN vendors v ON p.vendor_id = v.id 
      WHERE v.user_id = auth.uid()
    )
  );

-- Orders policies
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Customers can view their own orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Vendors can view orders containing their products" ON orders
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('vendor', 'seller') AND
    id IN (
      SELECT DISTINCT oi.order_id FROM order_items oi
      JOIN vendors v ON oi.vendor_id = v.id
      WHERE v.user_id = auth.uid()
    )
  );

-- Order items policies
CREATE POLICY "Admins can manage all order items" ON order_items
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Customers can view their order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

CREATE POLICY "Vendors can view their order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) IN ('vendor', 'seller') AND
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Customer profiles policies
CREATE POLICY "Users can manage their own customer profile" ON customer_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customer profiles" ON customer_profiles
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

-- Addresses policies
CREATE POLICY "Users can manage their own addresses" ON addresses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Shopping carts policies
CREATE POLICY "Users can manage their own shopping cart" ON shopping_carts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Wishlists policies
CREATE POLICY "Users can manage their own wishlist" ON wishlists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "Users can manage their own reviews" ON reviews
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view approved reviews" ON reviews
  FOR SELECT TO authenticated
  USING (is_approved = true AND deleted_at IS NULL);

-- Ratings policies
CREATE POLICY "Users can manage their own ratings" ON ratings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view ratings" ON ratings
  FOR SELECT TO authenticated
  USING (true);

-- Audit logs policies
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Admins can view non-admin audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin' AND
    (user_id IS NULL OR get_user_role(user_id) NOT IN ('super_admin', 'admin'))
  );

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_status_updated_at BEFORE UPDATE ON order_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_updated_at BEFORE UPDATE ON shipping FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_profiles_updated_at BEFORE UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_carts_updated_at BEFORE UPDATE ON shopping_carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUDIT LOGGING TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendors AFTER INSERT OR UPDATE OR DELETE ON vendors FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- INSERT INITIAL DATA
-- =============================================

-- Insert default user roles
INSERT INTO user_roles (name, description) VALUES
  ('super_admin', 'Full system access and control'),
  ('admin', 'Administrative access to most features'),
  ('vendor', 'Can manage their own store and products'),
  ('seller', 'Can sell products through vendors'),
  ('buyer', 'Can purchase products'),
  ('visitor', 'Can browse products without purchasing')
ON CONFLICT (name) DO NOTHING;

-- Insert default order statuses
INSERT INTO order_status (name, description, color, sort_order) VALUES
  ('pending', 'Order placed, awaiting confirmation', '#F59E0B', 1),
  ('confirmed', 'Order confirmed and being prepared', '#3B82F6', 2),
  ('processing', 'Order is being processed', '#8B5CF6', 3),
  ('shipped', 'Order has been shipped', '#06B6D4', 4),
  ('delivered', 'Order has been delivered', '#10B981', 5),
  ('cancelled', 'Order has been cancelled', '#EF4444', 6),
  ('refunded', 'Order has been refunded', '#F97316', 7),
  ('returned', 'Order has been returned', '#84CC16', 8)
ON CONFLICT (name) DO NOTHING;