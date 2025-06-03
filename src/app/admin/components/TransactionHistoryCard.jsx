import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Info, Copy, ExternalLink, CheckCircle, Clock, XCircle, DollarSign, User, CreditCard, CalendarClock, Tag, Zap, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

// --- Helper Functions ---
const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
    if (!address) return 'N/A';
    const length = address.length;
    if (length <= prefixLength + suffixLength) return address;
    return `${address.substring(0, prefixLength)}...${address.substring(length - suffixLength)}`;
};

const copyToClipboard = (text, entity = 'Text') => {
    if (!navigator.clipboard) {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text; textArea.style.position = "fixed"; textArea.style.opacity = "0";
            document.body.appendChild(textArea); textArea.focus(); textArea.select(); document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed', err);
        } finally {
            const textArea = document.querySelector("textarea");
            if (textArea) document.body.removeChild(textArea);
        }
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        console.log(`${entity} copied`);
    }).catch(err => {
        console.error('Copy failed', err);
    });
};

const getStatusInfo = (status) => {
    const lowerStatus = status?.toLowerCase() || 'unknown';
    switch (lowerStatus) {
        case 'completed': return {
            text: 'Completed',
            icon: <CheckCircle size={18} className="mr-2" />,
            className: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30 shadow-emerald-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500/30 to-green-500/30',
            pulse: 'animate-pulse'
        };
        case 'pending': case 'processing': case 'initiated': return {
            text: status || 'Pending',
            icon: <Clock size={18} className="mr-2" />,
            className: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-400/30 shadow-amber-500/10',
            iconBg: 'bg-gradient-to-br from-amber-500/30 to-orange-500/30',
            pulse: 'animate-pulse'
        };
        case 'failed': return {
            text: 'Failed',
            icon: <XCircle size={18} className="mr-2" />,
            className: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30 shadow-red-500/10',
            iconBg: 'bg-gradient-to-br from-red-500/30 to-rose-500/30',
            pulse: ''
        };
        default: return {
            text: status || 'Unknown',
            icon: <Info size={18} className="mr-2" />,
            className: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-400/30 shadow-slate-500/10',
            iconBg: 'bg-gradient-to-br from-slate-500/30 to-gray-500/30',
            pulse: ''
        };
    }
};

// --- Environment Variable ---
const BLOCKCHAIN_EXPLORER_BASE_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_BASE_URL || 'https://etherscan.io';

// --- Premium Skeleton Loading Card ---
const PremiumSkeletonCard = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 mr-4 animate-pulse"></div>
                <div>
                    <div className="h-5 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg w-32 mb-3 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg w-40 animate-pulse"></div>
                </div>
            </div>
            <div className="h-8 w-28 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800/40 backdrop-blur rounded-xl p-4">
                    <div className="h-3 bg-gradient-to-r from-slate-700 to-slate-600 rounded w-20 mb-3 animate-pulse"></div>
                    <div className="h-5 bg-gradient-to-r from-slate-700 to-slate-600 rounded w-32 animate-pulse"></div>
                </div>
            ))}
        </div>
    </div>
);

// --- Floating Action Button ---
const FloatingActionButton = ({ onClick, icon, label, className = "" }) => (
    <button
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`group relative p-2 rounded-xl bg-gradient-to-r from-slate-700/80 to-slate-600/80 hover:from-slate-600 hover:to-slate-500 border border-slate-600/50 hover:border-slate-500/70 transition-all duration-300 ease-out transform hover:scale-110 hover:shadow-lg hover:shadow-slate-500/20 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 focus:ring-offset-slate-800 ${className}`}
    >
        <div className="text-slate-300 group-hover:text-white transition-colors duration-200">
            {icon}
        </div>
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900 text-xs text-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            {label}
        </div>
    </button>
);

// --- Data Field Component ---
const DataField = ({ icon, label, value, isMono = false, copyable = false, linkable = false, href = null }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (copyable && value) {
            copyToClipboard(value, label);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="group bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200 hover:shadow-md hover:shadow-slate-900/10">
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-slate-400 flex items-center tracking-wide uppercase">
                    {icon}
                    {label}
                </p>
                {(copyable || linkable) && (
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {copyable && (
                            <FloatingActionButton
                                onClick={handleCopy}
                                icon={copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                                label={copied ? "Copied!" : `Copy ${label}`}
                                className={copied ? "from-emerald-600 to-emerald-500" : ""}
                            />
                        )}
                        {linkable && href && (
                            <FloatingActionButton
                                onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
                                icon={<ExternalLink size={12} />}
                                label="View on Explorer"
                            />
                        )}
                    </div>
                )}
            </div>
            <div className={`font-medium text-slate-200 ${isMono ? 'font-mono text-sm' : 'text-sm'} group-hover:text-white transition-colors duration-200`}>
                {linkable && href ? (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
                    >
                        {value}
                        <ArrowUpRight size={12} className="ml-1 opacity-70" />
                    </a>
                ) : (
                    value
                )}
            </div>
        </div>
    );
};

// --- Main Component ---
const TransactionHistoryCard = ({ transactions, isLoading, error }) => {
    const [hoveredCard, setHoveredCard] = useState(null);

    // Mock data for demonstration
    const mockTransactions = [
        {
            _id: '1',
            transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
            status: 'completed',
            amount: 1250.75,
            type: 'withdrawal',
            timestamp: new Date().toISOString(),
            user: { email: 'john.doe@example.com' },
            adminName: 'Alice Smith',
            adminEmail: 'alice@company.com',
            recipientAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
        },
        {
            _id: '2',
            transactionHash: '0x9876543210fedcba9876543210fedcba98765432',
            status: 'pending',
            amount: 850.00,
            type: 'deposit',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            user: { email: 'jane.smith@example.com' },
            adminName: 'Bob Johnson',
            adminEmail: 'bob@company.com',
            recipientAddress: '0xfedcba0987654321fedcba0987654321fedcba09'
        },
        {
            _id: '3',
            transactionHash: '0x1111222233334444555566667777888899990000',
            status: 'failed',
            amount: 500.25,
            type: 'transfer',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            user: { email: 'mike.wilson@example.com' },
            adminName: 'Carol Davis',
            adminEmail: 'carol@company.com',
            recipientAddress: '0x0000999988887777666655554444333322221111'
        }
    ];

    const displayTransactions = transactions || mockTransactions;

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                    <PremiumSkeletonCard key={index} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div role="alert" className="flex flex-col justify-center items-center min-h-[300px] bg-gradient-to-br from-red-950/40 via-red-900/30 to-red-950/40 backdrop-blur-xl border border-red-800/50 rounded-2xl shadow-2xl p-8 text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-red-500/30 to-red-600/30 p-4 rounded-2xl">
                        <AlertTriangle size={32} className="text-red-400" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-red-300 mb-3 tracking-tight">Transaction Load Failed</h3>
                <p className="text-red-400/80 max-w-md mx-auto leading-relaxed">{error.message || 'An unexpected error occurred while loading your transaction history. Please try again.'}</p>
            </div>
        );
    }

    if (!displayTransactions || displayTransactions.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[300px] bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 text-center">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-slate-500/20 rounded-full blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-slate-600/30 to-slate-700/30 p-4 rounded-2xl">
                        <TrendingUp size={32} className="text-slate-400" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-3 tracking-tight">No Transactions Yet</h3>
                <p className="text-slate-400/80 max-w-md mx-auto leading-relaxed">Your transaction history will appear here once you start making transfers.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {displayTransactions.map((tx, index) => {
                const statusInfo = getStatusInfo(tx.status);
                const explorerUrl = tx.transactionHash ? `${BLOCKCHAIN_EXPLORER_BASE_URL}/tx/${tx.transactionHash}` : null;
                const formattedDate = tx.timestamp ? new Date(tx.timestamp).toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                }) : 'N/A';

                const isHovered = hoveredCard === index;
                const isOutgoing = tx.type === 'withdrawal' || tx.type === 'transfer';

                return (
                    <div
                        key={tx._id || tx.transactionHash || index}
                        className={`group relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:shadow-slate-900/10 hover:border-slate-600/60 hover:-translate-y-0.5 ${isHovered ? 'scale-[1.01]' : ''}`}
                        onMouseEnter={() => setHoveredCard(index)}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        {/* Subtle animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>

                        <div className="relative p-4">
                            {/* Header Section */}
                            <div className="flex flex-wrap justify-between items-start mb-4">
                                <div className="flex items-center mb-3 sm:mb-0">
                                    <div className={`relative p-2 rounded-xl ${statusInfo.iconBg} mr-3 group-hover:scale-105 transition-transform duration-200`}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl"></div>
                                        <div className="relative flex items-center justify-center">
                                            {isOutgoing ? <ArrowUpRight size={18} className="text-orange-400" /> : <ArrowDownLeft size={18} className="text-emerald-400" />}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-base text-slate-100 mb-1 tracking-tight">
                                            Transaction {formatAddress(tx.transactionHash, 4, 4)}
                                        </h3>
                                        <div className="flex items-center text-xs text-slate-400">
                                            <CalendarClock size={12} className="mr-1.5 opacity-70" />
                                            <span className="font-medium">{formattedDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end space-y-1.5">
                                    <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-sm shadow-md ${statusInfo.className} ${statusInfo.pulse}`}>
                                        {statusInfo.icon}
                                        {statusInfo.text}
                                    </span>
                                    <div className="text-right">
                                        <div className={`text-lg font-bold ${isOutgoing ? 'text-orange-400' : 'text-emerald-400'} mb-0.5`}>
                                            {isOutgoing ? '-' : '+'}{tx.amount?.toFixed(2) ?? '0.00'} USDT
                                        </div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                                            {tx.type || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <DataField
                                    icon={<User size={14} className="mr-2" />}
                                    label="User Account"
                                    value={
                                        <div>
                                            <div className="text-slate-200">{tx?.user?.email || 'N/A'}</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Admin: {tx.adminName || 'N/A'} {tx.adminEmail && tx.adminEmail !== 'N/A' && `(${tx.adminEmail})`}
                                            </div>
                                        </div>
                                    }
                                />

                                <DataField
                                    icon={<CreditCard size={14} className="mr-2" />}
                                    label="Recipient"
                                    value={formatAddress(tx.recipientAddress)}
                                    isMono={true}
                                    copyable={!!tx.recipientAddress}
                                />

                                <DataField
                                    icon={<Zap size={14} className="mr-2" />}
                                    label="Transaction Hash"
                                    value={formatAddress(tx.transactionHash)}
                                    isMono={true}
                                    copyable={!!tx.transactionHash}
                                    linkable={!!explorerUrl}
                                    href={explorerUrl}
                                />
                            </div>
                        </div>

                        {/* Bottom glow effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent group-hover:via-slate-500/70 transition-colors duration-300"></div>
                    </div>
                );
            })}
        </div>
    );
};

export default TransactionHistoryCard;