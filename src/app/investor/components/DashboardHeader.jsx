'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

export default function DashboardHeader({ session, lastLoginTime }) {
  if (!session?.user) {
    return null; // Or a loading/error state if needed
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className='space-y-6'>
          <h1 className="text-4xl pb-10 md:text-5xl font-display font-normal bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>

          <div className="flex items-center mt-6">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center mr-3">
              <span className="text-white font-bold">{session.user?.name?.[0] || session.user?.email?.[0] || 'I'}</span>
            </div>
            <div>
              <p className="text-lg text-gray-200">
                Welcome, <span className="font-medium text-white">{session.user?.name || session.user?.email || 'Investor'}</span>
              </p>
              <p className="text-xs text-gray-400">Last login: {lastLoginTime}</p>
            </div>
          </div>
        </div>
        <div
     
        >
          <Link href="/investor/settings" className="px-5 py-2.5 font-semibold  bg-gray-800/60 hover:bg-gray-700/60 rounded-lg border border-gray-700/50 shadow-lg flex items-center transition-all duration-200">
            <Settings size={16} className="mr-2 text-blue-400" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
