import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Search, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Building2, 
  CalendarCheck,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

const Navbar = ({ onOpenAuth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isOwner, logout, switchDemoRole } = useAuth();
  const { unreadCount } = useNotifications();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = isAdmin || isOwner ? [] : [
    { name: 'Find Turf', path: '/turfs' },
    { name: 'Open Matches', path: '/open-matches' },
    { name: 'Tournaments', path: '/tournaments' },
    { name: 'Equipment Rentals', path: '/equipment' },
    { name: 'Pricing', path: '/pricing' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/turfs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to={isAdmin ? "/admin/dashboard" : isOwner ? "/owner/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2zm0 3.5a6.5 6.5 0 0 1 6.5 6.5c0 3.59-2.91 6.5-6.5 6.5a6.5 6.5 0 0 1-6.5-6.5C5.5 8.41 8.41 5.5 12 5.5z" opacity="0.3" />
                <polygon points="12,7 15,10 14,14 10,14 9,10" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-brand-600">
              PLAYSPORT
            </span>
          </Link>

          {/* Desktop Navigation Links with Exact Stitch Underline Indicator */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-5 px-3 text-sm font-medium transition-colors ${
                    active 
                      ? 'text-brand-700 font-semibold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search bar & Auth / Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Search in Nav */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:block relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </form>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full relative transition"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationDropdown onClose={() => setShowNotifications(false)} />
                  )}
                </div>

                {/* Role Specific Quick Link */}
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </Link>
                )}

                {isOwner && (
                  <Link
                    to="/owner/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Turf Manager
                  </Link>
                )}

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-medium text-slate-700 hidden sm:inline max-w-[100px] truncate">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 fade-in">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <span className="mt-1 inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/my-bookings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                      >
                        <CalendarCheck className="w-4 h-4 text-slate-400" />
                        My Bookings
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Shield className="w-4 h-4 text-purple-500" />
                          Admin Console
                        </Link>
                      )}

                      {isOwner && (
                        <Link
                          to="/owner/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Building2 className="w-4 h-4 text-brand-600" />
                          Turf Management
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition border-t border-slate-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Exact Stitch Unauthenticated Auth Buttons */
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition px-3 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-sm font-medium text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 px-4 py-2 rounded-lg shadow-sm shadow-brand-700/20 transition-all"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-slate-600 md:hidden hover:bg-slate-100 rounded-lg"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-purple-700 bg-purple-50"
            >
              Admin Panel
            </Link>
          )}
          {isOwner && (
            <Link
              to="/owner/dashboard"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-brand-700 bg-brand-50"
            >
              Turf Manager
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
