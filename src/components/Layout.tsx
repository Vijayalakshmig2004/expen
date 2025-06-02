import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  Home,
  User,
  LogOut,
  Menu,
  X,
  DollarSign
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Profile', href: '/profile', icon: User, current: location.pathname === '/profile' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 flex items-center justify-between bg-white shadow-sm px-4 h-16 z-10">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">SplitWise</span>
          </div>
          
          <button
            type="button"
            className="-mr-3 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
        
        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Sidebar component */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-semibold text-gray-900">SplitWise</span>
                </div>
                <button
                  type="button"
                  className="-mr-2 h-10 w-10 bg-white rounded-md flex items-center justify-center text-gray-400 hover:text-gray-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                {userProfile && (
                  <div className="px-4 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {userProfile.photoURL ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={userProfile.photoURL}
                            alt={userProfile.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                            {userProfile.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {userProfile.name}
                        </div>
                        <div className="text-sm font-medium text-gray-500">
                          {userProfile.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        group flex items-center px-2 py-2 text-base font-medium rounded-md
                        ${item.current
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon
                        className={`mr-4 flex-shrink-0 h-6 w-6 ${
                          item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <LogOut
                      className="mr-4 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                      aria-hidden="true"
                    />
                    Sign out
                  </button>
                </nav>
              </div>
            </div>
            
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        )}
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">SplitWise</span>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              {userProfile && (
                <div className="px-4 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {userProfile.photoURL ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={userProfile.photoURL}
                          alt={userProfile.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                          {userProfile.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800 truncate max-w-[180px]">
                        {userProfile.name}
                      </div>
                      <div className="text-sm font-medium text-gray-500 truncate max-w-[180px]">
                        {userProfile.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${item.current
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
                
                <button
                  onClick={handleLogout}
                  className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut
                    className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  Sign out
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0 min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;