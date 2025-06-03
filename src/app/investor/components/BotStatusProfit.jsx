'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Power, AlertCircle, Info, ChevronRight, Zap, TrendingUp } from 'lucide-react';

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

export default function BotStatusProfit({ dashboardData, itemVariants = defaultItemVariants }) {
  if (!dashboardData) {
    // Handle case where data might not be ready (optional, parent might handle loading)
    return null; // Or a placeholder/skeleton loader
  }

  const botIsActive = dashboardData.botStatus === 'active';
  const realTimeProfit = dashboardData.fakeProfits ?? 0; // Use the correct prop name if different

  return (
    <motion.div variants={itemVariants} className="bg-gradient-to-b from-gray-800/70 to-gray-900/80 p-6 rounded-xl border border-gray-700/50 shadow-xl backdrop-blur-md">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Power size={20} className={`mr-2 ${botIsActive ? 'text-green-400' : 'text-red-500'}`} />
        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Bot Status & Profit</span>
      </h2>

      {/* Conditional Alert for Bot Status */}
      {!botIsActive && (
        dashboardData.subscriptionStartDate ? (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/60 rounded-lg text-red-200 text-sm flex items-center">
            <AlertCircle size={18} className="mr-3 text-red-400" />
            <div>
              <p className="font-medium mb-1">Bot paused due to insufficient balance</p>
              <p>Please ensure your balance meets the weekly requirement to reactivate the trading bot.</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/60 rounded-lg text-blue-200 text-sm flex items-center">
            <Info size={18} className="mr-3 text-blue-400" />
            <div>
              <p className="font-medium mb-1">Bot inactive - No active subscription</p>
              <p>Select a plan and make an initial deposit to start earning with our automated trading system.</p>
              <Link href="/investor/plans" className="mt-2 inline-flex items-center text-blue-300 hover:text-blue-200 font-medium">
                View Plans <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        )
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <div className="flex items-baseline mb-1">
            <span className="text-2xl font-bold tracking-wide font-accent text-green-500">{realTimeProfit.toFixed(2)}</span>
            <span className="ml-2 text-gray-300 text-lg">USDT</span>
          </div>
          <p className="text-gray-400">Accumulated Profit</p>
        </div>

        {/* Daily profit card */}
        <div className="mt-4 md:mt-0 p-3 font-accent bg-gray-800/60 rounded-lg border border-gray-700/50">
          <div className="flex items-center">
            <Zap size={16} className="text-yellow-400 mr-2" />
            <span className="text-sm text-gray-300">Daily Potential Profit:</span>
          </div>
          <div className="mt-1 flex items-baseline">
            <span className="text-xl font-bold tracking-wide text-yellow-400">{dashboardData.currentDailyProfit?.toFixed(2) ?? '0.00'}</span>
            <span className="ml-1 text-gray-300 font-semibold text-xs">USDT</span>
            <span className="ml-2 text-xs text-gray-500">(if active)</span>
          </div>
        </div>
      </div>

      {/* Animated USDT Profit Visualization - Enhanced */}
      <div className="w-full h-48 bg-gradient-to-b from-gray-800/50 to-gray-900/60 rounded-lg overflow-hidden relative p-4 border border-gray-700/30">
        <h3 className="text-sm font-medium text-gray-300 mb-2 absolute top-3 left-4 z-10">USDT Trading</h3>

        {/* Live indicators */}
        <div className="absolute top-3 right-4 flex items-center space-x-2">
          <span className="text-xs text-green-400">LIVE</span>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </div>

        {/* Trading activity indicators - small dots that flash randomly */}
        <div className="absolute top-10 left-0 right-0 h-4 overflow-hidden flex justify-between px-6">
          {[...Array(8)].map((_, i) => (
            <div key={`indicator-${i}`}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: i % 3 === 0 ? 'rgb(74, 222, 128)' : i % 3 === 1 ? 'rgb(56, 189, 248)' : 'rgb(168, 85, 247)',
                // Consider moving animation definitions to global CSS if possible
                animation: `flashDot${i} ${2 + i * 0.5}s infinite`
              }}
            />
          ))}
        </div>

        {/* Main chart area */}
        <div className="absolute inset-0 bottom-0 top-16">
          {/* Chart background grid */}
          <div className="absolute inset-0 flex flex-col justify-between opacity-20">
            {[...Array(4)].map((_, i) => (
              <div key={`grid-${i}`} className="border-t border-gray-500/30 w-full h-0"></div>
            ))}
          </div>

          {/* Dynamic chart with animation */}
          <motion.div
            className="absolute inset-0 bottom-4 top-6 flex items-end justify-between px-2 space-x-0.5"
            initial="hidden"
            animate="visible"
          >
            {[...Array(28)].map((_, i) => {
              // Create a more sophisticated pattern with multiple influences
              const baseHeight = 15;
              const growthFactor = Math.pow((i / 27), 1.2) * 60; // Non-linear growth
              const mainWave = Math.sin(i * 0.4) * 15;
              const secondaryWave = Math.cos(i * 0.8) * 5;
              const microMovements = Math.sin(i * 2) * 3;
              const randomness = Math.random() * 6;

              // Calculate final height with bounds
              const rawHeight = baseHeight + growthFactor + mainWave + secondaryWave + microMovements + randomness;
              const height = Math.max(5, Math.min(90, rawHeight));

              // Determine if this bar should "pulse" (simulate active trading)
              const isPulsing = i % 5 === 0;

              return (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm relative group"
                  variants={{
                    hidden: { height: '0%', opacity: 0 },
                    visible: {
                      height: `${height}%`,
                      opacity: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 100,
                        damping: i % 2 === 0 ? 12 : 15,
                        delay: i * 0.03
                      }
                    }
                  }}
                  style={{
                    background: `linear-gradient(to top, rgba(34, 197, 94, ${0.4 + (height / 100) * 0.6}), rgba(52, 211, 153, ${0.2 + (height / 100) * 0.4}))`
                  }}
                >
                  {/* Simulated real-time updates - small pulses on some bars */}
                  {isPulsing && (
                    <motion.div
                      className="absolute inset-0 bg-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.2, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "loop",
                        repeatDelay: Math.random() * 4 + 2
                      }}
                    />
                  )}

                  {/* Hover details */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-2 py-1 bg-gray-800 text-xs font-medium text-green-400 rounded border border-gray-700/50 whitespace-nowrap">
                      +${(height * 0.02).toFixed(2)} USDT
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Moving price indicator line */}
          <motion.div
            className="absolute h-0.5 left-0 right-0 bg-gradient-to-r from-transparent via-green-600 to-transparent"
            initial={{ top: "70%" }}
            animate={{
              top: ["65%", "30%", "55%", "35%", "60%", "40%", "65%"],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "mirror"
            }}
          />

          {/* Trend arrows - with randomized percentages */}
          <div className="absolute top-8 left-8">
            {/* Using a self-executing function to randomize the values */}
            {(() => {
              // Randomize whether it's positive or negative (60% positive, 40% negative)
              const isPositive = Math.random() > 0.4;
              const percentValue = `${isPositive ? '+' : '-'}${(Math.random() * 1.2).toFixed(2)}%`;

              return (
                <motion.div
                  className={`text-xs font-medium flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    y: [5, 0, 0, -5]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 2,
                    times: [0, 0.1, 0.9, 1]
                  }}
                >
                  <span className="mr-1">{percentValue}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={isPositive ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                  </svg>
                </motion.div>
              );
            })()}
          </div>

          <div className="absolute top-8 right-8">
            <motion.div
              className="text-blue-400 text-xs font-medium flex items-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [5, 0, 0, -5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 6,
                delay: 4,
                times: [0, 0.1, 0.9, 1]
              }}
            >
              <span className="mr-1">USDT/BTC</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l9 2-9-18-9 18 9-2z" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Trade execution markers */}
        <motion.div
          className="absolute bottom-4 left-[30%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: 3, repeat: Infinity, repeatDelay: 7 }}
        >
          <div className="h-2 w-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-[60%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: 5, repeat: Infinity, repeatDelay: 9 }}
        >
          <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
        </motion.div>

        {/* USDT Specific markers */}
        <motion.div
          className="absolute bottom-6 left-[42%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: 6, repeat: Infinity, repeatDelay: 8 }}
        >
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
        </motion.div>

        {/* Bottom info line */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-4 text-xs text-gray-500">
          <span>24h</span>
          <motion.span
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-green-400"
          >
            USDT Trading
          </motion.span>
          <span>Now</span>
        </div>

        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 via-transparent to-gray-900/40 pointer-events-none"></div>
      </div>

      {/* Keyframe animations like flashDot should be defined in global CSS or a style tag in the parent component */}
      {/* Example (add to global CSS or a <style jsx global> tag):
          @keyframes flashDot0 { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
          @keyframes flashDot1 { ... }
          ...etc
      */}
    </motion.div>
  );
}
