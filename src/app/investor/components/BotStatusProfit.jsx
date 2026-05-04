'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  ChevronRight, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  Cpu,
  Activity,
  History,
  Lock
} from 'lucide-react';

export default function BotStatusProfit({ dashboardData, itemVariants }) {
  const [tickerMsg, setTickerMsg] = useState('Initializing quantum algorithms...');
  
  // Use botActive as primary status if available, fallback to botStatus, and ensure subscription exists
  const hasSubscription = !!dashboardData?.subscriptionStartDate;
  
  // Real-time requirement check based on dashboard data
  const weeklyRequirement = dashboardData?.weeklyRequirement ?? 0;
  const liveBalance = dashboardData?.liveContractBalance ?? 0;
  const meetsRequirement = liveBalance >= (weeklyRequirement - 0.01);

  const botIsActive = hasSubscription && meetsRequirement && (dashboardData?.botActive ?? (dashboardData?.botStatus === 'active'));

  // Simulate live ticker updates
  useEffect(() => {
    if (!botIsActive) {
      setTickerMsg(hasSubscription ? 'System on standby. Monitoring balance...' : 'Waiting for system activation...');
      return;
    }
    const msgs = [
      'Scanning USDT/BTC liquidity...',
      'Executing micro-arbitrage sequence',
      'Optimizing entry points via AI',
      'Signal strength: 98.4% (Strong Buy)',
      'Hedging risk parameters adjusted',
      'Processing real-time market data'
    ];
    let i = 0;
    const interval = setInterval(() => {
      setTickerMsg(msgs[i % msgs.length]);
      i++;
    }, 5000);
    return () => clearInterval(interval);
  }, [botIsActive, hasSubscription]);

  if (!dashboardData) return null;

  const realTimeProfit = dashboardData.fakeProfits ?? 0;

  return (
    <motion.div 
      variants={itemVariants} 
      className="group relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl"
    >
      {/* Background Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-colors duration-1000 ${botIsActive ? 'bg-emerald-500/10' : hasSubscription ? 'bg-amber-500/5' : 'bg-red-500/5'}`} />
      
      <div className="relative p-6 md:p-8">
        {/* Top Navigation / Status */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl border ${botIsActive ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/5'}`}>
              {botIsActive ? <Cpu size={18} className="text-emerald-400" /> : hasSubscription ? <Activity size={18} className="text-amber-400/40" /> : <Lock size={18} className="text-white/20" />}
              {botIsActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 scale-50"></span>
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/90 tracking-tight uppercase tracking-widest">Neural Engine</h2>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${botIsActive ? 'text-emerald-500' : hasSubscription ? 'text-amber-400/80' : 'text-white/30'}`}>
                  {botIsActive ? 'Active' : hasSubscription ? 'Paused' : 'Inactive'}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] text-white/40 font-mono tracking-tighter">NODE-042-STABLE</span>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
              <Activity size={12} className={botIsActive ? "text-cyan-400" : "text-white/20"} />
              <span className="text-[10px] font-mono text-white/60 uppercase tracking-tighter">
                {botIsActive ? 'Latency: 12ms' : 'Sync Idle'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Alerts - Minimalist */}
        {!botIsActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4"
          >
            <AlertCircle size={18} className={`${hasSubscription ? 'text-amber-400/60' : 'text-red-400/60'} shrink-0`} />
            <div className="flex-1">
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                {hasSubscription 
                  ? "Trading suspended: Weekly balance requirement not met. Bot will resume once threshold is reached."
                  : "No active subscription. Initialize your portfolio to begin automated wealth generation."}
              </p>
            </div>
            {!hasSubscription && (
              <Link href="/investor/plans" className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-all border border-white/10">
                PLANS <ChevronRight size={12} />
              </Link>
            )}
          </motion.div>
        )}

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Net Realized Profit</p>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-medium text-white tracking-tight leading-none">
                {realTimeProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <span className="text-xs font-semibold text-emerald-400/50 translate-y-[1px]">USDT</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className={`flex items-center gap-1 text-[10px] font-bold ${botIsActive ? 'text-emerald-400 bg-emerald-400/5' : 'text-white/40 bg-white/5'} border border-white/10 px-2 py-0.5 rounded-full`}>
                <ArrowUpRight size={10} />
                +12.4%
              </div>
              <span className="text-[10px] text-white/20 uppercase tracking-widest font-semibold">Performance Index</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Projected Daily Yield</p>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-medium text-white tracking-tight leading-none">
                {dashboardData.currentDailyProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </h3>
              <span className="text-xs font-semibold text-cyan-400/50 translate-y-[1px]">USDT</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">EST. APR 24.8%</span>
              </div>
              {botIsActive && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">Optimizing</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Lively Chart Visualization */}
        <div className="relative mb-8 rounded-3xl bg-black/20 border border-white/5 overflow-hidden">
          <div className="h-44 relative pt-10 pb-2">
            {/* Soft Grid Lines */}
            <div className="absolute inset-x-6 inset-y-6 flex flex-col justify-between pointer-events-none opacity-30">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-px bg-white/[0.03] w-full" />
              ))}
            </div>

            {/* Scanning Line Effect - Only when active */}
            {botIsActive && (
              <motion.div 
                className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent z-10"
                animate={{ left: ['0%', '100%', '0%'] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
            )}

            {/* Neural activity paths */}
            <svg className="absolute inset-0 w-full h-full p-6 overflow-visible pointer-events-none" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={botIsActive ? "#10b981" : "#ffffff"} stopOpacity={botIsActive ? "0.1" : "0.02"} />
                  <stop offset="100%" stopColor={botIsActive ? "#10b981" : "#ffffff"} stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Secondary faint oscillating path - hidden or flat when inactive */}
              {botIsActive && (
                <motion.path
                  d="M 0 60 Q 50 40, 100 65 T 200 45 T 300 70 T 400 30"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.05)"
                  strokeWidth="1"
                  animate={{ d: [
                    "M 0 60 Q 50 40, 100 65 T 200 45 T 300 70 T 400 30",
                    "M 0 65 Q 50 45, 100 60 T 200 50 T 300 65 T 400 35",
                    "M 0 60 Q 50 40, 100 65 T 200 45 T 300 70 T 400 30"
                  ]}}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Primary Main Path - Flatter when inactive */}
              <motion.path
                d={botIsActive 
                  ? "M 0 80 C 40 70, 60 90, 100 70 C 140 50, 160 80, 200 60 C 240 40, 260 60, 300 30 C 340 0, 360 40, 400 10"
                  : "M 0 60 Q 100 58, 200 60 T 400 59"
                }
                fill="none"
                stroke={botIsActive ? "#10b981" : "rgba(255,255,255,0.1)"}
                strokeWidth={botIsActive ? "2" : "1"}
                strokeLinecap="round"
                animate={!botIsActive ? {
                  d: [
                    "M 0 60 Q 100 58, 200 60 T 400 59",
                    "M 0 59 Q 100 62, 200 59 T 400 60",
                    "M 0 60 Q 100 58, 200 60 T 400 59"
                  ]
                } : {}}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Area Fill */}
              <motion.path
                d={botIsActive 
                  ? "M 0 80 C 40 70, 60 90, 100 70 C 140 50, 160 80, 200 60 C 240 40, 260 60, 300 30 C 340 0, 360 40, 400 10 L 400 100 L 0 100 Z"
                  : "M 0 60 Q 100 58, 200 60 T 400 59 L 400 100 L 0 100 Z"
                }
                fill="url(#chartFill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />

              {/* Data Particles - Only when active */}
              {botIsActive && [...Array(4)].map((_, i) => (
                <motion.circle
                  key={i}
                  r="1.2"
                  fill="#34d399"
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    cx: [Math.random() * 400, Math.random() * 400],
                    cy: [Math.random() * 100, Math.random() * 100],
                  }}
                  transition={{ 
                    duration: 4 + Math.random() * 2, 
                    repeat: Infinity, 
                    delay: i * 1,
                  }}
                />
              ))}

              {/* Live Tip Point - Breather when active, static when not */}
              <motion.circle
                cx="400"
                cy={botIsActive ? "10" : "59"}
                r="2"
                fill={botIsActive ? "#10b981" : "rgba(255,255,255,0.2)"}
                animate={botIsActive ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
            
            {/* Interaction Layer */}
            <div className="absolute top-4 left-6 flex items-center gap-4">
              <div className="flex items-center gap-1.5 opacity-40">
                <span className="text-[8px] font-bold text-white uppercase">Engine</span>
                <span className={`text-[9px] font-mono font-bold tracking-tighter ${botIsActive ? 'text-emerald-400' : 'text-white'}`}>
                  {botIsActive ? 'CORE-01' : 'IDLE'}
                </span>
              </div>
            </div>

            {/* Time Indicators */}
            <div className="absolute bottom-3 left-6 right-6 flex justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-1 h-1 rounded-full ${botIsActive ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                  {botIsActive ? 'Live Engine Stream' : 'Engine Standby'}
                </span>
              </div>
              <span className="text-[9px] text-white/10 font-bold uppercase tracking-widest font-mono">
                {botIsActive ? `TS: ${new Date().getHours()}:00` : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Ticker Feed */}
        <div className="flex items-center gap-4 py-3 px-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <History size={14} className="text-white/30 shrink-0" />
          <div className="flex-1 overflow-hidden h-4 relative">
            <AnimatePresence mode="wait">
              <motion.p 
                key={tickerMsg}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-[10px] text-white/40 font-mono tracking-tight"
              >
                {tickerMsg}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${botIsActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">
              {botIsActive ? 'Sync' : 'Idle'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
