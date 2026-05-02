'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ServerCrash, ShieldAlert, History, User, Settings, Lock, Database, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react'; // Added more specific icons
import moment from 'moment';

// --- SWR fetcher function ---
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

// --- Helper to extract & format details ---
const formatDetails = (activity) => {
    let details = activity.details || 'No additional details provided.';
    if (activity.targetUser?.name && !details.toLowerCase().includes(activity.targetUser.name.toLowerCase())) {
        details = details !== 'No additional details provided.'
            ? `${details} (Target: ${activity.targetUser.name})`
            : `Target User: ${activity.targetUser.name}`;
    }
    return details;
};

// --- ActivityItem Component (Redesigned) ---
const ActivityItem = ({ name, action, details, time }) => {
    // Helper to get dynamic icon and color based on action type
    const getActionVisuals = (actionType) => {
        const lowerAction = actionType.toLowerCase();
        if (lowerAction.includes('login') || lowerAction.includes('logout')) return { icon: <User className="h-5 w-5" />, color: 'text-sky-400' };
        if (lowerAction.includes('create') || lowerAction.includes('add')) return { icon: <CheckCircle className="h-5 w-5" />, color: 'text-emerald-400' };
        if (lowerAction.includes('update') || lowerAction.includes('edit')) return { icon: <Settings className="h-5 w-5" />, color: 'text-indigo-400' };
        if (lowerAction.includes('delete') || lowerAction.includes('remove')) return { icon: <AlertTriangle className="h-5 w-5" />, color: 'text-rose-400' };
        if (lowerAction.includes('permission') || lowerAction.includes('access')) return { icon: <Lock className="h-5 w-5" />, color: 'text-purple-400' };
        if (lowerAction.includes('data')) return { icon: <Database className="h-5 w-5" />, color: 'text-teal-400' };
        if (lowerAction.includes('error') || lowerAction.includes('fail')) return { icon: <AlertCircle className="h-5 w-5" />, color: 'text-red-400' };
        return { icon: <Info className="h-5 w-5" />, color: 'text-slate-400' };
    };

    const { icon: ActionIcon, color: iconColor } = getActionVisuals(action);

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
    };

    return (
        <motion.div
            className="flex items-start bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 sm:p-5 transition-all duration-300 ease-in-out
                       hover:bg-slate-700/60 hover:border-slate-600/70 cursor-pointer shadow-md hover:shadow-lg"
            variants={itemVariants}
            whileHover={{ scale: 1.01, boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}
            whileTap={{ scale: 0.99 }}
        >
            <div className={`flex-shrink-0 mr-4 mt-1 p-2 rounded-full ${iconColor} bg-slate-700/70`}>
                {ActionIcon}
            </div>
            <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                    <p className="text-base font-semibold text-slate-100 mb-1 sm:mb-0">
                        {name} <span className="text-sm font-normal text-slate-400 italic">({action.replace(/_/g, ' ')})</span>
                    </p>
                    <div className="text-xs text-slate-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {time}
                    </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                    {details}
                </p>
            </div>
        </motion.div>
    );
};

// --- Main AdminActivityLogPage Component ---
export default function AdminActivityLogPage() {
    const { data: session, status } = useSession();

    const swrKey = status === 'authenticated' ? '/api/admin/activity' : null;
    const { data, error, isLoading } = useSWR(swrKey, fetcher, {
        revalidateOnFocus: true,
        // refreshInterval: 30000, // Refresh every 30 seconds for near real-time updates
    });

    const activities = data?.activities || [];
    const combinedLoading = status === 'loading' || (status === 'authenticated' && isLoading);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07, // Slightly faster stagger
                delayChildren: 0.2, // Delay before children start animating
            },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-black text-slate-200 p-4 sm:p-8 lg:p-12 font-sans relative overflow-hidden">
            {/* Background Gradients/Blobs - for ultra-modern feel */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-12 text-center"
                >
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-transparent bg-clip-text drop-shadow-2xl">
                        Admin Activity Log
                    </h1>
                    <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto">
                        A comprehensive, real-time overview of critical administrative actions and system events.
                    </p>
                </motion.div>

                {/* Main Activity Log Container */}
                <div className="bg-slate-900/40 border border-slate-700/60 rounded-3xl shadow-3xl shadow-black/30 p-5 sm:p-8 lg:p-10 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {combinedLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-24 text-slate-400"
                            >
                                <Loader2 className="h-14 w-14 text-cyan-500 animate-spin-slow mb-6 drop-shadow-xl" />
                                <p className="text-xl sm:text-2xl font-medium mb-3">Loading Activity Stream...</p>
                                <p className="text-base text-slate-500">Retrieving the latest administrator actions.</p>
                            </motion.div>
                        ) : error ? (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center text-center py-24 text-red-400 border border-red-700/40 bg-gradient-to-br from-red-900/20 to-red-950/40 rounded-2xl p-8 shadow-inner shadow-red-950/60"
                            >
                                <ServerCrash className="h-16 w-16 mb-6 text-red-500/80" />
                                <p className="text-2xl sm:text-3xl font-semibold mb-3">Failed to Load Activities</p>
                                <p className="text-lg text-red-300/80 max-w-xl">{error.message || 'An unexpected error occurred. Please check your network or try again later.'}</p>
                            </motion.div>
                        ) : status === 'unauthenticated' ? (
                            <motion.div
                                key="unauthenticated"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center text-center py-24 text-yellow-400 border border-yellow-700/40 bg-gradient-to-br from-yellow-900/20 to-yellow-950/40 rounded-2xl p-8 shadow-inner shadow-yellow-950/60"
                            >
                                <ShieldAlert className="h-16 w-16 mb-6 text-yellow-500/80" />
                                <p className="text-2xl sm:text-3xl font-semibold mb-3">Access Denied</p>
                                <p className="text-lg text-yellow-300/80 max-w-xl">You must be logged in as an administrator to view this activity log. Please authenticate.</p>
                            </motion.div>
                        ) : activities.length === 0 ? (
                            <motion.div
                                key="no-activity"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center text-center py-24 text-slate-500"
                            >
                                <History className="h-16 w-16 mb-6 text-slate-600/80" />
                                <p className="text-2xl sm:text-3xl font-semibold mb-3">No Recent Activity Found</p>
                                <p className="text-lg text-slate-600 max-w-xl">There are no administrative activity logs to display at this time. New actions will appear here.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="activity-list"
                                className="space-y-4 sm:space-y-5" // Increased spacing between items
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {activities.map((activity) => (
                                    <ActivityItem
                                        key={activity._id}
                                        name={activity.user?.name || 'System/Unknown User'}
                                        action={activity.action}
                                        details={formatDetails(activity)}
                                        time={moment(activity.createdAt).fromNow()}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}