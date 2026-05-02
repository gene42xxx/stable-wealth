'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronDown, LogOut, Settings
} from 'lucide-react';
import Image from 'next/image';
import {
  LayoutDashboard, ListOrdered, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, Activity
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const investorNavItems = [
  { name: 'Dashboard', href: '/investor/dashboard', icon: LayoutDashboard },
  { name: 'Plans', href: '/investor/plans', icon: ListOrdered },
  { name: 'Deposit', href: '/investor/deposit', icon: ArrowDownCircle },
  { name: 'Withdraw', href: '/investor/withdraw', icon: ArrowUpCircle },
  { name: 'Transactions', href: '/investor/transactions', icon: ArrowRightLeft },
  { name: 'Activity', href: '/investor/activity', icon: Activity },
  { name: 'Settings', href: '/investor/settings', icon: Settings },
];

export default function Sidebar({ userInfo = {}, isMobileOpen, toggleMobileSidebar = () => { } }) {
  const pathname = usePathname();
  const [hovered, setHovered] = React.useState(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const isActive = href => pathname.startsWith(href);

  // Handle mobile navigation click
  const handleMobileNavClick = () => {
    if (isMobile && isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  // Smooth easing curves
  const smoothEasing = [0.25, 0.46, 0.45, 0.94];
  const gentleEasing = [0.4, 0, 0.2, 1];

  const sidebarVar = {
    hidden: {
      x: -280,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: smoothEasing,
        when: 'afterChildren'
      }
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: smoothEasing,
        when: 'beforeChildren',
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    }
  };

  const linkVar = {
    hidden: {
      opacity: 0,
      x: -15,
      transition: {
        duration: 0.3,
        ease: gentleEasing
      }
    },
    visible: i => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.2,
        ease: gentleEasing
      }
    })
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: gentleEasing }}
            className="fixed inset-0 z-40 bg-black backdrop-blur-sm"
            onClick={toggleMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <motion.aside
        variants={sidebarVar}
        initial="hidden"
        animate={isMobile ? (isMobileOpen ? 'visible' : 'hidden') : 'visible'}
        exit="hidden"
        className="
          fixed lg:relative top-0 left-0 bottom-0 z-50 w-72 h-full
          bg-[rgba(15,23,42,0.51)] backdrop-blur-xl
          border-white/5 shadow-2xl
          overflow-hidden flex flex-col flex-shrink-0"
      >
 
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-cyan-500/5 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
        <div className="absolute inset-0 border border-white/10 rounded-lg pointer-events-none" />

        {/* Header with logo & close button */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Link href="/investor/dashboard" className="group flex items-center">
            <Image
              src="/sb.png"
              alt="Logo"
              width={160}
              height={40}
              priority
              className="h-12 relative pl-2 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
          <button
            onClick={() => toggleMobileSidebar()}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 ease-out relative z-[100]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="relative z-10 flex-1 px-4 py-6 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {investorNavItems.map((item, idx) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                custom={idx}
                variants={linkVar}
                onHoverStart={() => setHovered(item.name)}
                onHoverEnd={() => setHovered(null)}
              >
                <Link href={item.href} className="group block" onClick={handleMobileNavClick}>
                  <motion.div
                    className={`
                      relative flex items-center text-sm md:text-base px-4 py-1 md:py-2 rounded-2xl transition-all duration-200 ease-out
                      ${active
                        ? 'bg-gradient-to-r from-blue-600/25 via-purple-600/15 to-cyan-600/25 text-white border border-white/15 shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/8 border border-transparent hover:border-white/10'}
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {/* Icon & label */}
                    <div className="relative z-10 flex items-center">
                      <div className={`p-2 rounded-xl transition-all duration-200 ease-out ${active ? 'bg-white/10 text-white shadow-lg' : 'text-white/60 group-hover:text-white group-hover:bg-white/8'}`}>
                        <Icon size={18} />
                      </div>
                      <span className={`ml-3 flex-grow font-medium tracking-wide transition-all duration-200 ease-out ${active ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                        {item.name}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Profile & settings */}
        <div className="relative z-10 px-4 py-4 border-t border-white/10 bg-gradient-to-t from-white/5 to-transparent">
          <motion.button
            onClick={() => setProfileOpen(!profileOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group backdrop-blur-sm"
          >
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {userInfo.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{userInfo.email ?? 'User'}</p>
                <p className="text-xs text-white/60 capitalize">{userInfo.role ?? 'Role'}</p>
              </div>
            </div>
            <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} className="text-white/60">
              <ChevronDown size={18} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                <Link
                  href={(userInfo.role === 'admin' || userInfo.role === 'super-admin') ? '/admin/settings' : '/investor/settings'}
                  className="flex items-center px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 group border border-transparent hover:border-white/10"
                  onClick={handleMobileNavClick}
                >
                  <Settings size={16} className="mr-3 text-white/50 group-hover:text-white/80" />
                  <span className="font-medium">Settings</span>
                </Link>
                <motion.button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 group border border-transparent hover:border-red-500/20"
                >
                  <LogOut size={16} className="mr-3 text-red-500/80 group-hover:text-red-400" />
                  <span className="font-medium">Logout</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating subtle pulses with new color scheme */}
        <div className="absolute top-20 right-4 w-1 h-1 bg-blue-400/30 rounded-full animate-pulse" />
        <div className="absolute top-32 right-8 w-0.5 h-0.5 bg-purple-400/40 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-40 right-6 w-1.5 h-1.5 bg-cyan-400/20 rounded-full animate-pulse delay-2000" />

      </motion.aside>
    </>
  );
}