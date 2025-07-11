import React, { useState, useEffect } from 'react';
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileAuthOpen, setIsMobileAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { totalItems } = useCartStore();

  // Close mobile overlays when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
        setIsMobileSearchOpen(false);
        setIsMobileAuthOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile overlays are open
  useEffect(() => {
    if (isMobileSearchOpen || isMobileAuthOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSearchOpen, isMobileAuthOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      console.log('Search for:', searchQuery);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMobileAuthOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleMobileSearchToggle = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
    setIsMenuOpen(false);
    setIsMobileAuthOpen(false);
  };

  const handleMobileAuthToggle = () => {
    setIsMobileAuthOpen(!isMobileAuthOpen);
    setIsMenuOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsMobileSearchOpen(false);
    setIsMobileAuthOpen(false);
  };

  const closeMobileOverlays = () => {
    setIsMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileAuthOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-gray-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10">
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline">{t('footer.support')}: +1 (555) 123-4567</span>
              <span className="sm:hidden">Support: +1 (555) 123-4567</span>
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
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <Store className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">MarketPlace</span>
            <span className="text-lg font-bold text-gray-900 sm:hidden">MP</span>
          </Link>

          {/* Desktop Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {t('common.search')}
                </button>
              </div>
            </form>
          </div>

          {/* Navigation icons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Mobile Search Icon */}
            <button
              onClick={handleMobileSearchToggle}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={t('search.placeholder')}
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Mobile Profile Icon */}
            <button
              onClick={handleMobileAuthToggle}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isAuthenticated ? t('user.profile') : t('auth.signIn')}
            >
              <User className="w-6 h-6" />
              {isAuthenticated && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`${t('navigation.cart')} (${totalItems} items)`}
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Desktop Wishlist */}
            <Link
              to="/wishlist"
              className="hidden sm:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all rounded-lg min-w-[44px] min-h-[44px] items-center justify-center"
              aria-label={t('navigation.wishlist')}
            >
              <Heart className="w-6 h-6" />
            </Link>

            {/* Desktop User menu */}
            {isAuthenticated ? (
              <div className="hidden md:block relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all rounded-lg min-w-[44px] min-h-[44px]">
                  <User className="w-6 h-6" />
                  <span className="hidden lg:inline text-sm">
                    {user?.first_name || t('user.account')}
                  </span>
                </button>
                
                {/* Desktop Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
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
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/signin"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  {t('auth.signIn')}
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/signup"
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
                >
                  {t('auth.signUp')}
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={handleMenuToggle}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation menu */}
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

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('common.search')}</h2>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close search"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <Search className="absolute left-4 top-4 w-6 h-6 text-gray-400" />
              </div>
              <button
                type="submit"
                className="w-full mt-4 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-lg font-medium"
              >
                {t('common.search')}
              </button>
            </form>

            {/* Search suggestions */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{t('search.suggestions')}</h3>
              <div className="space-y-2">
                {['Electronics', 'Clothing', 'Home & Garden', 'Sports'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleSearch(new Event('submit') as any);
                    }}
                    className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Authentication Overlay */}
      {isMobileAuthOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAuthenticated ? t('user.account') : t('auth.signIn')}
            </h2>
            <button
              onClick={() => setIsMobileAuthOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4">
            {isAuthenticated ? (
              /* Authenticated User Menu */
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user?.first_name || t('user.account')
                      }
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <Link
                  to="/account"
                  onClick={closeMobileOverlays}
                  className="flex items-center space-x-3 w-full p-4 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span>{t('user.profile')}</span>
                </Link>

                <Link
                  to="/orders"
                  onClick={closeMobileOverlays}
                  className="flex items-center space-x-3 w-full p-4 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-400" />
                  <span>{t('user.orders')}</span>
                </Link>

                <Link
                  to="/wishlist"
                  onClick={closeMobileOverlays}
                  className="flex items-center space-x-3 w-full p-4 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
                >
                  <Heart className="w-5 h-5 text-gray-400" />
                  <span>{t('navigation.wishlist')}</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={closeMobileOverlays}
                  className="flex items-center space-x-3 w-full p-4 text-left text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span>{t('user.settings')}</span>
                </Link>

                <hr className="my-4" />

                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 w-full p-4 text-left text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-500" />
                  <span>{t('auth.signOut')}</span>
                </button>
              </div>
            ) : (
              /* Authentication Options */
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome to MarketPlace
                  </h3>
                  <p className="text-gray-600">
                    Sign in to access your account and enjoy personalized shopping
                  </p>
                </div>

                <Link
                  to="/signin"
                  onClick={closeMobileOverlays}
                  className="block w-full px-6 py-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
                >
                  {t('auth.signIn')}
                </Link>

                <Link
                  to="/signup"
                  onClick={closeMobileOverlays}
                  className="block w-full px-6 py-4 border-2 border-blue-600 text-blue-600 text-center rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors font-medium"
                >
                  {t('auth.signUp')}
                </Link>

                <div className="text-center text-sm text-gray-500 mt-4">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2">
            {/* Mobile navigation */}
            <nav className="space-y-1">
              <Link
                to="/"
                className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors font-medium"
                onClick={closeMobileOverlays}
              >
                {t('navigation.home')}
              </Link>
              <Link
                to="/products"
                className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors font-medium"
                onClick={closeMobileOverlays}
              >
                {t('navigation.products')}
              </Link>
              <Link
                to="/categories"
                className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors font-medium"
                onClick={closeMobileOverlays}
              >
                {t('navigation.categories')}
              </Link>
              <Link
                to="/vendors"
                className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors font-medium"
                onClick={closeMobileOverlays}
              >
                {t('navigation.vendors')}
              </Link>
              <Link
                to="/about"
                className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors font-medium"
                onClick={closeMobileOverlays}
              >
                {t('navigation.about')}
              </Link>
              <Link
                to="/contact"
                className="block py-3 px-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors font-medium"
                onClick={closeMobileOverlays}
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