'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Loader2, ShieldAlert, CheckCircle, Star, DollarSign, Percent, CalendarDays, Info, Check, XCircle, AlertTriangle } from 'lucide-react'; // Added XCircle, AlertTriangle
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import toast from 'react-hot-toast'; // Keep for success/info messages for now

// Fetcher function for useSWR
const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        // Attach extra info to the error object.
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }
    return res.json();
};


// Helper to format features or provide default text
const formatFeatures = (features) => {
    if (!features || features.length === 0) {
        return <li className="text-gray-400 italic">No specific features listed.</li>;
    }
    return features.map((feature, index) => (
        <li key={index} className="flex items-center">
            <CheckCircle size={14} className="text-green-400 mr-2 flex-shrink-0" />
            <span>{feature}</span>
        </li>
    ));
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, planName }) => {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose} // Close on backdrop click
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-b from-gray-800 to-gray-900 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-gray-700/50 relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="flex justify-center mb-4">
                     <AlertTriangle size={40} className="text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-center text-white mb-3">Confirm Plan Change</h2>
                <p className="text-center text-gray-300 mb-6">
                    Are you sure you want to change your subscription to the <strong className="text-cyan-300">{planName}</strong> plan?
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-md transition-all duration-200"
                    >
                        Confirm Change
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Animated Notification Component (Handles Success & Error) ---
const AnimatedNotification = ({ isVisible, message, type = 'success', onClose }) => {
    if (!isVisible) return null;

    const isError = type === 'error';
    const gradient = isError
        ? 'from-red-500 via-rose-600 to-pink-600' // Error gradient
        : 'from-emerald-500 via-green-500 to-teal-600'; // Success gradient
    const borderColor = isError ? 'border-red-400/40' : 'border-green-400/30';
    const Icon = isError ? ShieldAlert : CheckCircle; // Use ShieldAlert for errors

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="fixed top-5 right-5 z-[100] p-0 w-full max-w-sm"
        >
            <div className={`bg-gradient-to-br ${gradient} text-white p-4 rounded-lg shadow-xl flex items-center justify-between border ${borderColor}`}>
                <div className="flex items-center">
                    <Icon size={20} className="mr-3 flex-shrink-0 text-white/90" />
                    <span className="text-sm font-medium">{message}</span>
                </div>
                <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/25 transition-colors">
                    <XCircle size={18} className="text-white/80" /> {/* Keep close icon consistent */}
                </button>
            </div>
        </motion.div>
    );
};

export default function InvestorPlansPage() {
    const [subscribingPlanId, setSubscribingPlanId] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [planToChangeDetails, setPlanToChangeDetails] = useState({ id: null, name: '' });
    // const [planError, setPlanError] = useState({ id: null, message: null }); // Replaced by unified notification state
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessageContent, setSuccessMessageContent] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false); // State for error notification
    const [errorMessageContent, setErrorMessageContent] = useState(''); // State for error message content

    // Fetch available plans
    const { data: plansData, error: plansError, isLoading: isLoadingPlans } = useSWR('/api/investor/plans', fetcher);

    // Fetch user's current subscription status
    const { data: subscriptionData, error: subscriptionError, isLoading: isLoadingSubscription } = useSWR('/api/investor/subscription', fetcher);

    const currentSubscription = subscriptionData?.subscription;
    const isLoading = isLoadingPlans || isLoadingSubscription;

    // Function to actually perform the plan change API call
    const executePlanChange = async () => {
        if (!planToChangeDetails.id) return;

        setIsConfirmModalOpen(false);
        setSubscribingPlanId(planToChangeDetails.id);
        // setPlanError({ id: null, message: null }); // Clear previous errors - Handled by notification state
        setShowErrorMessage(false); // Clear previous error notifications

        try {
            const response = await fetch('/api/investor/subscription/change', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPlanId: planToChangeDetails.id }),
            });
            const result = await response.json();

            if (!response.ok) {
                let errorMessage = result.message || 'Failed to change plan';
                if (result.currentBalance !== undefined) {
                    errorMessage += ` (Current Balance: ${result.currentBalance.toFixed(2)} USDT)`;
                }
                throw new Error(errorMessage);
            }

            // toast.success(`Successfully changed subscription to ${planToChangeDetails.name}!`); // Replace toast
            setSuccessMessageContent(`Successfully changed subscription to ${planToChangeDetails.name}!`);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 4000); // Auto-hide

            mutate('/api/investor/subscription'); // Revalidate
            // setPlanError({ id: null, message: null }); // Clear error on success - Handled by notification state
        } catch (error) {
            console.log("Change Plan error:", error);
            const message = error.message || "An unexpected error occurred.";
            // setPlanError({ id: planToChangeDetails.id, message: message }); // Replace with notification
            setErrorMessageContent(message);
            setShowErrorMessage(true);
            setTimeout(() => setShowErrorMessage(false), 5000); // Auto-hide error after 5 seconds
        } finally {
            setSubscribingPlanId(null);
            // No need to keep planToChangeDetails here, it's only relevant for the modal
        }
    };


    const handleSelectPlan = async (planId, planName) => {
        // setPlanError({ id: null, message: null }); // Clear previous errors - Handled by notification state
        setShowErrorMessage(false); // Clear previous error notifications on new action

        if (currentSubscription) {
            // --- Initiate Plan Change ---
            if (currentSubscription._id === planId) {
                toast.info("This is already your current plan.");
                return; // Do nothing if clicking the current plan
            }
            // Set state to open confirmation modal
            setPlanToChangeDetails({ id: planId, name: planName });
            setIsConfirmModalOpen(true);

        } else {
            // --- Handle Initial Subscription ---
            setSubscribingPlanId(planId); // Set loading state for this specific button
            let response; // Declare response here
            let successMessage; // Declare successMessage here
            try {
                response = await fetch('/api/investor/subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId }),
                });
                successMessage = `Successfully subscribed to ${planName}!`;

                // --- Process Response --- Moved inside the try block
                const result = await response.json();

                if (!response.ok) {
                    // Provide more specific feedback if available (e.g., balance error)
                    let errorMessage = result.message || 'Failed to subscribe to plan'; // Removed ternary as currentSubscription is false here
                    if (result.currentBalance !== undefined) {
                        errorMessage += ` (Current Balance: ${result.currentBalance.toFixed(2)} USDT)`;
                    }
                    throw new Error(errorMessage);
                }

                // toast.success(successMessage); // Replace toast with custom message
                setSuccessMessageContent(successMessage);
                setShowSuccessMessage(true);
                // Auto-hide after 4 seconds
                setTimeout(() => setShowSuccessMessage(false), 4000);

                // Revalidate subscription data to update UI
                mutate('/api/investor/subscription');
                // setPlanError({ id: null, message: null }); // Clear error on success - Handled by notification state
                // Optionally revalidate plans data if needed
                // mutate('/api/investor/plans');

            } catch (error) { // Catch block for the initial subscription try
                console.error("Subscription error:", error);
                const message = error.message || "An unexpected error occurred.";
                // setPlanError({ id: planId, message: message }); // Replace with notification
                setErrorMessageContent(message);
                setShowErrorMessage(true);
                setTimeout(() => setShowErrorMessage(false), 5000); // Auto-hide error after 5 seconds
            } finally { // Finally block for the initial subscription try
                setSubscribingPlanId(null); // Clear loading state regardless of outcome
            }
        } // End of else block (initial subscription)
    }; // End of handleSelectPlan function

    // Determine overall error state
    const error = plansError || subscriptionError;

    return (
        <div className="p-6 md:p-8 text-white min-h-screen">
            <h1 className="text-2xl md:text-3xl font-display capitalize my-10 font-normal bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Available investment plans
            </h1>

            {isLoading && (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <span className="ml-3">Loading Data...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-lg flex items-center">
                    <ShieldAlert size={20} className="mr-3" />
                    <div>
                        <p className="font-semibold">Error loading plans:</p>
                        <p className="text-sm">{error.message || 'An unknown error occurred.'}</p>
                    </div>
                </div>
            )}

            {/* Display plans only after loading is complete and no error occurred */}
            {!isLoading && !error && plansData?.plans && (
                <div className="grid grid-cols-1 md:grid-cols-2 pt-10 lg:grid-cols-3 gap-6">
                    {plansData.plans.length === 0 ? (
                        <div className="col-span-full text-center py-10 bg-gray-800/40 rounded-lg border border-gray-700/50">
                            <Info size={24} className="mx-auto mb-2 text-gray-500" />
                            <p className="text-gray-400">No investment plans are currently available.</p>
                            <p className="text-sm text-gray-500 mt-1">Please check back later or contact support.</p>
                        </div>
                    ) : (
                        plansData.plans.map((plan, index) => (
                            <motion.div
                                key={plan._id}
                                className="bg-gradient-to-br from-gray-800/60 to-gray-900/70 border border-gray-700/50 rounded-xl shadow-lg p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-colors duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <div>
                                    <h2 className="text-2xl font-semibold mb-1 text-cyan-300">{plan.name}</h2>
                                    <p className="text-sm text-gray-400 mb-4 flex items-center">
                                        <Star size={14} className="mr-1.5 text-yellow-400" /> Level {plan.level}
                                    </p>

                                    <div className="space-y-3 mb-6 text-sm">
                                        <div className="flex items-center justify-between border-b border-gray-700/50 pb-2">
                                            <span className="flex items-center text-gray-300"><DollarSign size={14} className="mr-1.5 text-green-400" /> Weekly Requirement</span>
                                            <span className="font-medium text-white">{plan.weeklyRequiredAmount?.toFixed(2) ?? 'N/A'} USDT</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-gray-700/50 pb-2">
                                            <span className="flex items-center text-gray-300"><Percent size={14} className="mr-1.5 text-purple-400" /> Daily Profit Rate</span>
                                            <span className="font-medium text-white">{plan.profitRateDaily?.toFixed(2) ?? 'N/A'}%</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-gray-700/50 pb-2">
                                            <span className="flex items-center text-gray-300"><CalendarDays size={14} className="mr-1.5 text-orange-400" /> Min. Withdraw Weeks</span>
                                            <span className="font-medium text-white">{plan.withdrawalConditions?.minWeeks ?? 'N/A'}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-semibold mb-2 text-gray-300">Features:</h3>
                                    <ul className="space-y-1.5 text-xs text-gray-300 list-inside mb-6">
                                        {formatFeatures(plan.features)}
                                        {/* Display bonus rates if they exist */}
                                        {plan.bonusRateThresholds && plan.bonusRateThresholds.length > 0 && (
                                            <li className="flex items-center pt-1 mt-1 border-t border-gray-700/30">
                                                <Info size={14} className="text-blue-400 mr-2 flex-shrink-0" />
                                                <span>Includes bonus profit rates based on balance.</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                {/* Corrected Button Logic */}
                                <motion.button
                                    onClick={() => handleSelectPlan(plan._id, plan.name)}
                                    className={`w-full mt-4 px-4 py-2 rounded-lg text-white font-semibold transition-all text-sm shadow-md flex items-center justify-center ${currentSubscription?._id === plan._id
                                        ? 'bg-green-600 cursor-default' // Style for the currently active plan
                                        : subscribingPlanId === plan._id
                                            ? 'bg-yellow-600 cursor-wait' // Style while this specific button is loading
                                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 hover:shadow-lg' // Default selectable/changeable style
                                        }`}
                                    disabled={subscribingPlanId === plan._id || (currentSubscription?._id === plan._id)} // Disable only if loading OR if it's the current plan
                                    whileHover={!(currentSubscription?._id === plan._id) ? { scale: 1.03 } : {}} // Apply hover effect unless it's the current plan
                                    whileTap={!(currentSubscription?._id === plan._id) ? { scale: 0.98 } : {}} // Apply tap effect unless it's the current plan
                                >
                                    {subscribingPlanId === plan._id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : currentSubscription?._id === plan._id ? (
                                        <Check size={16} className="mr-1.5" />
                                    ) : null}
                                    {subscribingPlanId === plan._id
                                        ? (currentSubscription ? 'Changing...' : 'Subscribing...') // Dynamic loading text
                                        : currentSubscription?._id === plan._id
                                            ? 'Current Plan'
                                            : currentSubscription
                                                ? 'Change to Plan' // Text for changing to a different plan
                                                : 'Select Plan'}
                                </motion.button>

                                {/* Removed plan-specific error message display below button */}
                                {/* {planError.id === plan._id && planError.message && ( ... )} */}
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* --- Render Confirmation Modal --- */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executePlanChange}
                planName={planToChangeDetails.name}
            />

            {/* --- Render Animated Notifications --- */}
            <AnimatePresence>
                {showSuccessMessage && (
                    <AnimatedNotification
                        key="success-notif" // Add key for AnimatePresence
                        isVisible={showSuccessMessage}
                        message={successMessageContent}
                        type="success"
                        onClose={() => setShowSuccessMessage(false)}
                    />
                )}
                {showErrorMessage && (
                    <AnimatedNotification
                        key="error-notif" // Add key for AnimatePresence
                        isVisible={showErrorMessage}
                        message={errorMessageContent}
                        type="error"
                        onClose={() => setShowErrorMessage(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
