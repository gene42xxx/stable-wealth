'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { History, Clock, ArrowDownLeft, ArrowUpRight, RefreshCw, Shield, User as UserIcon } from 'lucide-react';

const ActivityPage = () => {
    const { data: session, status } = useSession();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchActivities = useCallback(async () => {
        if (status === 'authenticated') {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/investor/activity');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch activities: ${response.status}`);
                }
                const data = await response.json();
                setActivities(data.activities || []);
            } catch (err) {
                console.error("Error fetching activities:", err);
                setError(err.message);
                setActivities([]); // Clear activities on error
            } finally {
                setLoading(false);
            }
        } else if (status === 'unauthenticated') {
            setLoading(false);
            setError("User is not authenticated.");
        }
        // If status is 'loading', we wait for it to resolve
    }, [status]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    if (status === 'loading' || loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-lg">Loading activities...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-white bg-gray-900 min-h-screen">
                <h1 className="text-3xl font-bold mb-6 text-red-500">Error</h1>
                <p className="text-red-400 bg-red-900/30 p-4 rounded-md">{error}</p>
                <button
                    onClick={fetchActivities}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition duration-150"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="container mx-auto px-4 py-8 text-white bg-gray-900 min-h-screen">
                <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
                <p>You must be logged in to view this page.</p>
            </div>
        );
    }

    const formatAction = (action) => {
        if (!action) return 'N/A';
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getActionIcon = (action) => {
        const a = action?.toLowerCase() || '';
        if (a.includes('deposit')) return <ArrowDownLeft className="text-green-400" size={16} />;
        if (a.includes('withdraw')) return <ArrowUpRight className="text-red-400" size={16} />;
        if (a.includes('transfer')) return <RefreshCw className="text-blue-400" size={16} />;
        if (a.includes('login') || a.includes('auth')) return <Shield className="text-purple-400" size={16} />;
        return <History className="text-gray-400" size={16} />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 pb-10">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 relative z-10">
                <header className="mb-10">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent"
                    >
                        Activity Log
                    </motion.h1>
                    <p className="mt-2 text-gray-400 max-w-2xl">
                        A record of your recent actions and transactions within the platform.
                    </p>
                </header>

                {activities.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-800 shadow-xl">
                        <History className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                        <h3 className="text-xl font-medium text-gray-300">No activities found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            You haven't performed any logged actions yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {activities.map((activity, index) => (
                            <motion.div 
                                key={activity._id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gray-900/40 backdrop-blur-md border border-gray-800 hover:border-gray-700/50 rounded-xl p-4 md:p-5 transition-all duration-300 group"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-800/50 rounded-lg group-hover:bg-gray-800 transition-colors">
                                            {getActionIcon(activity.action)}
                                        </div>
                                        <div className="space-y-1 overflow-hidden">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm md:text-base font-semibold text-blue-400">
                                                    {formatAction(activity.action)}
                                                </h3>
                                                {activity.status && (
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                        activity.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                        {activity.status}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 break-words line-clamp-2 md:line-clamp-none">
                                                {activity.details}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-800">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Clock size={12} />
                                            <span className="whitespace-nowrap">
                                                {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                                            </span>
                                        </div>
                                        {activity.targetUser && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded-md text-[10px] text-gray-400">
                                                <UserIcon size={10} />
                                                <span>{activity.targetUser.slice(-6)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityPage;
