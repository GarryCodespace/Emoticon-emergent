import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  UserIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  CreditCardIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Header = ({ onAuthClick }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
              🎭
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Emoticon</h1>
              <p className="text-xs text-gray-500 -mt-1">AI Emotion Analysis</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              to="/pricing" 
              className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Pricing
            </Link>
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user?.email?.split('@')[0]}
                  </span>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-primary-600 mt-1">
                        {user?.plan?.name || 'Free'} Plan
                      </p>
                    </div>

                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/dashboard"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                          >
                            <ChartBarIcon className="w-4 h-4 mr-3" />
                            Dashboard
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/pricing"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                          >
                            <CreditCardIcon className="w-4 h-4 mr-3" />
                            Upgrade Plan
                          </Link>
                        )}
                      </Menu.Item>
                    </div>

                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <button
                  onClick={onAuthClick}
                  className="btn-ghost"
                >
                  Sign In
                </button>
                <button
                  onClick={onAuthClick}
                  className="btn-primary"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Pricing
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  Dashboard
                </Link>
              )}
              {!isAuthenticated && (
                <div className="px-4 py-2 space-y-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAuthClick();
                    }}
                    className="w-full btn-ghost text-left"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAuthClick();
                    }}
                    className="w-full btn-primary text-center"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;