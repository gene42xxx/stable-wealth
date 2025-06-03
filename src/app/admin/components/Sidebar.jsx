'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Settings, UserCircle, ChevronDown, ChevronUp, X, DollarSign } from 'lucide-react'; // Added X for close button
import Image from 'next/image';
import { signOut } from 'next-auth/react';

// Navigation items passed as props
// Example: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }, ...]

// Added isMobileOpen and toggleMobileSidebar props
export default function Sidebar({ navItems = [], userInfo = {}, isMobileOpen, toggleMobileSidebar }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  // Removed sidebarVariants as we'll use Tailwind classes for responsiveness

  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.2 },
    }),
  };

  const isActive = (href) => {
    // Handle exact match for dashboard/admin dashboard, otherwise check startsWith
    if (href === '/dashboard' || href === '/admin/dashboard') {
      return pathname === href;
    }
    // Ensure href is not null or undefined before calling startsWith
    return href && pathname.startsWith(href) && href !== '/'; // Avoid matching everything for '/'
  };
  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-950 via-black to-gray-950 text-gray-300 flex flex-col shadow-2xl border-r border-gray-800 z-40 transition-transform duration-300 ease-in-out
                   ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                   lg:translate-x-0 lg:fixed`} // Use lg:fixed for desktop
      >
        {/* Logo/Brand & Mobile Close Button */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-gray-800 flex-shrink-0 bg-black/20">
          {/* Adjusted logo size slightly */}
          <Link href="/dashboard">
            <Image src="/logo.png" alt="StableWealth" width={150} height={38} className="h-11 w-auto" priority />
          </Link>
          {/* Mobile close button - styled */}
          <button onClick={toggleMobileSidebar} className="lg:hidden text-gray-500 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation - Refined Styling */}
        <nav className="flex-grow px-3 py-5 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <motion.div key={item.name} custom={index} variants={linkVariants} initial="hidden" animate="visible">
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobileOpen) {
                      toggleMobileSidebar();
                    }
                  }}
                  className={`flex items-center px-3.5 py-2.5 rounded-md transition-all duration-150 group relative text-sm font-medium ${active
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                    }`}
                >
                  {/* Enhanced Active Indicator */}
                  {active && (
                    <motion.div
                      layoutId="active-sidebar-indicator"
                      className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/30"
                    />
                  )}
                  {Icon && <Icon size={18} className={`ml-1 mr-3 flex-shrink-0 transition-colors duration-150 ${active ? 'text-indigo-300' : 'text-gray-500 group-hover:text-gray-300'}`} />}
                  <span className={`flex-grow ${active ? 'font-semibold' : ''}`}>{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Profile / Logout - Restyled */}
        <div className="px-4 py-3 border-t border-gray-700/50 flex-shrink-0 bg-gray-950/50">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-800/70 transition-colors group"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              {/* Placeholder for actual avatar if available */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {userInfo.email ? userInfo.email.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-100 truncate">{userInfo.email || 'User'}</p>
                <p className="text-xs text-gray-400 capitalize">{userInfo.role || 'Role'}</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-gray-500 group-hover:text-gray-300 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-1 pl-4 border-l-2 border-gray-700 ml-4" // Indented look
            >
              <Link href={userInfo.role === 'admin' || userInfo.role === 'super-admin' ? '/admin/settings' : '/dashboard/settings'} className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-md transition-colors group">
                <Settings size={15} className="mr-2.5 text-gray-500 group-hover:text-gray-300" />
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })} // Added callbackUrl
                className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-800/30 rounded-md transition-colors group"
              >
                <LogOut size={15} className="mr-2.5 text-red-500/80 group-hover:text-red-400" />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
