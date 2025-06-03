'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, BarChart2, Power } from 'lucide-react'; // Removed unused icons

export default function StatsSummary({ dashboardData }) {
  // Extract necessary data safely using optional chaining and default values
  const realTimeProfit = dashboardData?.fakeProfits ?? 0;
  const liveContractBalance = dashboardData?.liveContractBalance; // Can be number or undefined/null
  const weeklyRequirement = dashboardData?.weeklyRequirement ?? 0;
  const botIsActive = dashboardData?.botStatus === 'active';

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };


  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }} // Stagger children animation
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" // Adjusted to 3 columns as per original code before last change
    >
      {/* Total Profit Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-tr from-green-900/15 to-emerald-900/15 rounded-xl border border-green-700/10 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg mr-3">
            <DollarSign size={18} className="text-green-400" />
          </div>
          <span className="text-sm text-gray-300">Total Profit</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-lg tracking-wide font-bold text-green-400">{realTimeProfit.toFixed(2)}</span>
          <span className="ml-1.5 text-gray-300 text-sm">USDT</span>
        </div>
      </motion.div>

      {/* Contract Balance Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-tr from-cyan-900/40 to-teal-900/15 rounded-xl border border-cyan-700/15 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
            <BarChart2 size={18} className="text-cyan-400" />
          </div>
          <span className="text-sm text-gray-300">Platform Balance</span>
        </div>
        <div className="flex items-baseline">
          {typeof liveContractBalance === 'number' ? (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-wide text-cyan-200">
                {liveContractBalance.toFixed(2)}
                <span className="ml-1.5 text-gray-300 text-sm">USDT</span>
              </span>
              {typeof weeklyRequirement === 'number' && weeklyRequirement > 0 &&
               liveContractBalance?.toFixed(2) < weeklyRequirement && (
                <span className='text-xs text-red-400 mt-1'>Minimum Required: <span className="font-medium text-red-400">{weeklyRequirement.toFixed(2)} USDT</span></span>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-500">N/A</span> // Adjusted size for consistency
          )}
        </div>
        {typeof liveContractBalance !== 'number' && ( // Simplified check
          <p className="text-xs text-gray-500 mt-1">Balance unavailable.</p>
        )}
      </motion.div>

      {/* Bot Status Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-tr from-purple-900/40 to-violet-900/20 rounded-xl border border-purple-700/30 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
            <Power size={18} className={`${botIsActive ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <span className="text-sm text-gray-300">Bot Status</span>
        </div>
        <div className="flex items-baseline">
          <span className={`text-xl font-semibold ${botIsActive ? 'text-green-400' : 'text-red-400'}`}>
            {botIsActive ? 'Active' : 'Inactive'}
          </span>
          {botIsActive && (
            <span className="relative flex h-3 w-3 ml-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
