'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, ArrowRight, AlertCircle, Wallet, CreditCard, TrendingUp } from 'lucide-react'; // Added TrendingUp
import { motion } from 'framer-motion';

export default function ProfitProjection({ dashboardData, itemVariants }) {
    const [isHovering, setIsHovering] = useState(false);
    const projectedProfit = dashboardData?.projectedProfit30Days || 0;
    const estimatedDailyProfit = projectedProfit > 0 ? (projectedProfit / 30).toFixed(2) : "0.00";
    const liveContractBalance = dashboardData?.liveContractBalance || 0;

    // Calculate progress: (Projected Profit / Current Balance) * 100, capped at 100%
    // Avoid division by zero if balance is 0.
    const progressPercent = liveContractBalance > 0
        ? Math.min(100, (projectedProfit / liveContractBalance) * 100)
        : 0;

    return (
        <motion.div
            variants={itemVariants}
            className="bg-gradient-to-b from-green-800/5 to-green-900/5 rounded-xl border border-gray-700/50 shadow-xl backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out"
          
        >
            {/* Header - Adjusted gradient and icon */}
            <div className="bg-gradient-to-r from-cyan-700/10 via-cyan-600/10 to-cyan-700/80 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                        <TrendingUp className="text-cyan-300" size={20} />
                    </div>
                    <h2 className="text-white font-semibold text-lg">Profit Projection</h2>
                </div>
                <span className="text-xs text-purple-200 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    Est. 30-Day
                </span>
            </div>

            {/* Main Content */}
            <div className="px-6 py-8">
                {/* Projection Amount */}
                <div className="mb-8 text-center">
                    <p className="text-cyan-300 text-sm mb-1 font-medium">Projected 30-Day Profit</p>
                    <div className="flex items-baseline justify-center">
                        <span className={`text-xl font-bold text-white transition-colors duration-300`}>
                            {projectedProfit.toFixed(2)}
                        </span>
                        <span className="ml-2 font-semibold text-cyan-300/80">USDT</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    {/* Use calculated progressPercent */}
                    <div className="h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{ width: `${progressPercent}%` }}
                        >
                            {/* Shimmer effect - Adjusted color */}
                            <div className="absolute inset-0 opacity-40">
                                <div className="h-full w-4/5 bg-white/40 transform -skew-x-30 animate-shimmer"></div>
                            </div>
                        </div>
                    </div>
                    {/* Display calculated percentage */}
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>Projected Gain vs Balance</span>
                        <span className="font-medium text-purple-300">{progressPercent.toFixed(0)}%</span>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Plan Card - Adjusted colors */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col items-start border border-gray-700/40 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-blue-300/80">
                            <CreditCard size={16} />
                            <span className="text-xs font-medium">Active Plan</span>
                        </div>
                        <span className="text-blue-200 font-semibold">{dashboardData?.subscriptionPlanName || "No Plan"}</span>
                    </div>

                    {/* Balance Card - Adjusted colors */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col items-start border border-gray-700/40 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-cyan-300/80">
                            <Wallet size={16} />
                            <span className="text-xs font-medium">Current Balance</span>
                        </div>
                        <span className="text-cyan-200 font-semibold">{liveContractBalance.toFixed(2)} USDT</span>
                    </div>

                    {/* Daily Profit Card - Adjusted colors */}
                    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col items-start border border-gray-700/40 hover:bg-gray-800/70 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-purple-300/80">
                            <BarChart3 size={16} />
                            <span className="text-xs font-medium">Est. Daily Avg</span>
                        </div>
                        <span className="text-purple-200 font-semibold">
                            {estimatedDailyProfit} USDT
                        </span>
                    </div>
                </div>

                {/* Notice */}
                {/* Notice - Adjusted colors */}
                <div className="flex items-start gap-3 bg-gray-800/40 p-4 rounded-lg border border-gray-700/40">
                    <AlertCircle size={18} className="text-blue-400/70 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs text-gray-400/90">
                            Projections are estimates based on your current plan, balance, and historical data. Actual profits depend on market conditions and bot performance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer - Adjusted colors */}
            <div className="px-6 py-4 bg-black/20 border-t border-gray-700/50">
                <Link href="/investor/plans" className="flex items-center justify-center gap-2 text-purple-400 font-medium text-sm hover:text-purple-300 transition-colors group">
                    Explore Plans & Performance
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
}
