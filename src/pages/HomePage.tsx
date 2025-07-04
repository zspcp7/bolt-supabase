import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Truck, HeadphonesIcon } from 'lucide-react';
import { ProductGrid } from '../components/product/ProductGrid';
import { useProducts, useCategories } from '../hooks/useApi';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  
  const { data: featuredProducts, isLoading: featuredLoading } = useProducts({ 
    is_featured: true, 
    limit: 8 
  });
  
  const { data: newProducts, isLoading: newLoading } = useProducts({ 
    limit: 8 
  });
  
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('navigation.home')} to Quality Products
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover amazing products from trusted vendors worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                {t('navigation.products')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/vendors"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                {t('navigation.vendors')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Marketplace?
            </h2>
            <p className="text-lg text-gray-600">
              We provide the best shopping experience with trusted vendors and quality products
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Shopping</h3>
              <p className="text-gray-600">Your data and payments are protected with enterprise-grade security</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable shipping from our network of trusted vendors</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">Curated selection of high-quality products from verified vendors</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support to help with any questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('navigation.categories')}
            </h2>
            <p className="text-lg text-gray-600">
              Browse our wide range of product categories
            </p>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories?.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.slug}`}
                  className="group text-center"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link
              to="/categories"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('category.all')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('product.featured')}
            </h2>
            <p className="text-lg text-gray-600">
              Hand-picked products that our customers love
            </p>
          </div>
          
          <ProductGrid
            products={featuredProducts?.data || []}
            isLoading={featuredLoading}
          />
          
          <div className="text-center mt-8">
            <Link
              to="/products?featured=true"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('product.viewDetails')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* New Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('product.new')}
            </h2>
            <p className="text-lg text-gray-600">
              Latest additions to our marketplace
            </p>
          </div>
          
          <ProductGrid
            products={newProducts?.data || []}
            isLoading={newLoading}
          />
          
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-colors"
            >
              {t('navigation.products')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stay Updated
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get the latest deals and product updates delivered to your inbox
          </p>
          <form className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder={t('footer.enterEmail')}
              className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-800 hover:bg-blue-900 rounded-r-lg font-medium transition-colors"
            >
              {t('footer.subscribe')}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};