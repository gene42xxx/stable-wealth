'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertTriangle, CheckCircle, Copy, ExternalLink, ShieldCheck, DollarSign, User, Send } from 'lucide-react';
import { formatUnits, parseUnits } from 'viem';

const USDT_DECIMALS = 6; // Assuming USDT uses 6 decimals

const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
    if (!address || typeof address !== 'string') return 'N/A';
    if (address.length < prefixLength + suffixLength + 3) return address;
    return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

const copyToClipboard = (text, toast) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => toast.success('Copied to clipboard!', {
            style: { background: '#27272a', color: '#e4e4e7', border: '1px solid #34d399' },
            iconTheme: { primary: '#34d399', secondary: '#e4e4e7' },
        }))
        .catch(() => toast.error('Failed to copy.', {
            style: { background: '#27272a', color: '#f87171', border: '1px solid #ef4444' },
        }));
};


export default function PayoutConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    payoutDetails, // { userWalletAddress, recipientAddress, amountString, estimatedEthFee }
    superAdminFeePercent, // e.g., "5" for 5%
    superAdminWalletAddress,
    toast // Pass react-hot-toast instance
}) {
    if (!isOpen || !payoutDetails) return null;

    const { userWalletAddress, recipientAddress, amountString, estimatedEthFee } = payoutDetails;

    let totalPayoutAmountBigInt = 0n;
    let feeAmountBigInt = 0n;
    let netAmountToRecipientBigInt = 0n;
    let feePercentNum = 0;

    try {
        // Parse amount string to BigInt directly
        totalPayoutAmountBigInt = parseUnits(amountString.replace(',', '.'), USDT_DECIMALS);
        feePercentNum = parseFloat(superAdminFeePercent);

        if (totalPayoutAmountBigInt <= 0n || isNaN(feePercentNum) || feePercentNum < 0 || feePercentNum > 100) {
            // Handle invalid numbers gracefully or show an error within the modal
            console.error("Invalid amount or fee percentage for modal calculation.");
        } else {
            // Use BigInt for precision with fee calculation
            feeAmountBigInt = (totalPayoutAmountBigInt * BigInt(Math.round(feePercentNum * 100))) / BigInt(10000); // feePercent * 100 to handle decimals in percent, then divide by 100 * 100
            netAmountToRecipientBigInt = totalPayoutAmountBigInt - feeAmountBigInt;
        }
    } catch (e) {
        console.error("Error calculating payout amounts for modal:", e);
        // Potentially set an error state to display in the modal
    }
    
    const accentGradient = "bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-500";
    const buttonBaseClasses = "px-6 py-2.5 text-sm font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 w-full max-w-lg rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`h-1.5 ${accentGradient}`}></div>
                        <div className="p-6 sm:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 flex items-center">
                                    <ShieldCheck size={24} className="mr-3 text-sky-400" />
                                    Confirm Payout
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-zinc-500 hover:text-zinc-200 rounded-full hover:bg-slate-700/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-5 text-sm">
                                <InfoItem icon={<User size={16} className="text-zinc-500" />} label="Paying Out From (User Wallet)" value={formatAddress(userWalletAddress)} copyableValue={userWalletAddress} toast={toast} />
                                <InfoItem icon={<Send size={16} className="text-zinc-500" />} label="Original Recipient" value={formatAddress(recipientAddress)} copyableValue={recipientAddress} toast={toast} />
                                
                                <hr className="border-slate-700 my-4" />

                                <InfoItem icon={<DollarSign size={16} className="text-zinc-500" />} label="Total Payout Amount" value={`${formatUnits(totalPayoutAmountBigInt, USDT_DECIMALS)} USDT`} valueClass="font-bold text-sky-300" />
                                <InfoItem icon={<DollarSign size={16} className="text-zinc-500" />} label={`Super Admin Fee (${feePercentNum}%)`} value={`${formatUnits(feeAmountBigInt, USDT_DECIMALS)} USDT`} valueClass="text-teal-400" />
                                <InfoItem icon={<DollarSign size={16} className="text-zinc-500" />} label="Net to Original Recipient" value={`${formatUnits(netAmountToRecipientBigInt, USDT_DECIMALS)} USDT`} valueClass="font-semibold text-green-400" />
                                {estimatedEthFee && (
                                     <InfoItem icon={<DollarSign size={16} className="text-zinc-500" />} label="Estimated ETH Fee" value={`${parseFloat(estimatedEthFee).toFixed(6)} ETH`} valueClass="text-yellow-400" />
                                )}
                                <InfoItem icon={<Wallet size={16} className="text-zinc-500" />} label="Super Admin Wallet" value={formatAddress(superAdminWalletAddress)} copyableValue={superAdminWalletAddress} toast={toast} />

                                <div className="mt-6 p-4 bg-yellow-800/20 border border-yellow-600/50 rounded-lg text-yellow-300 flex items-start">
                                    <AlertTriangle size={28} className="mr-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold mb-1">Important:</h4>
                                        <p className="text-xs">Please double-check all addresses and amounts. Transactions are irreversible once confirmed on the blockchain.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4">
                                <button
                                    onClick={onClose}
                                    className={`${buttonBaseClasses} w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-zinc-300 focus-visible:ring-slate-500`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`${buttonBaseClasses} w-full sm:w-auto ${accentGradient} text-white hover:shadow-cyan-500/30 focus-visible:ring-sky-500`}
                                >
                                    Confirm & Proceed with Payout
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const InfoItem = ({ icon, label, value, valueClass = 'text-zinc-200', copyableValue, toast }) => (
    <div className="flex items-start justify-between py-1.5">
        <span className="flex items-center text-zinc-400">
            {icon}
            <span className="ml-2.5">{label}:</span>
        </span>
        <div className="flex items-center text-right">
            <span className={`break-all ${valueClass}`}>{value}</span>
            {copyableValue && toast && (
                <button
                    onClick={() => copyToClipboard(copyableValue, toast)}
                    className="ml-2 p-1 text-zinc-500 hover:text-sky-400 rounded-md hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500"
                    title={`Copy ${label.toLowerCase()}`}
                >
                    <Copy size={13} />
                </button>
            )}
        </div>
    </div>
);
