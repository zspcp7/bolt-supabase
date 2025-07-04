export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  role_id?: string;
  role?: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  name: 'super_admin' | 'admin' | 'vendor' | 'seller' | 'buyer' | 'visitor';
  description?: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  base_price: number;
  compare_price?: number;
  cost_price?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  images: string[];
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  is_digital: boolean;
  requires_shipping: boolean;
  is_active: boolean;
  is_featured: boolean;
  vendor?: Vendor;
  category?: Category;
  variants?: ProductVariant[];
  inventory?: Inventory;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  image_url?: string;
  attributes: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: 'individual' | 'company' | 'corporation';
  tax_id?: string;
  business_email?: string;
  business_phone?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  is_verified: boolean;
  is_active: boolean;
  commission_rate: number;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  location?: string;
  notes?: string;
  last_restocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  status_id: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  billing_address?: Record<string, any>;
  shipping_address?: Record<string, any>;
  notes?: string;
  internal_notes?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  customer?: User;
  status?: OrderStatus;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderStatus {
  id: string;
  name: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'returned';
  description?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  vendor_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot?: Record<string, any>;
  product?: Product;
  variant?: ProductVariant;
  vendor?: Vendor;
}

export interface ShoppingCart {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
  added_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  notes?: string;
  product?: Product;
  variant?: ProductVariant;
  added_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  content?: string;
  images: string[];
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  user?: User;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  category: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}