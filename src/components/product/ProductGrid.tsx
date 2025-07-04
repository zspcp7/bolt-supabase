import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  error,
  className = ''
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700 underline"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500 text-lg">{t('common.noResults')}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};