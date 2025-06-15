'use client';

import React, { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import moment from 'moment'; // Import moment library
import { Plus, ClipboardCopy, Check, User, ShieldAlert, CheckCircle, KeyRound, CalendarClock, CalendarCheck, Users, X, Trash2, AlertTriangle, Loader2, Filter as FilterIcon, ChevronLeft, ChevronRight, Clock as ClockIcon, ArrowUpNarrowWide, ArrowDownNarrowWide, XCircle } from 'lucide-react'; // Added Sort Icons and XCircle

// --- SWR/Basic Fetcher ---
const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch (parseError) {
            throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
        }
        const message = errorData?.message || res.statusText || `An error occurred. Status: ${res.status}`;
        const error = new Error(message);
        error.info = errorData;
        error.status = res.status;
        throw error;
    }
    const data = await res.json();
    // Return the full data object, the component will extract .referrals
    return data;
};


// --- Create Referral Modal Component ---
// Added currentUserRole prop
const CreateReferralModal = ({ isOpen, onClose, onReferralCreated, currentUserRole }) => {
    // Default to 'user', especially if currentUserRole is not super-admin
    const [targetRole, setTargetRole] = useState('user');
    const [expiresAt, setExpiresAt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        let timeoutId;
        if (isOpen) {
            // Reset targetRole to 'user' when opening, especially if the current user is not super-admin
            setTargetRole(currentUserRole === 'super-admin' ? 'user' : 'user'); // Keep 'user' as default
            setExpiresAt('');
            setError(null);
            setIsLoading(false);
            timeoutId = setTimeout(() => setShowContent(true), 50);
        } else {
            setShowContent(false);
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen, currentUserRole]); // Add currentUserRole dependency

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        const body = { targetRole };
        if (expiresAt) {
            const expiryDate = new Date(expiresAt);
            expiryDate.setUTCHours(23, 59, 59, 999);
            body.expiresAt = expiryDate.toISOString();
        }
        try {
            const response = await fetch('/api/admin/referrals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                let errorData; try { errorData = await response.json(); } catch (parseError) { /* ignore */ }
                throw new Error(errorData?.message || 'Failed to create referral code');
            }
            const newReferralData = await response.json();
            // API might return { referral: {...} } or just {...}
            const newReferral = newReferralData.referral || newReferralData;
            // IMPORTANT: Ensure newReferral includes essential fields like _id and code
            // Populated fields like createdBy might be missing here, SWR revalidation will fetch them later.
            onReferralCreated(newReferral); // Pass the created referral data back
            handleClose(); // Close modal on success
        } catch (err) {
            console.error("Failed to create referral:", err); // Use console.error
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };


    const handleClose = () => {
        setShowContent(false);
        setTimeout(onClose, 300);
    };

    const handleBgClick = (e) => { if (e.target === e.currentTarget) handleClose(); };

    if (!isOpen && !showContent) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen && showContent ? 'opacity-100' : 'opacity-0'} bg-black/70 backdrop-blur-sm`} onClick={handleBgClick}>
            <div className={`relative w-full max-w-md transform overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-black text-left align-middle shadow-2xl ring-1 ring-white/10 transition-all duration-300 ease-in-out ${isOpen && showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-gray-100">Create New Referral Code</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900" aria-label="Close modal"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label htmlFor="targetRole" className="block text-sm font-medium text-gray-300 mb-1">Target Role</label>
                        <select
                            id="targetRole"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="user">User</option>
                            {/* Only show 'Admin' option if current user is super-admin */}
                            {currentUserRole === 'super-admin' && (
                                <option value="admin">Admin</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-300 mb-1">Expires At (Optional)</label>
                        <input type="date" id="expiresAt" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        <p className="text-xs text-gray-500 mt-1">Code will expire at the end of the selected day (UTC).</p>
                    </div>
                    {error && (<div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm">{error}</div>)}
                    <div className="flex justify-end space-x-3 pt-3">
                        <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-100 font-semibold rounded-md transition duration-200 ease-in-out disabled:opacity-50">Cancel</button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="min-w-[120px] inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-70 disabled:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5 mr-2" /> // Use Loader2 icon
                            ) : (
                                <Plus className="h-5 w-5 mr-1" /> // Keep Plus icon for non-loading state
                            )}
                            {isLoading ? 'Creating...' : 'Create Code'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Helper component for copying code ---
const CopyButton = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code);
                setCopied(true);
            } else {
                // Fallback for older browsers or environments without navigator.clipboard
                const textarea = document.createElement('textarea');
                textarea.value = code;
                textarea.style.position = 'fixed'; // Avoid scrolling to bottom
                textarea.style.opacity = '0'; // Make it invisible
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy'); // Deprecated but widely supported fallback
                document.body.removeChild(textarea);
                setCopied(true);
            }
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Optionally, provide user feedback that copying failed
            // alert('Failed to copy code. Please try manually.');
        }
    };

    return (
        <button onClick={handleCopy} className="ml-2 p-1 text-gray-400 hover:text-gray-100 transition duration-150 ease-in-out focus:outline-none" title="Copy code">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
        </button>
    );
};


// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Confirm Action", message, confirmText = "Confirm", cancelText = "Cancel", confirmButtonStyle = "bg-red-600 hover:bg-red-500 focus-visible:ring-red-500" }) => {
    const [showContent, setShowContent] = useState(false);
    React.useEffect(() => {
        let timeoutId; if (isOpen) timeoutId = setTimeout(() => setShowContent(true), 50); else setShowContent(false); return () => clearTimeout(timeoutId);
    }, [isOpen]);
    const handleBgClick = (e) => { if (e.target === e.currentTarget) handleClose(); };
    const handleClose = () => { setShowContent(false); setTimeout(onClose, 300); };
    const handleConfirm = () => { onConfirm(); };
    if (!isOpen && !showContent) return null;
    return (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen && showContent ? 'opacity-100' : 'opacity-0'} bg-black/80 backdrop-blur-md`} onClick={handleBgClick}>
            <div className={`relative w-full max-w-md transform overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-black text-left align-middle shadow-2xl ring-1 ring-white/10 transition-all duration-300 ease-in-out ${isOpen && showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                        <h3 className="text-lg font-semibold leading-6 text-slate-100">{title}</h3>
                    </div>
                    <button onClick={handleClose} aria-label="Close confirmation" className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"><X className="h-5 w-5" /></button>
                </div>
                <div className="px-6 py-5"><p className="text-sm text-slate-300 whitespace-pre-wrap">{message}</p></div>
                <div className="flex justify-end space-x-4 px-6 py-4 border-t border-white/10 bg-black/10">
                    <button type="button" onClick={handleClose} className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50">{cancelText}</button>
                    <button type="button" onClick={handleConfirm} className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition ${confirmButtonStyle}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};


// --- Referral Card Component (with Delete Button) ---
const ReferralCard = ({ referral, formatDate, onDelete, isDeleting }) => {
    // Destructure with defaults for safety, especially for optimistically added items
    const { _id, code = '...', createdBy = {}, targetRole = 'user', isUsed = false, usedBy = [], createdAt, expiresAt } = referral;

    // --- Data Processing ---
    const validUsedBy = Array.isArray(usedBy) ? usedBy : [];
    const usedCount = validUsedBy.length;
    const isExpired = expiresAt && new Date(expiresAt) < new Date();
    // Status Logic: Expired > Used > Available
    const currentStatus = isExpired ? 'Expired' : (usedCount > 0 ? 'Used' : 'Available');

    // --- Minimal Dynamic Styling ---
    const roleIcon = targetRole === 'admin'
        ? <ShieldAlert className="w-4 h-4 text-purple-400" />
        : <User className="w-4 h-4 text-blue-400" />;

    let statusIcon;
    let statusTextColor;
    if (isExpired) {
        statusIcon = <ClockIcon className="w-4 h-4 text-slate-500" />;
        statusTextColor = 'text-slate-500';
    } else if (usedCount > 0) {
        statusIcon = <XCircle className="w-4 h-4 text-amber-500" />;
        statusTextColor = 'text-amber-500';
    } else {
        statusIcon = <CheckCircle className="w-4 h-4 text-green-500" />;
        statusTextColor = 'text-green-500';
    }

    return (
        <div className="group/card relative bg-white/[0.02] border border-white/[0.08] rounded-lg p-6 transition-colors hover:bg-white/[0.04]">

            {/* Minimal Delete Button */}
            <button
                onClick={() => onDelete(referral)}
                disabled={isDeleting}
                className="absolute top-4 right-4 opacity-0 group-hover/card:opacity-100 p-1.5 text-slate-500 hover:text-red-400 transition-all disabled:opacity-30"
                aria-label={`Delete referral code ${code}`}
            >
                {isDeleting ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : (
                    <Trash2 className="h-4 w-4" />
                )}
            </button>

            <div className="space-y-5 pr-8">
                {/* Code Section */}
                <div className="flex items-center space-x-3">
                    <KeyRound className="w-5 h-5 text-teal-400" />
                    <code className="text-xl font-mono text-white font-medium tracking-wide break-all">
                        {code}
                    </code>
                    <CopyButton code={code} />
                </div>

                {/* Status Badges */}
                <div className="flex items-center space-x-4 text-sm">
                    <div className={`flex items-center space-x-1.5 ${statusTextColor}`}>
                        {statusIcon}
                        <span>{currentStatus}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                        {roleIcon}
                        <span>
                            {targetRole ? targetRole.charAt(0).toUpperCase() + targetRole.slice(1) : 'Unknown Role'} Referral
                        </span>
                    </div>
                </div>

                {/* User Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-medium">Created By</div>
                        <div className="flex items-center space-x-2 text-sm text-slate-200">
                            <User className="w-4 h-4 text-slate-500" />
                            <span>{createdBy?.name || <span className="italic text-slate-500">System/Unknown</span>}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-medium">Times Used</div>
                        <div className="flex items-center space-x-2 text-sm">
                            <Users className={`w-4 h-4 ${usedCount > 0 ? 'text-teal-400' : 'text-slate-500'}`} />
                            <span className={`${usedCount === 0 ? 'text-slate-500 italic' : 'text-slate-200 font-medium'}`}>
                                {usedCount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Date Information */}
                <div className="space-y-2 text-xs text-slate-400 border-t border-white/[0.06] pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Created</span>
                        </div>
                        <span>{formatDate(createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                            <CalendarClock className="w-3.5 h-3.5" />
                            <span>Expires</span>
                        </div>
                        <span className={isExpired ? 'text-red-400 font-medium' : ''}>
                            {formatDate(expiresAt, true)} {/* Use moment().fromNow() for expiresAt */}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function AdminReferralsPage() {
    const { data: session, status: sessionStatus } = useSession(); // Get session data
    // State
    const [apiError, setApiError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({ title: '', message: '', onConfirm: () => { } });
    const [deletingReferralCode, setDeletingReferralCode] = useState(null);

    // --- Filter & Pagination State ---
    const [targetRoleFilter, setTargetRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(12);

    // --- Sort State ---
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc' for createdAt

    // --- Build API URL with Filters, Pagination & Sort ---
    const buildApiUrl = useCallback(() => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        if (targetRoleFilter) params.set('targetRole', targetRoleFilter);

        // Map frontend status filter to backend query params
        if (statusFilter === 'available') {
            params.set('isUsed', 'false');
            // Add check for expiration only if filtering for available
            // This assumes expired codes should not show as available
            params.set('expiresAt[gte]', new Date().toISOString());
        } else if (statusFilter === 'used') {
            params.set('isUsed', 'true');
        } else if (statusFilter === 'expired') {
            // Only check expiration if filtering for expired
            params.set('expiresAt[lt]', new Date().toISOString());
        }
        // Add sort param
        params.set('sort', sortOrder === 'asc' ? 'createdAt' : '-createdAt');

        const queryString = params.toString();
        return `/api/admin/referrals${queryString ? `?${queryString}` : ''}`;
    }, [page, limit, targetRoleFilter, statusFilter, sortOrder]); // Added sortOrder dependency

    const apiEndpoint = buildApiUrl();

    // --- SWR Hook ---
    // Correctly destructure and rename mutate
    const { data: apiResponse, error: fetchError, isLoading: swrLoading, isValidating, mutate: mutateReferrals } = useSWR(apiEndpoint, fetcher, {
        revalidateOnFocus: false, // Adjust as needed
        keepPreviousData: true, // Keep showing old data while loading new page/filters
        onError: (err, key) => {
            console.error(`SWR Error fetching ${key}:`, err); // Use console.error
            setApiError(err.message || 'Failed to load referral data.'); // Set apiError on fetch failure
        }
    });

    // Extract referrals from the API response object
    const displayReferrals = apiResponse?.referrals || [];
    // We need total count from API for better pagination, assuming 100 limit for now
    // const totalReferrals = apiResponse?.totalCount || 0;
    // const totalPages = Math.ceil(totalReferrals / limit);
    // Simple check: if we received fewer items than the limit, assume it's the last page
    const isLastPage = displayReferrals.length < limit;

    // Modal Controls
    const handleOpenModal = () => { setApiError(null); setIsModalOpen(true); }; // Clear error when opening modal
    const handleCloseModal = () => setIsModalOpen(false);
    const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

    // Helper to open confirmation modal
    const openConfirmationModal = (props) => {
        setConfirmModalProps({
            title: props.title || 'Confirm Action',
            message: props.message || '',
            confirmText: props.confirmText || 'Confirm',
            onConfirm: props.onConfirm || (() => { }),
            confirmButtonStyle: props.confirmButtonStyle || 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500' // Default red
        });
        setIsConfirmModalOpen(true);
    };

    // Handle referral creation - Use SWR mutate for UI update
    const handleReferralCreated = useCallback(async (newReferral) => {
        handleCloseModal(); // Close modal immediately
        // Optimistic Update: Prepend the new referral to the cached list
        try {
            // Use mutate to update the cache optimistically
            await mutateReferrals(
                (currentData = { referrals: [] }) => {
                    // Ensure newReferral has necessary fields for display
                    const referralToAdd = {
                        _id: newReferral._id || `temp-${Date.now()}`,
                        code: newReferral.code || '...',
                        createdBy: { name: 'You' }, // Assume current user created it
                        targetRole: newReferral.targetRole,
                        createdAt: newReferral.createdAt || new Date().toISOString(),
                        expiresAt: newReferral.expiresAt,
                        usedBy: [], // Assume not used initially
                        ...newReferral // Include any other fields returned by API
                    };
                    // Prepend to the existing referrals array
                    return { ...currentData, referrals: [referralToAdd, ...(currentData.referrals || [])] };
                },
                {
                    // No need for optimisticData if the update function returns the new data structure
                    rollbackOnError: true,
                    populateCache: true, // Update the cache with the new structure
                    revalidate: true // Revalidate in the background to get full server data
                }
            );
        } catch (error) {
            console.error("Optimistic create failed:", error); // Use console.error
            setApiError("Failed to add referral to the list.");
        }
    }, [mutateReferrals]);


    // Handle referral deletion - Use SWR mutate for UI update
    const handleDeleteReferral = (referralToDelete) => {
        const { code } = referralToDelete;
        if (!code) return;

        const performDelete = async () => {
            handleCloseConfirmModal();
            setApiError(null);
            setDeletingReferralCode(code); // For spinner on the specific card

            // Define the optimistic update function more robustly
            const optimisticUpdate = (currentData) => {
                // Ensure currentData is an object and has a referrals array
                const currentReferrals = Array.isArray(currentData?.referrals) ? currentData.referrals : [];
                const updatedReferrals = currentReferrals.filter(ref => ref.code !== code);
                // Return the full expected structure, handling potential null/undefined currentData
                return { ...(currentData || {}), referrals: updatedReferrals };
            };

            try {
                // Perform optimistic update and API call using SWR's mutate
                await mutateReferrals(
                    // This async function performs the actual API call AND returns the expected final state
                    async (currentData) => { // Use currentData provided by mutate
                        const response = await fetch(`/api/admin/referrals/${code}`, { method: 'DELETE' }); // Use direct path

                        if (!response.ok) {
                            let errorData; try { errorData = await response.json(); } catch (e) {/* ignore */ }
                            // Throwing error here triggers rollbackOnError
                            throw new Error(errorData?.message || `Failed to delete code: ${response.statusText}`);
                        }
                        // On successful API call, return the data structure that should be in the cache *after* the delete.
                        // We use the optimisticUpdate function with the data mutate provided to calculate this final state.
                        return optimisticUpdate(currentData);
                    },
                    {
                        // Provide the optimistic update *function* itself. SWR will call it with the current cache data.
                        optimisticData: optimisticUpdate, // Pass the function reference
                        // Automatically rollback the optimistic update if the fetch function throws an error
                        rollbackOnError: true,
                        // Update the SWR cache with the optimistic data *before* the async function resolves
                        populateCache: true,
                        // Avoid an immediate revalidation after the optimistic update completes
                        revalidate: false
                    }
                );

                // Optional: Show success toast here if needed
                // toast.success(`Referral code "${code}" deleted.`);

            } catch (err) {
                // Log the error and set the API error state for user feedback
                console.error("Delete referral error:", err);
                setApiError(err.message || 'An unknown error occurred during deletion.');
                // Rollback is handled automatically by SWR's rollbackOnError: true
            } finally {
                // Always clear the deleting state, regardless of success or failure
                setDeletingReferralCode(null);
            }
        };

        // Open the confirmation modal before performing the delete
        openConfirmationModal({
            title: "Delete Referral Code?",
            message: `Are you sure you want to permanently delete the code "${code}"? This action cannot be undone.`,
            confirmText: "Delete",
            confirmButtonStyle: "bg-red-600 hover:bg-red-500 focus-visible:ring-red-500",
            onConfirm: performDelete
        });
    };


    // Format Date Helper
    const formatDate = (dateString, useMomentFromNow = false) => {
        if (!dateString) return 'Never';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';

            if (useMomentFromNow) {
                return moment(date).fromNow();
            } else {
                const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
                return date.toLocaleString(undefined, options);
            }
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const isOperating = deletingReferralCode !== null;
    const isLoading = swrLoading || isValidating;

    // --- Filter Reset ---
    const clearFilters = () => {
        setTargetRoleFilter('');
        setStatusFilter('');
        setPage(1);
        setSortOrder('desc'); // Reset sort on filter clear
    };
    const hasActiveFilters = targetRoleFilter || statusFilter || sortOrder !== 'desc';

    // --- Sort Toggle ---
    const toggleSortOrder = () => {
        setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
        setPage(1); // Reset to page 1 when sort order changes
    };

    return (
        <div className="min-h-screen text-gray-100 p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-900 to-black">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                        Manage Referrals
                    </h1>
                    <button
                        onClick={handleOpenModal}
                        disabled={swrLoading || isOperating} // Disable while loading or operating
                        className="flex items-center text-xs sm:text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Code
                    </button>
                </div>

                 {/* Filter Section */}
                 <div className="mb-6 p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"> {/* Changed to 4 cols */}
                        {/* Target Role Filter */}
                        <div className="lg:col-span-1">
                            <label htmlFor="role-filter" className="block text-xs font-medium text-gray-400 mb-1.5">Filter by Role</label>
                            <select
                                id="role-filter"
                                value={targetRoleFilter}
                                onChange={(e) => { setTargetRoleFilter(e.target.value); setPage(1); }} // Reset page on filter change
                                className="w-full bg-gray-700/80 border border-gray-600/80 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition appearance-none bg-no-repeat bg-right pr-8"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.7rem center', backgroundSize: '1.2em 1.2em' }}
                            >
                                <option value="">All Roles</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="lg:col-span-1">
                            <label htmlFor="status-filter" className="block text-xs font-medium text-gray-400 mb-1.5">Filter by Status</label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} // Reset page on filter change
                                className="w-full bg-gray-700/80 border border-gray-600/80 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition appearance-none bg-no-repeat bg-right pr-8"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.7rem center', backgroundSize: '1.2em 1.2em' }}
                            >
                                <option value="">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="used">Used</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>

                        {/* Sort Toggle Button */}
                        <div className="flex flex-col items-start sm:items-end h-full">
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 invisible">Sort</label> {/* Placeholder label */}
                            <button
                                onClick={toggleSortOrder}
                                className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1.5"
                                title={`Sort by Creation Date (${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})`}
                            >
                                {sortOrder === 'desc' ? <ArrowDownNarrowWide size={14} /> : <ArrowUpNarrowWide size={14} />}
                                <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                            </button>
                        </div>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <div className="lg:col-span-4 flex justify-end pt-2"> {/* Span across all columns */}
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-gray-700/60 hover:bg-gray-600/80 transition-colors flex items-center space-x-1"
                                    title="Clear all filters"
                                >
                                    <X size={14} />
                                    <span>Clear Filters</span>
                                </button>
                            </div>
                        )}
                    </div>
                 </div>


                {/* Global API/Fetch Error (only shows if no modal is open) */}
                {apiError && !isModalOpen && !isConfirmModalOpen && (
                    <div className="mb-6 p-4 bg-red-900/50 text-red-300 border border-red-700/50 rounded-md shadow-lg" role="alert">
                        <p><strong className="font-semibold">Error:</strong> {apiError}</p>
                    </div>
                )}

                {/* Display Area */}
                <div className="relative min-h-[300px]"> {/* Added min-h for loading state */}
                     {/* Loading Overlay */}
                     {isLoading && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-10 rounded-lg">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                     )}

                    {/* Content: Error, Empty, or Cards */}
                    {fetchError && !isLoading && displayReferrals.length === 0 ? ( // Show error only if not loading and no data
                        <div className="p-6 text-center bg-red-900/30 border border-red-700/50 rounded-lg text-red-300">
                            Error loading data: {fetchError.message || 'Could not fetch referrals.'}
                        </div>
                    ) : !isLoading && displayReferrals.length === 0 ? ( // Show empty state only if not loading
                        <div className="p-10 text-center bg-gray-800/30 border border-gray-700/50 rounded-lg text-gray-500">
                            {hasActiveFilters ? 'No referral codes match the current filters.' : 'No referral codes found. Use the button above to create one.'}
                        </div>
                    ) : ( // Render cards if data exists (even if loading new data)
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {displayReferrals.map((referral) => (
                                <ReferralCard
                                    // Use _id if available, fallback to code for temporary key during optimistic update
                                    key={referral._id || referral.code}
                                    referral={referral}
                                    formatDate={formatDate}
                                    onDelete={handleDeleteReferral}
                                    // Pass true if this specific card is the one being deleted
                                    isDeleting={deletingReferralCode === referral.code}
                                />
                            ))}
                        </div>
                    )}
                </div>

                 {/* Pagination Controls */}
                 {!fetchError && displayReferrals.length > 0 && ( // Only show if there's data
                    <div className="flex justify-center items-center space-x-4 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-colors"
                        >
                            <ChevronLeft size={16} className="mr-1" />
                            Previous
                        </button>
                        <span className="text-sm text-gray-400">Page {page}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={isLastPage || isLoading} // Disable if on the last page or loading
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-colors"
                        >
                            Next
                            <ChevronRight size={16} className="ml-1" />
                        </button>
                    </div>
                 )}


                {/* Modals */}
                {/* Pass the current user's role to the modal */}
                <CreateReferralModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onReferralCreated={handleReferralCreated}
                    currentUserRole={session?.user?.role} // Pass role here
                />
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={handleCloseConfirmModal}
                    onConfirm={confirmModalProps.onConfirm}
                    title={confirmModalProps.title}
                    message={confirmModalProps.message}
                    confirmText={confirmModalProps.confirmText}
                    confirmButtonStyle={confirmModalProps.confirmButtonStyle}
                />
            </div>
        </div>
    );
}
