'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, Loader2 } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
// Removed formatDistanceToNowStrict import, will receive as prop

// Animation variants (can be passed as props or defined here)
const defaultItemVariants = {
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

export default function WeeklyProgress({
  dashboardData,

  itemVariants = defaultItemVariants,
  formatDistanceToNowStrict // Receive helper function as prop
}) {
  if (!dashboardData) {
    return null; // Or a placeholder
  }

  
  const liveContractBalance = dashboardData?.liveContractBalance;
  const weeklyRequirement = dashboardData?.weeklyRequirement ?? 0;
  const balanceProgress = liveContractBalance > 0 ? Math.min(100, (liveContractBalance / weeklyRequirement) * 100) : 0;
  const timeToNextThreshold = dashboardData?.timeToNextThreshold ?? 0;


  return (
    <motion.div variants={itemVariants} className="bg-gradient-to-b from-gray-800/70 to-gray-900/80 p-6 rounded-xl border border-gray-700/50 shadow-xl backdrop-blur-md">
      <h2 className="text-xl font-semibold mb-5 flex items-center">
        <Target size={20} className="mr-2 text-cyan-400" />
        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Weekly Progress</span>
      </h2>

      <div className="mb-6">
        {/* Enhanced progress bar */}
        <div className="w-full h-1 bg-gray-700/60 rounded-full overflow-hidden my-4">
          <div
            className="h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
            style={{ width: `${balanceProgress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-700 to-cyan-500"></div>
            {/* Shimmer effect - ensure animation is defined globally or passed */}
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-4/5 bg-purple-200/60 transform -skew-x-30 animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Progress details */}
        <div className="mt-2 flex justify-between text-xs">
          <span className="text-gray-400">
            Current Balance: <span className="font-bold tracking-wide text-white">{typeof liveContractBalance === 'number' ? liveContractBalance?.toFixed(2) : 'N/A'} USDT</span>
          </span>
          <span className="text-gray-400">
            Required: <span className="font-bold text-white tracking-wide">{typeof weeklyRequirement === 'number' ? weeklyRequirement?.toFixed(2) : 'N/A'} USDT</span>
          </span>
        </div>
        {/* Progress percentage */}
        <div className="mt-1 text-right font-semibold ">
          <span className="text-xs font-medium text-cyan-300">{balanceProgress?.toFixed(0)}% of requirement met</span>
        </div>
      </div>

      {/* Current Week Info */}
      <div className="mb-6 text-sm text-center text-gray-400">
        Tracking progress for <span className="font-semibold text-white">Week {dashboardData.currentWeek ?? 'N/A'}</span>.
      </div>

      {/* Timer with enhanced styling */}
      <CountdownTimer timeToNextThreshold={timeToNextThreshold} />
      {/* Ensure shimmer animation is defined in global CSS or passed via styles */}
      {/* Example (add to global CSS or a <style jsx global> tag):
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
       */}
    </motion.div>
  );
}
