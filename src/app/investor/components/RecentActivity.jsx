'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Activity, Loader2, ArrowRight } from 'lucide-react';
import ActivityItem from '@/app/admin/components/ActivityItem'; // Assuming this path is correct
import moment from 'moment'; // Keep moment for time formatting

// Helper to format activity details (can be moved to a utils file if used elsewhere)
const formatDetails = (activity) => {
  let details = activity.details || '';
  if (activity.targetUser?.name && !details.toLowerCase().includes(activity.targetUser.name.toLowerCase())) {
    details = details ? `${details} (Target: ${activity.targetUser.name})` : `Target: ${activity.targetUser.name}`;
  }
  return details;
};

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

export default function RecentActivity({
  recentActivities,
  isLoading, // Pass loading state
  dashboardError, // Pass error state
  itemVariants = defaultItemVariants
}) {

  return (
    <motion.div variants={itemVariants} className="bg-gradient-to-b from-gray-800/70 to-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl p-2">
      <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700/50 flex items-center">
        <Activity size={18} className="mr-2 text-purple-400" />
        Recent Activity
      </h3>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        ) : recentActivities && recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => (
            <motion.div
              key={activity._id} // Assuming _id is present
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
            >
              <ActivityItem
                name={activity.user?.email || 'System'}
                action={activity.action}
                details={formatDetails(activity)}
                time={moment(activity.createdAt).fromNow()} // Use moment here
              />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 px-4">
            <Activity size={24} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">No recent activities found.</p>
            {dashboardError && <p className="text-xs text-red-500 mt-1">Could not load dashboard data.</p>}
          </div>
        )}
      </div>

      {/* View all activity link */}
      {recentActivities && recentActivities.length > 0 && (
        <div className="mt-5 pt-3 border-t border-gray-700/30">
          <Link
            href="/investor/activity"
            className="flex items-center justify-center w-full p-2 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">View All Activity</span>
            <ArrowRight size={14} className="ml-1.5" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
