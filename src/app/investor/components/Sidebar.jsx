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

      <motion.aside
        variants={sidebarVar}
        initial="hidden"
        animate={isMobile ? (isMobileOpen ? 'visible' : 'hidden') : 'visible'}
        exit="hidden"
        className="
          fixed lg:relative top-0 left-0 bottom-0 z-50 w-72 h-full
          bg-slate-950/40 backdrop-blur-2xl
          border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.3)]
          overflow-hidden flex flex-col flex-shrink-0"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
        
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,1) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        {/* Header with logo & close button */}
        <div className="relative z-10 flex items-center justify-between px-6 py-8">
          <Link href="/investor/dashboard" className="group relative flex items-center">
            <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image
              src="/sb.png"
              alt="Logo"
              width={160}
              height={40}
              priority
              className="h-10 w-auto relative transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
            />
          </Link>
          <button
            onClick={() => toggleMobileSidebar()}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="relative z-10 flex-1 px-4 py-4 overflow-y-auto space-y-1.5 scrollbar-none">
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
                <Link href={item.href} className="group block outline-none" onClick={handleMobileNavClick}>
                  <motion.div
                    className={`
                      relative flex items-center px-4 py-3 rounded-xl transition-all duration-300
                      ${active
                        ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'}
                    `}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active Indicator Line */}
                    {active && (
                      <motion.div 
                        layoutId="activeNav"
                        className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className="flex items-center w-full">
                      <div className={`
                        flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300
                        ${active 
                          ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                          : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300'}
                      `}>
                        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                      </div>
                      <span className={`ml-3.5 font-medium tracking-wide text-[15px] transition-colors duration-300 ${active ? 'text-white' : 'group-hover:text-white'}`}>
                        {item.name}
                      </span>
                      
                      {active && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="ml-auto"
                        >
                          <ChevronDown size={14} className="-rotate-90 text-blue-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Profile & settings */}
        <div className="relative z-10 px-4 py-6 border-t border-white/5 bg-slate-900/40">
          <motion.button
            onClick={() => setProfileOpen(!profileOpen)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-cyan-500">
                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                  {userInfo.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[13px] font-bold text-white truncate">{userInfo.email?.split('@')[0] ?? 'User'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{userInfo.role ?? 'Investor'}</p>
              </div>
            </div>
            <motion.div 
              animate={{ rotate: profileOpen ? 180 : 0 }} 
              className={`transition-colors duration-300 ${profileOpen ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}
            >
              <ChevronDown size={16} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                className="mt-3 overflow-hidden bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1.5"
              >
                <Link
                  href={(userInfo.role === 'admin' || userInfo.role === 'super-admin') ? '/admin/settings' : '/investor/settings'}
                  className="flex items-center px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 group"
                  onClick={handleMobileNavClick}
                >
                  <Settings size={15} className="mr-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="font-medium">Account Settings</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 group"
                >
                  <LogOut size={15} className="mr-3 text-red-500/50 group-hover:text-red-500 transition-colors" />
                  <span className="font-medium">Logout Session</span>
                </button>
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