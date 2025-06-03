'use client';

import React, { useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { motion } from 'framer-motion'; // Import motion
import {
    Plus, Pencil, Trash2, CheckCircle, XCircle, X, Zap, Star, Briefcase,
    Crown, Award, ShieldCheck
} from 'lucide-react';

// --- SWR Fetcher ---
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
    return res.json();
};


// --- Enhanced Modal Component (for Create/Edit) ---
const Modal = ({ isOpen, onClose, title, children }) => {
    const [showContent, setShowContent] = useState(false);

    React.useEffect(() => {
        let timeoutId;
        if (isOpen) {
            // Small delay to allow background transition before content transition
            timeoutId = setTimeout(() => setShowContent(true), 50);
        } else {
            setShowContent(false); // Start content transition immediately on close
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen]);

    // Handle background click to close
    const handleBgClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    // Handle explicit close action
    const handleClose = () => {
        setShowContent(false);
        // Wait for content transition to finish before calling onClose prop
        setTimeout(onClose, 300);
    };

    // Don't render the modal container if it's closed and content is hidden
    if (!isOpen && !showContent) return null;

    return (
        <div
            // Background overlay
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out
                       ${isOpen && showContent ? 'opacity-100' : 'opacity-0'}
                       bg-black/70 backdrop-blur-sm`}
            onClick={handleBgClick} // Close on background click
            aria-modal="true"
            role="dialog"
        >
            <div
                // Modal content container
                className={`relative w-full max-w-lg transform overflow-hidden rounded-xl
                           bg-gradient-to-br from-slate-800 via-slate-900 to-black
                           text-left align-middle shadow-2xl ring-1 ring-white/10
                           transition-all duration-300 ease-in-out
                           ${isOpen && showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-white/10">
                    <h3 className="text-xl font-semibold leading-6 text-slate-100">{title}</h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close modal"
                        className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {/* Modal Body */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 max-h-[75vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Alert Modal Component ---
const AlertModal = ({ isOpen, onClose, title = "Alert", message }) => {
    const [showContent, setShowContent] = useState(false);

    React.useEffect(() => {
        let timeoutId;
        if (isOpen) {
            timeoutId = setTimeout(() => setShowContent(true), 50);
        } else {
            setShowContent(false);
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen]);

    const handleBgClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleClose = () => {
        setShowContent(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen && !showContent) return null;

    return (
        <div
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out
                       ${isOpen && showContent ? 'opacity-100' : 'opacity-0'}
                       bg-black/80 backdrop-blur-md`} // Higher Z-index, more blur
            onClick={handleBgClick}
            aria-modal="true"
            role="alertdialog"
        >
            <div
                className={`relative w-full max-w-md transform overflow-hidden rounded-xl
                           bg-gradient-to-br from-slate-800 via-slate-900 to-black
                           text-left align-middle shadow-2xl ring-1 ring-white/10
                           transition-all duration-300 ease-in-out
                           ${isOpen && showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold leading-6 text-slate-100">{title}</h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close alert"
                        className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{message}</p>
                </div>
                <div className="px-6 py-4 border-t border-white/10 bg-black/10 text-right">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Confirm Action", message, confirmText = "Confirm", cancelText = "Cancel" }) => {
    const [showContent, setShowContent] = useState(false);

    React.useEffect(() => {
        let timeoutId;
        if (isOpen) {
            timeoutId = setTimeout(() => setShowContent(true), 50);
        } else {
            setShowContent(false);
        }
        return () => clearTimeout(timeoutId);
    }, [isOpen]);

    const handleBgClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleClose = () => {
        setShowContent(false);
        setTimeout(onClose, 300);
    };

    const handleConfirm = () => {
        onConfirm(); // Call the confirmation callback
        // Assuming confirmation closes the modal implicitly via parent state update
        // If not, you might need handleClose() here too, depending on parent logic.
    };

    if (!isOpen && !showContent) return null;

    return (
        <div
            className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out
                       ${isOpen && showContent ? 'opacity-100' : 'opacity-0'}
                       bg-black/80 backdrop-blur-md`} // Highest Z-index
            onClick={handleBgClick}
            aria-modal="true"
            role="alertdialog"
        >
            <div
                className={`relative w-full max-w-md transform overflow-hidden rounded-xl
                           bg-gradient-to-br from-slate-800 via-slate-900 to-black
                           text-left align-middle shadow-2xl ring-1 ring-white/10
                           transition-all duration-300 ease-in-out
                           ${isOpen && showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold leading-6 text-slate-100">{title}</h3>
                    <button
                        onClick={handleClose}
                        aria-label="Close confirmation"
                        className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{message}</p>
                </div>
                <div className="flex justify-end space-x-4 px-6 py-4 border-t border-white/10 bg-black/10">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition-colors duration-150 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Enhanced Plan Form Component ---
const PlanForm = ({ initialData = {}, onSubmit, onCancel, isEdit = false, isMutating = false }) => {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        level: initialData.level || 0,
        weeklyRequiredAmount: initialData.weeklyRequiredAmount || 0,
        profitRateDaily: initialData.profitRateDaily || 0,
        description: initialData.description || '',
        features: initialData.features || [],
        bonusRateThresholds: initialData.bonusRateThresholds || [],
        withdrawalConditions: initialData.withdrawalConditions || { minWeeks: 4, penalties: [] },
        active: initialData.active === undefined ? true : initialData.active,
    });
    const [featureInput, setFeatureInput] = useState('');
    const [bonusThresholdInput, setBonusThresholdInput] = useState({ threshold: '', rate: '' });
    const [penaltyInput, setPenaltyInput] = useState({ min: '', max: '', penaltyPercentage: '' });

    // State for Alert Modal
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalTitle, setAlertModalTitle] = useState('Alert');
    const [alertModalMessage, setAlertModalMessage] = useState('');

    // Helper function to show alert modal
    const showAlertModal = (title, message) => {
        setAlertModalTitle(title);
        setAlertModalMessage(message);
        setAlertModalOpen(true);
    };

    // Handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Handle nested withdrawalConditions fields
        if (name.startsWith('withdrawalConditions.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                withdrawalConditions: {
                    ...prev.withdrawalConditions,
                    // Convert number inputs, handle empty string for clearing
                    [field]: type === 'number' ? (value === '' ? '' : Number(value)) : value
                }
            }));
            return; // Stop further processing
        }
        // Handle top-level fields
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                (type === 'number' ? (value === '' ? '' : Number(value)) : value)
        }));
    };

    const handleAddFeature = () => {
        if (featureInput.trim()) {
            setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
            setFeatureInput('');
        }
    };

    const handleRemoveFeature = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleBonusInputChange = (e) => {
        const { name, value } = e.target;
        setBonusThresholdInput(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    };

    const handleAddBonusThreshold = () => {
        const threshold = Number(bonusThresholdInput.threshold);
        const rate = Number(bonusThresholdInput.rate);
        if (threshold > 0 && rate > 0) {
            const exists = formData.bonusRateThresholds.some(t => t.threshold === threshold);
            if (exists) {
                showAlertModal('Duplicate Bonus Tier', `A bonus tier for balance $${threshold.toFixed(2)} already exists.`);
                return;
            }
            setFormData(prev => ({
                ...prev,
                bonusRateThresholds: [...prev.bonusRateThresholds, { threshold, rate }]
                    .sort((a, b) => a.threshold - b.threshold) // Keep sorted
            }));
            setBonusThresholdInput({ threshold: '', rate: '' }); // Reset input fields
        } else {
            showAlertModal('Invalid Input', "Please enter valid positive numbers for both Minimum Balance and Bonus Rate.");
        }
    };

    const handleRemoveBonusThreshold = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            bonusRateThresholds: prev.bonusRateThresholds.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handlePenaltyInputChange = (e) => {
        const { name, value } = e.target;
        setPenaltyInput(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    };

    const handleAddPenalty = () => {
        const minWeek = Number(penaltyInput.min);
        const maxWeek = Number(penaltyInput.max);
        const percentage = Number(penaltyInput.penaltyPercentage);

        if (minWeek >= 0 && maxWeek > minWeek && percentage >= 0) {
            // Check for overlapping ranges
            const overlaps = (formData.withdrawalConditions.penalties || []).some(p =>
                // Check if new range starts or ends within an existing range, or fully contains one
                (minWeek >= (p.weekRange?.min ?? -Infinity) && minWeek < (p.weekRange?.max ?? Infinity)) ||
                (maxWeek > (p.weekRange?.min ?? -Infinity) && maxWeek <= (p.weekRange?.max ?? Infinity)) ||
                (minWeek <= (p.weekRange?.min ?? -Infinity) && maxWeek >= (p.weekRange?.max ?? Infinity))
            );
            if (overlaps) {
                showAlertModal('Overlapping Rule', "The specified week range overlaps with an existing penalty rule.");
                return;
            }
            setFormData(prev => ({
                ...prev,
                withdrawalConditions: {
                    ...prev.withdrawalConditions,
                    penalties: [...(prev.withdrawalConditions.penalties || []), { weekRange: { min: minWeek, max: maxWeek }, penaltyPercentage: percentage }]
                        .sort((a, b) => (a.weekRange?.min ?? 0) - (b.weekRange?.min ?? 0)) // Keep sorted
                }
            }));
            setPenaltyInput({ min: '', max: '', penaltyPercentage: '' }); // Reset input fields
        } else {
            showAlertModal('Invalid Input', "Please enter valid penalty details (Min Week >= 0, Max Week > Min Week, Penalty % >= 0).");
        }
    };

    const handleRemovePenalty = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            withdrawalConditions: {
                ...prev.withdrawalConditions,
                penalties: (prev.withdrawalConditions.penalties || []).filter((_, index) => index !== indexToRemove)
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Sanitize and format data before submitting
        const dataToSend = {
            ...formData,
            // Ensure numbers are numbers, default to 0 if invalid/empty
            level: Number(formData.level) || 0,
            weeklyRequiredAmount: Number(formData.weeklyRequiredAmount) || 0,
            profitRateDaily: Number(formData.profitRateDaily) || 0,
            withdrawalConditions: {
                ...formData.withdrawalConditions,
                minWeeks: Number(formData.withdrawalConditions.minWeeks) || 0,
                penalties: (formData.withdrawalConditions.penalties || []).map(p => ({
                    ...p,
                    weekRange: {
                        min: Number(p.weekRange?.min) || 0,
                        max: Number(p.weekRange?.max) || 0,
                    },
                    penaltyPercentage: Number(p.penaltyPercentage) || 0
                }))
            },
            bonusRateThresholds: (formData.bonusRateThresholds || []).map(b => ({
                threshold: Number(b.threshold) || 0,
                rate: Number(b.rate) || 0
            }))
        };
        onSubmit(dataToSend);
    };

    // Reusable Styles
    const inputBaseStyle = `block w-full rounded-md border-0 bg-white/5 py-2 px-3.5 text-slate-100 shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all duration-150 ease-in-out placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed`;
    const labelStyle = "block text-sm font-medium leading-6 text-slate-300 mb-1.5";
    const sectionBorderStyle = "border-t border-white/10 pt-5 mt-5";
    const addButtonBaseStyle = `inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-150 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50`;
    const addButtonStyle = `${addButtonBaseStyle} bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600`;
    const removeButtonStyle = `ml-2 p-1 rounded text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50`;

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Info Fields */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                        <label htmlFor="name" className={labelStyle}>Plan Name</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputBaseStyle} placeholder="e.g., Starter Tier" disabled={isMutating} />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="level" className={labelStyle}>Level</label>
                        <span className="block text-xs text-slate-400 mb-1">Plan tier ranking (1,2,3...)</span>
                        <input type="number" name="level" id="level" value={formData.level} onChange={handleChange} required min="0" className={inputBaseStyle} placeholder="1" disabled={isMutating} />
                    </div>
                    <div className="sm:col-span-4">
                        <label htmlFor="weeklyRequiredAmount" className={labelStyle}>Weekly Deposit ($)</label>
                        <input type="number" name="weeklyRequiredAmount" id="weeklyRequiredAmount" value={formData.weeklyRequiredAmount} onChange={handleChange} required min="0" step="0.01" className={inputBaseStyle} placeholder="100.00" disabled={isMutating} />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="profitRateDaily" className={labelStyle}>Base Daily Profit (%)</label>
                        <input type="number" name="profitRateDaily" id="profitRateDaily" value={formData.profitRateDaily} onChange={handleChange} required min="0" step="0.01" className={inputBaseStyle} placeholder="1.5" disabled={isMutating} />
                    </div>
                    <div className="sm:col-span-6">
                        <label htmlFor="description" className={labelStyle}>Description</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className={`${inputBaseStyle} leading-6`} placeholder="Briefly describe the plan..." disabled={isMutating}></textarea>
                    </div>
                </div>

                {/* Features Section */}
                <div className={sectionBorderStyle}>
                    <label className={`${labelStyle} !mb-2`}>Features</label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={featureInput}
                            onChange={(e) => setFeatureInput(e.target.value)}
                            placeholder="Add a feature description"
                            className={`${inputBaseStyle} flex-grow`}
                            disabled={isMutating}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }} // Add on Enter key
                        />
                        <button type="button" onClick={handleAddFeature} className={addButtonStyle} disabled={isMutating}>Add</button>
                    </div>
                    <ul className="mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {formData.features.map((feature, index) => (
                            <li key={index} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm text-slate-300">
                                <span>{feature}</span>
                                <button type="button" onClick={() => handleRemoveFeature(index)} className={removeButtonStyle} aria-label={`Remove feature: ${feature}`} disabled={isMutating}>
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Bonus Tiers Section */}
                <div className={sectionBorderStyle}>
                    <label className={`${labelStyle} !mb-1`}>Balance Bonus Tiers</label>
                    <p className="text-xs text-slate-400 mb-3">Define additional daily profit rates based on the user's real account balance.</p>
                    {/* Display existing bonus tiers */}
                    <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {formData.bonusRateThresholds.length > 0 ? (
                            formData.bonusRateThresholds.map((bonus, index) => (
                                <div key={index} className="flex justify-between items-center bg-slate-700/50 p-2.5 rounded-md text-sm ring-1 ring-white/5">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-slate-300">
                                            If Balance over <span className="font-semibold text-indigo-300">${(bonus.threshold ?? 0).toFixed(2)}</span>
                                        </span>
                                        <span className="text-green-400 font-medium">
                                            +{(bonus.rate ?? 0).toFixed(2)}% Bonus
                                        </span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveBonusThreshold(index)} className={removeButtonStyle} aria-label={`Remove bonus tier for balance $${(bonus.threshold ?? 0).toFixed(2)}`} disabled={isMutating}>
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 italic text-center py-2">No balance bonus tiers added yet.</p>
                        )}
                    </div>
                    {/* Inputs to add new bonus tier */}
                    <div className="flex flex-col sm:flex-row sm:items-stretch space-y-2 sm:space-y-0 sm:space-x-2">
                        <div className="flex-grow">
                            <label htmlFor="bonus-balance-level" className="sr-only">Min Balance ($)</label>
                            <input
                                type="number" id="bonus-balance-level" name="threshold"
                                value={bonusThresholdInput.threshold} onChange={handleBonusInputChange}
                                placeholder="Min Balance ($)"
                                min="0.01" step="0.01"
                                className={`${inputBaseStyle} w-full`}
                                disabled={isMutating}
                            />
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="bonus-rate" className="sr-only">Bonus Rate (%)</label>
                            <input
                                type="number" id="bonus-rate" name="rate"
                                value={bonusThresholdInput.rate} onChange={handleBonusInputChange}
                                placeholder="Bonus Rate (%)"
                                min="0.01" step="0.01"
                                className={`${inputBaseStyle} w-full`}
                                disabled={isMutating}
                            />
                        </div>
                        <button type="button" onClick={handleAddBonusThreshold} className={`${addButtonStyle} flex-shrink-0 sm:w-auto w-full justify-center`} disabled={isMutating}>Add Bonus Tier</button>
                    </div>
                </div>

                {/* Withdrawal Conditions Section */}
                <div className={sectionBorderStyle}>
                    {/* Min Weeks Input */}
                    <label htmlFor="withdrawalConditions.minWeeks" className={labelStyle}>Min. Withdrawal Weeks</label>
                    <input
                        type="number" name="withdrawalConditions.minWeeks" id="withdrawalConditions.minWeeks"
                        value={formData.withdrawalConditions.minWeeks} onChange={handleChange} required min="0"
                        className={`${inputBaseStyle} max-w-xs`}
                        placeholder="4"
                        disabled={isMutating}
                    />
                    {/* Penalties Sub-section */}
                    <label className={`${labelStyle} !mb-2 mt-4`}>
                        Withdrawal Penalties (By Week Range)
                        <span className="block text-xs font-normal text-slate-400 mt-1">
                            Define penalties for early withdrawals. Range Min is inclusive, Max is exclusive (e.g., Min 0, Max 2 applies to week 0 and 1).
                        </span>
                    </label>
                    {/* Display existing penalties */}
                    <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {(formData.withdrawalConditions.penalties || []).length > 0 ? (
                            (formData.withdrawalConditions.penalties || []).map((penalty, index) => (
                                <div key={index} className="flex justify-between items-center bg-slate-700/50 p-2.5 rounded-md text-sm ring-1 ring-white/5">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-slate-300">
                                            Weeks <span className="font-medium text-indigo-300">{penalty.weekRange?.min ?? '?'}-{penalty.weekRange?.max ?? '?'}</span>
                                        </span>
                                        <span className="text-red-400 font-medium">
                                            {(penalty.penaltyPercentage ?? 0)}% Penalty
                                        </span>
                                    </div>
                                    <button type="button" onClick={() => handleRemovePenalty(index)} className={removeButtonStyle} aria-label={`Remove penalty for weeks ${penalty.weekRange?.min ?? '?'}-${penalty.weekRange?.max ?? '?'}`} disabled={isMutating}>
                                        <XCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 italic text-center py-2">No withdrawal penalties defined.</p>
                        )}
                    </div>
                    {/* Inputs to add new penalty */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                            <label htmlFor="penalty-min-week" className="sr-only">Min Week</label>
                            <input
                                type="number" id="penalty-min-week" name="min" value={penaltyInput.min} onChange={handlePenaltyInputChange}
                                placeholder="Min Week" min="0" className={inputBaseStyle} disabled={isMutating}
                            />
                        </div>
                        <div>
                            <label htmlFor="penalty-max-week" className="sr-only">Max Week (Exclusive)</label>
                            <input
                                type="number" id="penalty-max-week" name="max" value={penaltyInput.max} onChange={handlePenaltyInputChange}
                                placeholder="Max Week (Exclusive)" min={Number(penaltyInput.min || 0) + 1} className={inputBaseStyle} disabled={isMutating}
                            />
                        </div>
                        <div>
                            <label htmlFor="penalty-percent" className="sr-only">Penalty %</label>
                            <input
                                type="number" id="penalty-percent" name="penaltyPercentage" value={penaltyInput.penaltyPercentage} onChange={handlePenaltyInputChange}
                                placeholder="Penalty %" min="0" step="0.01" className={inputBaseStyle} disabled={isMutating}
                            />
                        </div>
                    </div>
                    <button type="button" onClick={handleAddPenalty} className={`${addButtonStyle} mt-3 w-full sm:w-auto justify-center`} disabled={isMutating}>Add Penalty Rule</button>
                </div>

                {/* Active Toggle Section (only for Edit) */}
                {isEdit && (
                    <div className={`${sectionBorderStyle} flex items-center`}>
                        <input
                            id="active" name="active" type="checkbox" checked={formData.active} onChange={handleChange}
                            className="h-4 w-4 rounded border-white/30 bg-white/5 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
                            disabled={isMutating}
                        />
                        <label htmlFor="active" className={`ml-3 block text-sm font-medium leading-6 text-slate-300 ${isMutating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            Plan Active
                        </label>
                    </div>
                )}

                {/* Form Actions (Submit/Cancel) */}
                <div className="flex justify-end space-x-4 pt-5 border-t border-white/10 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isMutating}
                        className="rounded-md bg-white/10 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition-colors duration-150 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isMutating}
                        className="min-w-[120px] rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-150 ease-in-out flex items-center justify-center disabled:opacity-70"
                    >
                        {/* Loading Spinner */}
                        {isMutating ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <span>{isEdit ? 'Update Plan' : 'Create Plan'}</span>
                        )}
                    </button>
                </div>
            </form>

            {/* Alert Modal for Form Validation Errors */}
            <AlertModal
                isOpen={alertModalOpen}
                onClose={() => setAlertModalOpen(false)}
                title={alertModalTitle}
                message={alertModalMessage}
            />
        </>
    );
};

// --- Plan Card Component (with Framer Motion enhancements) ---
const PlanCard = ({ plan, onEdit, onToggleActive, isMutating, togglingPlanId, variants, cardStyles }) => {
    // Receive variants and cardStyles from parent
    const isActive = plan.active;
    const level = plan.level;
    const isCurrentlyToggling = plan._id === togglingPlanId;

    // Base styles (could be moved outside if preferred)
    const cardBaseStyle = `relative rounded-xl shadow-lg overflow-hidden flex flex-col justify-between
                          transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.015]`; // Keep CSS hover
    const statusBadgeStyle = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset`;
    const statusStyle = isActive
        ? `${statusBadgeStyle} bg-green-500/10 text-green-400 ring-green-500/20`
        : `${statusBadgeStyle} bg-red-500/10 text-red-400 ring-red-500/20`;
    const buttonBaseStyle = `w-[110px] min-h-[30px] inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md shadow-sm
                             transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed`;

    // Prepare data for display
    const sortedBonusTiers = [...(plan.bonusRateThresholds || [])].sort((a, b) => (a.threshold || 0) - (b.threshold || 0));
    const sortedPenalties = [...(plan.withdrawalConditions?.penalties || [])].sort((a, b) => (a.weekRange?.min || 0) - (b.weekRange?.min || 0));

    // Level icon and text logic
    let levelIcon = <Star className="h-3 w-3 inline-block mr-1" />;
    let levelText = `Level ${level || 'N/A'}`;
    if (level === 1) { levelIcon = <ShieldCheck className="h-3 w-3 inline-block mr-1 text-gray-400" />; levelText = `Level ${level} (Starter)`; }
    else if (level === 2) { levelIcon = <Zap className="h-3 w-3 inline-block mr-1 text-emerald-400" />; levelText = `Level ${level} (Growth)`; }
    else if (level === 3) { levelIcon = <Star className="h-3 w-3 inline-block mr-1 text-indigo-400" />; levelText = `Level ${level} (Premium)`; }
    else if (level === 4) { levelIcon = <Briefcase className="h-3 w-3 inline-block mr-1 text-purple-400" />; levelText = `Level ${level} (Business)`; }
    else if (level === 5) { levelIcon = <Award className="h-3 w-3 inline-block mr-1 text-amber-400" />; levelText = `Level ${level} (Executive)`; }
    else if (level === 6) { levelIcon = <Crown className="h-3 w-3 inline-block mr-1 text-cyan-400" />; levelText = `Level ${level} (Elite)`; }


    // --- Framer Motion Variants for Internal Elements ---
    const internalContainerVariant = {
        hidden: { opacity: 1 }, // Parent (card wrapper) handles initial visibility
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren", // Animate this container (opacity) before children
                staggerChildren: 0.06 // Delay between each internal item animation
            }
        }
    };

    const internalItemVariant = {
        hidden: { opacity: 0, y: 10, scale: 0.98 }, // Start invisible, slightly down and scaled down
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.3, ease: 'easeOut' } // Quick easeOut animation
        }
    };

    const badgeVariant = {
        hidden: { opacity: 0, scale: 0.5 }, // Start small and invisible
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] } // Pop in after card appears
        }
    };

    return (
        // Main Card Wrapper - receives variants from parent grid for entrance animation
        <motion.div layout variants={variants} className={`${cardBaseStyle} ${cardStyles.bg} ${cardStyles.ring}`}>
            {/* Level Badge - animates independently */}
            <motion.div
                variants={badgeVariant}
                initial="hidden" // Set initial state for badge animation
                animate="visible" // Animate badge when card is visible
                className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-slate-200 text-xs font-bold px-2 py-0.5 rounded-full ring-1 ring-white/10 flex items-center z-10" // Ensure badge is above content
            >
                {levelIcon}
                {level || 'N/A'}
            </motion.div>

            {/* Internal Content Container - manages staggering of elements inside */}
            <motion.div
                variants={internalContainerVariant} // Controls staggering of children
                initial="hidden" // Set initial state for internal staggering
                animate="visible" // Trigger staggering when card is visible
                className="flex flex-col flex-grow" // Needed for layout (especially flex-grow and bottom actions)
            >
                {/* Card Content Padding Area */}
                <div className="p-5 sm:p-6 text-white flex-grow"> {/* flex-grow pushes actions down */}

                    {/* Header Section (Title, Status, Level Text) */}
                    <motion.div variants={internalItemVariant}>
                        <div className="flex justify-between items-start mb-1 pr-16"> {/* Space for badge */}
                            <h3 className="text-2xl font-bold tracking-tight text-slate-100">{plan.name || 'Unnamed Plan'}</h3>
                            <span className={statusStyle} title={`Plan is ${isActive ? 'Active' : 'Inactive'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4 flex items-center">
                            {levelIcon} {levelText}
                            <span className="ml-1 hidden sm:inline">- Tier representing plan features & requirements.</span>
                        </p>
                    </motion.div>

                    {/* Key Info Section (Deposit, Profit) */}
                    <motion.div variants={internalItemVariant} className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5 text-sm">
                        <div>
                            <span className="text-slate-400 block text-xs">Weekly Deposit</span>
                            <span className="font-semibold text-lg">${(plan.weeklyRequiredAmount ?? 0).toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-xs">Base Profit</span>
                            <span className="font-semibold text-lg">{(plan.profitRateDaily ?? 0).toFixed(2)}% <span className='text-xs font-normal text-slate-400'>/ day</span></span>
                        </div>
                    </motion.div>

                    {/* Description Section */}
                    {plan.description && (
                        <motion.p variants={internalItemVariant} className="text-sm text-slate-300 mb-4 italic border-l-2 border-indigo-500/50 pl-3 py-1">
                            {plan.description}
                        </motion.p>
                    )}

                    {/* Details Sections Wrapper (Features, Bonus, Withdrawal) */}
                    <motion.div variants={internalItemVariant} className="space-y-4">
                        {/* Features List */}
                        {plan.features?.length > 0 && (
                            <div>
                                <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1.5">Features</h4>
                                <ul className="list-disc list-inside text-sm space-y-1 text-slate-300 marker:text-indigo-400">
                                    {plan.features.map((feature, idx) => <li key={idx}>{feature}</li>)}
                                </ul>
                            </div>
                        )}
                        {/* Bonus Tiers List */}
                        {sortedBonusTiers.length > 0 && (
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-2">Balance Bonus Tiers</h4>
                                <ul className="space-y-1.5">
                                    {sortedBonusTiers.map((bonus, idx) => (
                                        <li key={idx} className="flex items-center justify-between text-sm bg-slate-600/30 px-3 py-1.5 rounded-md">
                                            <span className="text-slate-300">
                                                If Balance {'>'} <span className="font-medium text-indigo-300">${(bonus.threshold ?? 0).toFixed(2)}</span>
                                            </span>
                                            <span className="font-semibold text-green-400">
                                                +{(bonus.rate ?? 0).toFixed(2)}% Daily Bonus
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Withdrawal Rules */}
                        {plan.withdrawalConditions && (
                            <div className="border-t border-white/10 pt-4">
                                <h4 className="text-xs uppercase text-slate-500 font-semibold tracking-wider mb-1.5">Withdrawal Rules</h4>
                                <p className="text-sm text-slate-300 mb-1">Min. Duration: <span className="font-medium">{plan.withdrawalConditions.minWeeks ?? 'N/A'} weeks</span></p>
                                {sortedPenalties.length > 0 && (
                                    <div className="mt-1">
                                        <span className="text-xs text-slate-400 font-medium block">Early Withdrawal Penalties:</span>
                                        <ul className="text-xs space-y-0.5 text-slate-400 mt-1">
                                            {sortedPenalties.map((penalty, idx) => (
                                                <li key={idx} className="pl-2">&bull; Weeks {penalty.weekRange?.min ?? '?'}-{penalty.weekRange?.max ?? '?'}: <span className="text-red-400">{(penalty.penaltyPercentage ?? 0)}% penalty</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div> {/* End Details Sections Wrapper */}
                </div> {/* End Card Content Padding Area */}

                {/* Card Actions Section - Placed outside padding div, inside flex container */}
                <motion.div variants={internalItemVariant} className="mt-auto p-4 border-t border-white/10 bg-black/10 flex justify-end space-x-3">
                    {/* Edit Button */}
                    <button
                        onClick={() => onEdit(plan)}
                        disabled={isMutating} // Disable if any operation is in progress
                        title="Edit Plan"
                        className={`${buttonBaseStyle} bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500`}
                        aria-label={`Edit plan ${plan.name}`}
                    >
                        <Pencil className="h-4 w-4 mr-1.5" aria-hidden="true" /> Edit
                    </button>
                    {/* Toggle Active/Inactive Button */}
                    <button
                        onClick={() => onToggleActive(plan)}
                        disabled={isMutating} // Disable if any operation is in progress
                        title={isActive ? 'Deactivate Plan' : 'Activate Plan'}
                        className={`${buttonBaseStyle} ${isActive
                            ? 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500'
                            : 'bg-green-600 text-white hover:bg-green-500 focus:ring-green-500'}`}
                        aria-label={`${isActive ? 'Deactivate' : 'Activate'} plan ${plan.name}`}
                    >
                        {/* Show spinner only if this specific plan is being toggled */}
                        {isCurrentlyToggling ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            // Show appropriate icon and text
                            <>
                                {isActive ? <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" /> : <CheckCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />}
                                {isActive ? 'Deactivate' : 'Activate'}
                            </>
                        )}
                    </button>
                </motion.div> {/* End Card Actions Section */}
            </motion.div> {/* End Internal Content Container */}
        </motion.div> // End Main Card Wrapper
    );
};


// --- Main Page Component ---
export default function AdminSubscriptionsPage() {
    // SWR Hook
    const swrKey = '/api/admin/subscription';
    const { data: plansData, error: fetchError, isLoading: isLoadingPlans } = useSWR(swrKey, fetcher);

    // State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [isMutating, setIsMutating] = useState(false); // Global lock for any mutation
    const [togglingPlanId, setTogglingPlanId] = useState(null); // ID of plan being toggled
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({
        title: '', message: '', confirmText: 'Confirm', onConfirm: () => { }
    });

    // Helper to open confirmation modal
    const openConfirmationModal = (props) => {
        setConfirmModalProps({
            title: props.title || 'Confirm Action',
            message: props.message || '',
            confirmText: props.confirmText || 'Confirm',
            onConfirm: props.onConfirm || (() => { })
        });
        setIsConfirmModalOpen(true);
    };

    // Process fetched data safely
    const plans = plansData?.plans?.sort((a, b) => a.level - b.level) || [];

    // Modal Controls
    const handleOpenCreateModal = () => { setSelectedPlan(null); setApiError(null); setIsCreateModalOpen(true); };
    const handleCloseCreateModal = () => { setIsCreateModalOpen(false); setApiError(null); }; // Clear error on close
    const handleOpenEditModal = (plan) => { setSelectedPlan(plan); setApiError(null); setIsEditModalOpen(true); };
    const handleCloseEditModal = () => { setIsEditModalOpen(false); setSelectedPlan(null); setApiError(null); }; // Clear error on close
    const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); };

    // --- CRUD Operations ---
    const handleCreatePlan = async (formData) => {
        setApiError(null); // Clear previous errors
        setIsMutating(true);
        try {
            const response = await fetch(swrKey, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
            });
            if (!response.ok) {
                let errorData; try { errorData = await response.json(); } catch (e) {/* ignore */ }
                throw new Error(errorData?.message || `Failed to create plan: ${response.statusText}`);
            }
            handleCloseCreateModal(); // Close modal on success
            await mutate(swrKey); // Revalidate SWR data
        } catch (e) {
            console.error("Create plan error:", e);
            setApiError(e.message || "An unknown error occurred while creating the plan."); // Show error in modal
        } finally {
            setIsMutating(false);
        }
    };

    const handleUpdatePlan = async (formData) => {
        if (!selectedPlan?._id) return;
        setApiError(null); // Clear previous errors
        setIsMutating(true);
        try {
            const response = await fetch(`${swrKey}/${selectedPlan._id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
            });
            if (!response.ok) {
                let errorData; try { errorData = await response.json(); } catch (e) {/* ignore */ }
                throw new Error(errorData?.message || `Failed to update plan: ${response.statusText}`);
            }
            handleCloseEditModal(); // Close modal on success
            await mutate(swrKey); // Revalidate SWR data
        } catch (e) {
            console.error("Update plan error:", e);
            setApiError(e.message || "An unknown error occurred while updating the plan."); // Show error in modal
        } finally {
            setIsMutating(false);
        }
    };

    const handleToggleActive = (plan) => {
        const isActivating = !plan.active;
        const actionText = isActivating ? 'activate' : 'deactivate';
        const confirmationMessage = `Are you sure you want to ${actionText} the "${plan.name}" plan? ${!isActivating ? '(This might affect users currently subscribed.)' : ''}`;

        const performToggle = async () => {
            handleCloseConfirmModal(); // Close confirmation modal first
            setApiError(null); // Clear previous global errors
            setIsMutating(true);
            setTogglingPlanId(plan._id); // Show spinner on specific card
            try {
                const url = `${swrKey}/${plan._id}`;
                let response;
                // Using PUT for activation (sending { active: true })
                // Using DELETE for deactivation (assuming backend handles soft delete/toggle)
                if (isActivating) {
                    response = await fetch(url, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ active: true }), // Send partial update
                    });
                } else {
                    response = await fetch(url, { method: 'DELETE' }); // Assuming DELETE toggles active: false
                }

                if (!response.ok) {
                    let errorData; try { errorData = await response.json(); } catch (e) {/* ignore */ }
                    throw new Error(errorData?.message || `Failed to ${actionText} plan: ${response.statusText}`);
                }
                await mutate(swrKey); // Revalidate SWR data
            } catch (e) {
                console.error("Toggle active error:", e);
                // Show error globally after modals are closed
                setApiError(e.message || `An unknown error occurred while ${actionText}ing the plan.`);
            } finally {
                setIsMutating(false);
                setTogglingPlanId(null); // Stop spinner
            }
        };

        // Open the confirmation modal
        openConfirmationModal({
            title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Plan`,
            message: confirmationMessage,
            confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
            onConfirm: performToggle
        });
    };

    // --- Card Styling Helper ---
    const getCardStyles = (level, isActive) => {
        const baseRing = 'ring-1';
        const defaultActiveBg = 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900';
        const defaultActiveRing = 'ring-white/10';
        const defaultInactiveBg = 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800';
        const defaultInactiveRing = 'ring-white/5 opacity-80 hover:opacity-100'; // Keep inactive look subtle but allow hover brighten

        if (!isActive) {
            return { bg: defaultInactiveBg, ring: `${baseRing} ${defaultInactiveRing}` };
        }

        // Active card styles based on level
        switch (level) {
            case 1: // Starter - Subtle Gray/Slate
                return { bg: 'bg-gradient-to-br from-gray-700 via-slate-800 to-slate-900', ring: `${baseRing} ring-gray-500/20` };
            case 2: // Growth - Emerald/Green hint
                return { bg: 'bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900', ring: `${baseRing} ring-emerald-500/30` };
            case 3: // Premium - Indigo hint
                return { bg: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black', ring: `${baseRing} ring-indigo-500/40` };
            case 4: // Business - Purple hint
                return { bg: 'bg-gradient-to-br from-purple-900 via-slate-900 to-black', ring: `${baseRing} ring-purple-500/50` };
            case 5: // Executive - Amber/Gold hint
                return { bg: 'bg-gradient-to-br from-amber-800 via-gray-900 to-black', ring: `${baseRing} ring-amber-400/60` };
            case 6: // Elite - Cyan/Teal hint
                return { bg: 'bg-gradient-to-br from-cyan-800 via-purple-950 to-black', ring: `${baseRing} ring-cyan-400/70` };
            default: // Fallback for unexpected levels
                return { bg: defaultActiveBg, ring: `${baseRing} ${defaultActiveRing}` };
        }
    };


    // --- Framer Motion Variants for Grid ---
    const gridContainerVariant = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: 0.1, // Start animating children after a small delay
                staggerChildren: 0.15 // Time between each card animation starts
            }
        }
    };

    const gridItemVariant = {
        hidden: { opacity: 0, y: 30, scale: 0.95 }, // Start invisible, slightly down and scaled down
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.5, // Control animation speed
                ease: [0.4, 0, 0.2, 1] // Custom cubic bezier for smooth entrance
            }
        }
    };

    // --- Page Render ---
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-900 via-black to-slate-800 min-h-screen text-slate-100">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 mb-4 sm:mb-0">
                        Manage Subscription Plans
                    </h1>
                    <button
                        onClick={handleOpenCreateModal}
                        disabled={isLoadingPlans || isMutating} // Disable if loading or another action is in progress
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-slate-900 transition-colors duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
                        Create New Plan
                    </button>
                </div>

                {/* Global Fetch Error Display */}
                {fetchError && (
                    <div className="mb-6 p-4 bg-red-900/50 text-red-300 border border-red-700/50 rounded-md shadow-lg" role="alert">
                        <p><strong className="font-semibold">Error Loading Plans:</strong> {fetchError.message}</p>
                    </div>
                )}
                {/* Global API Error Display (shown when no modals are open) */}
                {apiError && !isCreateModalOpen && !isEditModalOpen && !isConfirmModalOpen && (
                    <div className="mb-6 p-4 bg-red-900/50 text-red-300 border border-red-700/50 rounded-md shadow-lg" role="alert">
                        <p><strong className="font-semibold">Operation Error:</strong> {apiError}</p>
                    </div>
                )}

                {/* Main Content Area: Loading, Empty, or Grid */}
                {isLoadingPlans ? (
                    // Loading State
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                        <p className="text-slate-400 text-lg ml-4">Loading plans...</p>
                    </div>
                ) : !fetchError && plans.length === 0 ? (
                    // Empty State
                    <div className="text-center py-16 px-6 bg-slate-800/30 rounded-lg border border-white/10 shadow-inner">
                        <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-semibold text-slate-300">No subscription plans found</h3>
                        <p className="mt-1 text-sm text-slate-400">Get started by creating a new plan.</p>
                        <div className="mt-6">
                            <button
                                onClick={handleOpenCreateModal}
                                type="button"
                                disabled={isMutating} // Disable if any mutation lock is active
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                            >
                                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                Create New Plan
                            </button>
                        </div>
                    </div>
                ) : !fetchError && plans.length > 0 ? (
                    // Plans Grid - Apply Framer Motion container
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8"
                        variants={gridContainerVariant}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Map over plans and render PlanCard */}
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan._id}
                                plan={plan}
                                onEdit={handleOpenEditModal}
                                onToggleActive={handleToggleActive}
                                isMutating={isMutating} // Pass global mutation state
                                togglingPlanId={togglingPlanId} // Pass specific toggling ID
                                variants={gridItemVariant} // Pass variant for individual card entrance
                                cardStyles={getCardStyles(plan.level, plan.active)} // Pass calculated styles
                            />
                        ))}
                    </motion.div>
                ) : null // Handle case where fetchError exists but plans might have old data (optional)
                }
            </div> {/* End max-w-7xl */}

            {/* --- Modals --- */}
            {/* Create Plan Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} title="Create New Subscription Plan">
                {/* Display API errors within the modal if it's open */}
                {apiError && isCreateModalOpen && (
                    <div className="mb-4 p-3 bg-red-900/70 text-red-200 border border-red-700/60 rounded text-sm" role="alert">
                        {apiError}
                    </div>
                )}
                <PlanForm
                    onSubmit={handleCreatePlan}
                    onCancel={handleCloseCreateModal}
                    isMutating={isMutating} // Pass mutation state to disable form
                />
            </Modal>

            {/* Edit Plan Modal */}
            <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Subscription Plan">
                {/* Display API errors within the modal if it's open */}
                {apiError && isEditModalOpen && (
                    <div className="mb-4 p-3 bg-red-900/70 text-red-200 border border-red-700/60 rounded text-sm" role="alert">
                        {apiError}
                    </div>
                )}
                {/* Conditionally render form only if a plan is selected */}
                {selectedPlan && (
                    <PlanForm
                        initialData={selectedPlan} // Pre-fill with selected plan data
                        onSubmit={handleUpdatePlan}
                        onCancel={handleCloseEditModal}
                        isEdit={true} // Indicate it's an edit form
                        isMutating={isMutating} // Pass mutation state to disable form
                    />
                )}
            </Modal>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={confirmModalProps.onConfirm}
                title={confirmModalProps.title}
                message={confirmModalProps.message}
                confirmText={confirmModalProps.confirmText}
            />
        </div> // End Page Wrapper
    );
}