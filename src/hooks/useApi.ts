import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { Product, Category, Vendor, ShoppingCart, Wishlist, Review } from '../types';

// Products
export const useProducts = (params?: Parameters<typeof apiService.getProducts>[0]) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiService.getProduct(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Vendors
export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: () => apiService.getVendors(),
    staleTime: 10 * 60 * 1000,
  });
};

// Shopping Cart
export const useCartItems = (userId?: string) => {
  return useQuery({
    queryKey: ['cart', userId],
    queryFn: () => apiService.getCartItems(userId!),
    enabled: !!userId,
    staleTime: 0, // Always fresh
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, productId, variantId, quantity }: {
      userId: string;
      productId: string;
      variantId?: string;
      quantity?: number;
    }) => apiService.addToCart(userId, productId, variantId, quantity),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.userId] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => 
      apiService.updateCartItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.removeFromCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

// Wishlist
export const useWishlistItems = (userId?: string) => {
  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn: () => apiService.getWishlistItems(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, productId, variantId }: {
      userId: string;
      productId: string;
      variantId?: string;
    }) => apiService.addToWishlist(userId, productId, variantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', variables.userId] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.removeFromWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

// Reviews
export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => apiService.getProductReviews(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
};

// Site Settings
export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => apiService.getSiteSettings(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// User Orders
export const useUserOrders = (userId?: string) => {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => apiService.getUserOrders(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};