import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import type { Product } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useAddToCart } from '../../hooks/useApi';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const addToCartMutation = useAddToCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      toast.error(t('auth.signIn'));
      return;
    }

    try {
      await addToCartMutation.mutateAsync({
        userId: user.id,
        productId: product.id,
        quantity: 1
      });
      toast.success(t('cart.itemAdded'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error(t('auth.signIn'));
      return;
    }

    // TODO: Implement wishlist functionality
    toast.success(t('wishlist.itemAdded'));
  };

  const discountPercentage = product.compare_price 
    ? Math.round(((product.compare_price - product.base_price) / product.compare_price) * 100)
    : 0;

  const isOutOfStock = product.inventory && product.inventory.quantity <= 0;

  return (
    <div className={`group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 ${className}`}>
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Eye className="w-12 h-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {product.is_featured && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                {t('product.featured')}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                -{discountPercentage}%
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                {t('product.outOfStock')}
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleAddToWishlist}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              title={t('product.addToWishlist')}
            >
              <Heart className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Quick add to cart */}
          {!isOutOfStock && (
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4 inline mr-2" />
                {addToCartMutation.isPending ? t('common.loading') : t('product.addToCart')}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Vendor */}
          {product.vendor && (
            <p className="text-xs text-gray-500 mb-1">
              {product.vendor.business_name}
            </p>
          )}

          {/* Title */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">(24)</span>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.base_price.toFixed(2)}
            </span>
            {product.compare_price && product.compare_price > product.base_price && (
              <span className="text-sm text-gray-500 line-through">
                ${product.compare_price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock status */}
          {product.inventory && (
            <div className="mt-2">
              {product.inventory.quantity > 0 ? (
                <span className="text-xs text-green-600">
                  {product.inventory.quantity > 10 
                    ? t('product.inStock')
                    : `${t('product.lowStock')} (${product.inventory.quantity})`
                  }
                </span>
              ) : (
                <span className="text-xs text-red-600">
                  {t('product.outOfStock')}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};