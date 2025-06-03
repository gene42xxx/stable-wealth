'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, XCircle, Activity, Clock } from 'lucide-react';

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

export default function WeeklyDepositTracker({ dashboardData, itemVariants = defaultItemVariants }) {
  if (!dashboardData) {
    return null; // Or a placeholder
  }

  const weeklyDepositsStatus = dashboardData?.weeklyDepositsCompleted || [];
  const currentWeek = dashboardData?.currentWeek;

  return (
    <motion.div variants={itemVariants} className="bg-gradient-to-b from-gray-800/70 to-gray-900/80 p-6 rounded-xl border border-gray-700/50 shadow-xl backdrop-blur-md">
      <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700/50 flex items-center">
        <DollarSign size={18} className="mr-2 text-yellow-400" />
        Weekly Deposits Status
      </h3>

      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar"> {/* Ensure custom-scrollbar class is defined globally */}
        {weeklyDepositsStatus.length > 0 ? (
          weeklyDepositsStatus.map((weekStatus) => (
            <div
              key={weekStatus.week}
              className="flex items-center justify-between p-3 rounded-2xl bg-gray-800/50 border border-gray-700/30 hover:bg-gray-800/80 transition-colors"
            >
              <div className="flex items-center">
                {/* Icon based on status */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-medium
                  ${weekStatus.completed ? 'bg-green-900/40 border border-green-700/40' :
                    currentWeek > weekStatus.week ? 'bg-red-900/40 border border-red-700/40' :
                      currentWeek === weekStatus.week ? 'bg-blue-900/40 border border-blue-700/40' :
                        'bg-gray-800/60 border border-gray-700/40'}`
                }>
                  {weekStatus.completed ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : currentWeek > weekStatus.week ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : currentWeek === weekStatus.week ? (
                    <Activity size={16} className="text-blue-400 animate-pulse" />
                  ) : (
                    <Clock size={16} className="text-gray-500" />
                  )}
                </div>
                <span className="text-gray-300 font-semibold tracking-wide text-sm">Week {weekStatus.week}</span>
              </div>

              {/* Status text */}
              {weekStatus.completed ? (
                <span className="flex items-center px-3 py-1 bg-green-900/40 text-green-300 text-xs font-medium rounded-full border border-green-700/40">
                  <CheckCircle size={14} className="mr-1.5 text-green-400" /> Completed
                </span>
              ) : currentWeek > weekStatus.week ? (
                <span className="flex items-center px-3 py-1 bg-red-900/40 text-red-300 text-xs font-medium rounded-full border border-red-700/40">
                  <XCircle size={14} className="mr-1.5 text-red-400" /> Missed
                </span>
              ) : currentWeek === weekStatus.week ? (
                <span className="flex items-center px-3 py-1 bg-blue-900/40 text-blue-300 text-xs font-medium rounded-full border border-blue-700/40">
                  <Activity size={14} className="mr-1.5 text-blue-400 animate-pulse" /> On-going
                </span>
              ) : (
                <span className="flex items-center px-3 py-1 bg-gray-800/60 text-gray-400 text-xs font-medium rounded-full border border-gray-700/40">
                  <Clock size={14} className="mr-1.5 text-gray-500" /> Upcoming
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 px-4">
            <DollarSign size={24} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">No weekly deposit data available.</p>
          </div>
        )}
      </div>
      {/* Ensure custom-scrollbar styles are defined globally */}
      {/* Example (add to global CSS or a <style jsx global> tag):
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(31, 41, 55, 0.4); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(75, 85, 99, 0.5); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(75, 85, 99, 0.7); }
       */}
    </motion.div>
  );
}
