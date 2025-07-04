import { supabase, handleSupabaseError } from '../lib/supabase';
import type { 
  User, 
  Product, 
  Category, 
  Vendor, 
  Order, 
  ShoppingCart, 
  Wishlist, 
  Review,
  SiteSettings,
  PaginatedResponse 
} from '../types';

// Generic API service class
class ApiService {
  // Products
  async getProducts(params?: {
    category_id?: string;
    vendor_id?: string;
    is_featured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(*),
          category:categories(*),
          variants:product_variants(*),
          inventory(*)
        `)
        .eq('is_active', true)
        .is('deleted_at', null);

      if (params?.category_id) {
        query = query.eq('category_id', params.category_id);
      }

      if (params?.vendor_id) {
        query = query.eq('vendor_id', params.vendor_id);
      }

      if (params?.is_featured) {
        query = query.eq('is_featured', true);
      }

      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 12;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  async getProduct(slug: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(*),
          category:categories(*),
          variants:product_variants(*),
          inventory(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order');

      if (error) throw error;

      // Build category tree
      const categories = data || [];
      const categoryMap = new Map();
      const rootCategories: Category[] = [];

      // First pass: create map
      categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });

      // Second pass: build tree
      categories.forEach(cat => {
        const category = categoryMap.get(cat.id);
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      return rootCategories;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          user:users(*)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('business_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  // Shopping Cart
  async getCartItems(userId: string): Promise<ShoppingCart[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_carts')
        .select(`
          *,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  async addToCart(userId: string, productId: string, variantId?: string, quantity: number = 1): Promise<ShoppingCart> {
    try {
      const { data, error } = await supabase
        .from('shopping_carts')
        .upsert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId,
          quantity
        }, {
          onConflict: 'user_id,product_id,variant_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<ShoppingCart> {
    try {
      const { data, error } = await supabase
        .from('shopping_carts')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  async removeFromCart(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shopping_carts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  // Wishlist
  async getWishlistItems(userId: string): Promise<Wishlist[]> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  async addToWishlist(userId: string, productId: string, variantId?: string): Promise<Wishlist> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .insert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  async removeFromWishlist(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  // Reviews
  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(first_name, last_name, avatar_url)
        `)
        .eq('product_id', productId)
        .eq('is_approved', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  // Site Settings
  async getSiteSettings(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .is('user_id', null); // Global settings

      if (error) throw error;

      const settings: Record<string, any> = {};
      (data || []).forEach(setting => {
        if (!settings[setting.category]) {
          settings[setting.category] = {};
        }
        settings[setting.category][setting.key] = setting.value;
      });

      return settings;
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  // User Orders
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          status:order_status(*),
          items:order_items(
            *,
            product:products(*),
            variant:product_variants(*),
            vendor:vendors(*)
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }
}

export const apiService = new ApiService();