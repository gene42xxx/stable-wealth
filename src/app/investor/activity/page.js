'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

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

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-100 bg-gray-900 min-h-screen">
            <header className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Your Activity Log
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                    A record of your recent actions within the platform.
                </p>
            </header>

            {activities.length === 0 ? (
                <div className="text-center py-10 bg-gray-800 rounded-lg shadow-xl">
                    <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-xl font-medium text-gray-300">No activities found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        You haven't performed any logged actions yet.
                    </p>
                </div>
            ) : (
                <div className="bg-gray-800 shadow-2xl rounded-lg overflow-hidden">
                    <ul role="list" className="divide-y divide-gray-700">
                        {activities.map((activity, index) => (
                            <li key={activity._id || index} className="px-4 py-5 sm:px-6 hover:bg-gray-700/50 transition-colors duration-150">
                                <div className="flex items-center justify-between">
                                    <div className="truncate text-sm font-medium text-blue-400">{formatAction(activity.action)}</div>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                                            {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-400">
                                            {activity.details}
                                        </p>
                                    </div>
                                    {activity.targetUser && (
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>Target User: {activity.targetUser.slice(-6)}</p> {/* Display last 6 chars of ID for brevity */}
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ActivityPage;
