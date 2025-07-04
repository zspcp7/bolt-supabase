import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X,
  Store
} from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { totalItems } = useCartStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      console.log('Search for:', searchQuery);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-gray-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10">
            <div className="flex items-center space-x-4">
              <span>{t('footer.support')}: +1 (555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Store className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">MarketPlace</span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </form>
          </div>

          {/* Navigation icons */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Heart className="w-6 h-6" />
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <User className="w-6 h-6" />
                  <span className="hidden sm:inline text-sm">
                    {user?.first_name || t('user.account')}
                  </span>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('user.profile')}
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('user.orders')}
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('user.settings')}
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('auth.signOut')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/signin"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {t('auth.signIn')}
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/signup"
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {t('auth.signUp')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="hidden md:flex items-center space-x-8 py-4 border-t border-gray-100">
          <Link
            to="/"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            {t('navigation.home')}
          </Link>
          <Link
            to="/products"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            {t('navigation.products')}
          </Link>
          <Link
            to="/categories"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            {t('navigation.categories')}
          </Link>
          <Link
            to="/vendors"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            {t('navigation.vendors')}
          </Link>
          <Link
            to="/about"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            {t('navigation.about')}
          </Link>
          <Link
            to="/contact"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            {t('navigation.contact')}
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </form>

            {/* Mobile navigation */}
            <nav className="space-y-2">
              <Link
                to="/"
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.home')}
              </Link>
              <Link
                to="/products"
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.products')}
              </Link>
              <Link
                to="/categories"
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.categories')}
              </Link>
              <Link
                to="/vendors"
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.vendors')}
              </Link>
              <Link
                to="/about"
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.about')}
              </Link>
              <Link
                to="/contact"
                className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navigation.contact')}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};