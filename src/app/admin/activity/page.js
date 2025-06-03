'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import ActivityItem from '../components/ActivityItem'; // Import the redesigned component
import { Loader2, AlertCircle, ServerCrash, ShieldAlert, History } from 'lucide-react'; // Added more icons
import { motion, AnimatePresence } from 'framer-motion'; // Import motion components
import moment from 'moment'; // Import moment

// SWR fetcher function (Simpler version)
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorInfo = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }));
    const error = new Error(errorInfo.message || 'An error occurred while fetching the data.');
    error.info = errorInfo;
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// Removed custom timeAgo function

// Helper to extract details, potentially adding target user info
const formatDetails = (activity) => {
    let details = activity.details || '';
    // Example: Append target user if relevant and not already in details
    if (activity.targetUser?.name && !details.toLowerCase().includes(activity.targetUser.name.toLowerCase())) {
        details = details ? `${details} (Target: ${activity.targetUser.name})` : `Target: ${activity.targetUser.name}`;
    }
    return details;
};

export default function AdminActivityLogPage() {
    const { data: session, status } = useSession();

    // Use SWR for data fetching. Fetch only when authenticated.
    const swrKey = status === 'authenticated' ? '/api/admin/activity' : null;
    const { data, error, isLoading } = useSWR(swrKey, fetcher, {
        revalidateOnFocus: true, // Revalidate when window gets focus
        // refreshInterval: 60000, // Optional: Refresh every 60 seconds
    });

    // Extract activities safely, defaulting to an empty array
    const activities = data?.activities || [];

    // Determine overall loading state considering session status and SWR loading
    const combinedLoading = status === 'loading' || (status === 'authenticated' && isLoading);

    // Animation variants for the list container
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08, // Stagger animation for each item
            },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-200 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-transparent bg-clip-text">
                    Admin Activity Log
                </h1>
                <p className="text-sm text-slate-400 mb-8">
                    Monitor recent actions performed within the admin panel.
                </p>
            </motion.div>

            {/* TODO: Add filtering/search controls here */}
            {/* <div className="mb-6"> ... filters ... </div> */}

            {/* Activity List Container */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/20 p-4 sm:p-6 backdrop-blur-lg">
                <AnimatePresence mode="wait"> {/* Use mode="wait" for smooth transitions between states */}
                    {combinedLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 text-slate-400"
                        >
                            <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
                            <p className="text-lg font-medium">Loading Activities...</p>
                            <p className="text-sm text-slate-500">Fetching the latest logs.</p>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center text-center py-16 text-red-400 border border-red-600/30 bg-gradient-to-br from-red-900/20 to-red-950/30 rounded-xl p-6"
                        >
                             <ServerCrash className="h-12 w-12 mb-4 text-red-500/80" />
                             <p className="text-xl font-semibold mb-1">Failed to Load Activities</p>
                             <p className="text-sm text-red-300/80">{error.message || 'An unexpected error occurred.'}</p>
                        </motion.div>
                     ) : status === 'unauthenticated' ? (
                         <motion.div
                            key="unauthenticated"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center text-center py-16 text-yellow-400 border border-yellow-600/30 bg-gradient-to-br from-yellow-900/20 to-yellow-950/30 rounded-xl p-6"
                         >
                            <ShieldAlert className="h-12 w-12 mb-4 text-yellow-500/80" />
                            <p className="text-xl font-semibold mb-1">Access Denied</p>
                            <p className="text-sm text-yellow-300/80">Please log in as an administrator to view this page.</p>
                        </motion.div>
                    ) : activities.length === 0 ? (
                        <motion.div
                            key="no-activity"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center text-center py-16 text-slate-500"
                        >
                            <History className="h-12 w-12 mb-4 text-slate-600" />
                            <p className="text-xl font-semibold mb-1">No Recent Activity</p>
                            <p className="text-sm text-slate-600">There are no activity logs to display at this time.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="activity-list"
                            className="space-y-3"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {activities.map((activity) => (
                                <ActivityItem
                                    key={activity._id}
                                    // Removed avatar prop
                                    name={activity.user?.name || 'System/Unknown User'}
                                    action={activity.action} // Pass the raw action type
                                    details={formatDetails(activity)} // Pass formatted details
                                    time={moment(activity.createdAt).fromNow()} // Use moment.js
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
