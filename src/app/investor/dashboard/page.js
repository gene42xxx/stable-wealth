'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Import newly created components
import DashboardHeader from '@/app/investor/components/DashboardHeader';
import StatsSummary from '@/app/investor/components/StatsSummary';
import BotStatusProfit from '@/app/investor/components/BotStatusProfit';
import WeeklyProgress from '@/app/investor/components/WeeklyProgress';
import ProfitProjection from '@/app/investor/components/ProfitProjection';
import WeeklyDepositTracker from '@/app/investor/components/WeeklyDepositTracker';
import RecentActivity from '@/app/investor/components/RecentActivity';
import Notifications from '@/app/investor/components/Notifications';
import ResourcesHelp from '@/app/investor/components/ResourcesHelp';
import LoadingIndicator from '@/app/investor/components/LoadingIndicator';
import DashboardError from '@/app/investor/components/DashboardError';
import UnauthorizedAccess from '@/app/investor/components/UnauthorizedAccess';
import { useLastSeen } from '@/hooks/useLastSeen';

// Removed unused imports: Link, Loader2, ShieldAlert, Settings, BarChart2, AlertCircle, DollarSign, Zap, Clock, ArrowRight, TrendingUp, CheckCircle, XCircle, Activity, Power, Target, Info, ChevronRight, Calendar, ActivityItem, moment, formatDistanceToNowStrict

// Removed formatDetails helper function (now likely inside RecentActivity or passed to it)

export default function InvestorDashboardPage() {
  console.log('RPC URL:', process.env.MAINNET_RPC_URL || '')

    useLastSeen();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [lastLoginTime, setLastLoginTime] = useState('');
  

  // Fetch main dashboard data
  const dashboardSwrKey = sessionStatus === 'authenticated' ? '/api/investor/dashboard-summary' : null;
  const { data: dashboardData, error: dashboardError, isLoading: isLoadingDashboard } = useSWR(
    dashboardSwrKey,
    (url) => fetch(url).then((res) => res.json()),
    {
      revalidateOnFocus: true,
      // refreshInterval: 30000, // Optional: refresh interval
    }
  );

  // --- Debugging Logs ---
  useEffect(() => {
    console.log('[InvestorDashboardPage] Status:', {
      sessionStatus,
      isLoadingDashboard,
      hasDashboardData: !!dashboardData,
      dashboardError: dashboardError ? dashboardError.message : null,
    });
    if (dashboardData) {
      console.log('[InvestorDashboardPage] dashboardData Content:', dashboardData);
    }
  }, [sessionStatus, isLoadingDashboard, dashboardData, dashboardError]);
  // --- End Debugging Logs ---




  useEffect(() => {
    setLastLoginTime(new Date().toLocaleString());
  }, []);

  // --- Conditional Rendering ---

  // 1. Loading State
  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && isLoadingDashboard)) {
    return <LoadingIndicator message="Investor Dashboard..." />;
  }

  // 2. Unauthorized Access
  if (sessionStatus !== 'authenticated') {
    return <UnauthorizedAccess onSignIn={() => router.push('/auth/signin')} />;
  }

  // 3. Dashboard Data Loading Error
  if (dashboardError) {
    return <DashboardError error={dashboardError} />;
  }

  // 4. Authenticated and Data Loaded Successfully
  if (sessionStatus === 'authenticated' && dashboardData) {
    console.log('[InvestorDashboardPage] Rendering main content block with dashboardData.'); // Add log here
    // Extract necessary data for props
    const {
      fakeProfits = 0,
      botStatus = 'inactive',
      weeklyRequirement = 0,
      weeklyDepositsCompleted = [],
      liveContractBalance, // Can be undefined/null
      recentActivities = [],
      currentWeek,
      currentDailyProfit,
      projectedProfit30Days,
      currentPlanName,
      subscriptionStartDate, // Needed for BotStatusProfit alert logic
    } = dashboardData;

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    };

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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
        {/* Animated background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto pt-[5rem] px-6 relative z-10">
          {/* Dashboard Header */}
          <DashboardHeader session={session} lastLoginTime={lastLoginTime} />

          {/* Stats Summary Bar */}
          <StatsSummary

            dashboardData={dashboardData}
          />

          {/* Main Content Area */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column (Main Features) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bot Status & Profit Tracker */}
              <motion.div variants={itemVariants}>
                <BotStatusProfit
                  dashboardData={dashboardData}
                  itemVariants={itemVariants}

                />
              </motion.div>

              {/* Weekly Requirement Progress & Countdown */}
              <motion.div variants={itemVariants}>
                <WeeklyProgress
                  dashboardData={dashboardData}
                />
              </motion.div>

              {/* Profit Projection Calculator */}
              <motion.div variants={itemVariants}>
                <ProfitProjection
                  dashboardData={dashboardData}
                  itemVariants={itemVariants}
                />
              </motion.div>
            </div> {/* End of Left Column */}

            {/* Right Column (Weekly Deposits & Activity) */}
            <div className="lg:col-span-1 space-y-10">
              {/* Weekly Deposit Tracker */}
              <motion.div variants={itemVariants}>
                <WeeklyDepositTracker
                  dashboardData={dashboardData}
                  itemVariants={itemVariants}
                />
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={itemVariants}>
                <RecentActivity
                  recentActivities={recentActivities}
                  isLoading={isLoadingDashboard} // Use main loading state
                  error={dashboardError} // Pass main error state
                />
              </motion.div>

              {/* Notification System */}
              <motion.div variants={itemVariants}>
                <Notifications />
              </motion.div>
            </div> {/* Closes Right Column */}
          </motion.div> {/* Closes Main Content Area grid */}

          {/* Additional Resources Section */}
          <motion.div variants={itemVariants} className="mt-8 mb-12">
            <ResourcesHelp />
          </motion.div>

          {/* Custom styles (e.g., scrollbar, shimmer) might need to be moved to globals.css or kept if specific */}
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(31, 41, 55, 0.4); /* bg-gray-800 with opacity */
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(75, 85, 99, 0.5); /* bg-gray-600 with opacity */
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(75, 85, 99, 0.7); /* bg-gray-600 slightly darker */
            }

            /* Keep shimmer if used in components like WeeklyProgress */
            @keyframes shimmer {
              0% { transform: translateX(-100%) skewX(-30deg); }
              100% { transform: translateX(200%) skewX(-30deg); }
            }
            .animate-shimmer {
              animation: shimmer 2s infinite linear; /* Use linear for smoother loop */
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.15), /* Lighter shimmer */
                transparent
              );
              background-size: 200% 100%;
            }

            /* Keep flashDot animations if used in BotStatusProfit */
            @keyframes flashDot0 { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
            @keyframes flashDot1 { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }
            @keyframes flashDot2 { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
            @keyframes flashDot3 { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
            @keyframes flashDot4 { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
            @keyframes flashDot5 { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }
            @keyframes flashDot6 { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
            @keyframes flashDot7 { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.8; } }
          `}</style>
        </div>
      </div>
    );
  }

  // Fallback if data is not loaded for some reason (should be covered by above checks)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      Unexpected state. Please try refreshing.
    </div>
  );
}
