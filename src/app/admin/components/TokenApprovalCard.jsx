'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Copy, ExternalLink, ChevronDown, ChevronRight,
    Shield, Clock, ArrowUpRight, Dot
} from 'lucide-react';

// Helper functions
const formatUsdt = (amount) => {
    if (typeof amount !== 'number') return '0.00';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const shortenAddress = (address, chars = 6) => {
    if (!address || address === 'N/A') return '—';
    return `${address.substring(0, chars)}...${address.substring(address.length - 4)}`;
};

const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Copy to clipboard with minimal feedback
const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

// Dark theme status indicator
const StatusBadge = ({ status }) => {
    const statusConfig = {
        active: { color: 'bg-emerald-500', label: 'Active' },
        pendingApproval: { color: 'bg-amber-500', label: 'Pending' },
        failed: { color: 'bg-red-500', label: 'Failed' },
        unknown: { color: 'bg-gray-500', label: 'Unknown' }
    };

    const config = statusConfig[status] || statusConfig.unknown;

    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${config.color} shadow-sm`} />
            <span className="text-xs text-gray-400 font-medium">{config.label}</span>
        </div>
    );
};

// Dark theme risk indicator
const RiskIndicator = ({ level }) => {
    const riskConfig = {
        low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Low' },
        medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Medium' },
        high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'High' }
    };

    const config = riskConfig[level] || riskConfig.medium;

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${config.bg}`}>
            <Dot className={`w-10 h-4 ${config.color}`} />
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
    );
};

// Dark theme copyable text component
const CopyableText = ({ text, displayText }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        await copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
            <span className="font-mono text-sm">{displayText || text}</span>
            <Copy className={`w-3 h-3 transition-all ${copied ? 'text-emerald-400 scale-110' : 'text-gray-500 group-hover:text-gray-400'}`} />
        </button>
    );
};

// Detail row component
const DetailRow = ({ label, children, className = '' }) => (
    <div className={`flex justify-between items-center py-3 ${className}`}>
        <span className="text-sm text-gray-400 font-medium">{label}</span>
        <div className="text-right">{children}</div>
    </div>
);

export default function DarkTokenApprovalCard({ approval, onOpenTransferModal }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Mock data for demonstration
    const mockApproval = approval || {
        user: {
            name: 'Alice Johnson',
            email: 'alice@example.com'
        },
        ownerAddress: '0x742d35Cc6634C0532925a3b8D64B6834C20C4f93',
        spenderAddress: '0x1f629Bc8c3E45F0a8A23b5c7E9d9C8B7A4F0e1D2',
        tokenAddress: '0xA0b86a33E6Cc8c57C2b4c5e3f5e1E3e1E3e1E3e1',
        approvedAmountHumanReadable: 'Unlimited',
        createdAt: new Date('2024-01-15'),
        status: 'active',
        userWalletUsdtBalance: 2500.75,
        userContractBalance: 180.50
    };

    const {
        user,
        ownerAddress = 'N/A',
        spenderAddress = 'N/A',
        tokenAddress = 'N/A',
        approvedAmountHumanReadable = 'N/A',
        createdAt = new Date(),
        status = 'unknown',
        userWalletUsdtBalance = 0,
        userContractBalance = 0
    } = mockApproval;

    const {
        name: userName = 'Unknown User',
        email: userEmail = 'No Email'
    } = user || {};

    // Determine risk level
    const getRiskLevel = () => {
        if (approvedAmountHumanReadable === 'Unlimited') return 'high';
        if (userWalletUsdtBalance > 1000) return 'high';
        if (userWalletUsdtBalance > 100) return 'medium';
        return 'low';
    };

    const handleTransfer = () => {
        if (onOpenTransferModal) {
            onOpenTransferModal(mockApproval);
        } else {
            console.log('Transfer initiated for:', userName);
        }
    };

    return (
        <div className=" bg-gray-950 p-2 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl hover:shadow-gray-900/20 transition-all duration-300 overflow-hidden max-w-md w-full"
                style={{
                    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)'
                }}
            >
                {/* Header with subtle gradient */}
                <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600/50">
                                <User className="w-5 h-5 text-gray-300" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{userName}</h3>
                                <p className="text-sm text-gray-400">{userEmail}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <RiskIndicator level={getRiskLevel()} />
                            <StatusBadge  status={status} />
                        </div>
                    </div>
                </div>

                {/* Balance Section with enhanced dark gradient */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-800/20 to-gray-900/40 border-b border-gray-700/30">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/40">
                            <p className="text-xs text-gray-400 font-medium mb-1">Wallet Balance</p>
                            <p className="text-lg font-semibold text-white">
                                ${formatUsdt(userWalletUsdtBalance)}
                            </p>
                        </div>
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/40">
                            <p className="text-xs text-gray-400 font-medium mb-1">Platform Balance</p>
                            <p className="text-lg font-semibold text-white">
                                ${formatUsdt(userContractBalance)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Expandable Details */}
                <div className="p-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center justify-between w-full text-left group hover:bg-gray-800/30 rounded-lg px-2 py-3 transition-colors"
                    >
                        <span className="text-xs text-gray-400 font-bold">More Details</span>
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 space-y-1">
                                    <DetailRow label="Approved Amount">
                                        <span className="font-mono text-sm font-semibold text-white">
                                            {approvedAmountHumanReadable}
                                        </span>
                                    </DetailRow>

                                    <DetailRow label="Owner" className="border-t border-gray-700/50 pt-3">
                                        <CopyableText text={ownerAddress} displayText={shortenAddress(ownerAddress)} />
                                    </DetailRow>

                                    <DetailRow label="Spender" className="border-t border-gray-700/50 pt-3">
                                        <div className="flex items-center gap-2">
                                            <CopyableText text={spenderAddress} displayText={shortenAddress(spenderAddress)} />
                                            <a
                                                href={`https://etherscan.io/address/${spenderAddress}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-gray-400 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </DetailRow>

                                    <DetailRow label="Token Contract" className="border-t border-gray-700/50 pt-3">
                                        <CopyableText text={tokenAddress} displayText={shortenAddress(tokenAddress)} />
                                    </DetailRow>

                                    <DetailRow label="Created" className="border-t border-gray-700/50 pt-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-gray-500" />
                                            <span className="text-sm text-gray-300">{formatDate(createdAt)}</span>
                                        </div>
                                    </DetailRow>

                                    {approvedAmountHumanReadable === 'Unlimited' && (
                                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 mt-2">
                                            <div className="flex items-start gap-2">
                                                <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-300">Security Notice</p>
                                                    <p className="text-xs text-amber-400/80 mt-1">
                                                        Unlimited approval grants full token access to the spender contract.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Enhanced Action Button */}
                <div className="p-6 pt-0">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTransfer}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-blue-500/25"
                    >
                        <span>Initiate Transfer</span>
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}