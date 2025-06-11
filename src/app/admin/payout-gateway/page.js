'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    Loader2, AlertTriangle, Send, DollarSign, Users, Wallet, ArrowRight,
    Info, CheckCircle, History, HelpCircle, Search, RefreshCcw, Copy, ExternalLink, X,
    Filter, Download, TrendingUp, TrendingDown, FileText, XCircle, Clock, ArrowRightLeft,
    Settings, ChevronLeft, ChevronRight, Calendar, BarChart3, Eye,
    FileDown, ClipboardList, ListFilter, Layers, ArrowDown, ArrowUp, ChevronDown, Mail, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import { parseUnits, isAddress, formatUnits, encodeFunctionData } from 'viem';
import { mainnet } from 'viem/chains';
import { usePublicClient, useReadContract } from 'wagmi';
import PayoutConfirmationModal from '../components/PayoutConfirmationModal';
import { AnimatePresence, motion } from 'framer-motion';
import { debounce } from 'lodash';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import { formatUSDTBalance } from '@/lib/utils/formatUsdtBalance';

// --- Constants & Config ---
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const BLOCKCHAIN_EXPLORER = process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER || 'https://etherscan.io/tx/';
const USDT_DECIMALS = 6;
const NEXT_PUBLIC_SUPER_ADMIN_FEE_PERCENT = process.env.NEXT_PUBLIC_SUPER_ADMIN_FEE_PERCENT || "0";
const NEXT_PUBLIC_SUPER_ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET_ADDRESS || "";

// UI Constants
const accentTextGradient = "bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent";
const accentGradient = "bg-gradient-to-r from-sky-500 to-cyan-400";

// Updated ABI based on user feedback
const LUXE_ABI = {
    abi: [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "fromUserAddress",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "originalRecipientAddress",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "superAdminWalletAddress",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "totalAmount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "feeAmount",
                    "type": "uint256"
                }
            ],
            "name": "transferFromUserWithFee",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "user", "type": "address" }
            ],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
                { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "Transfer",
            "type": "event"
        }
    ]
};

// --- Helper Functions ---
const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to parse error response.' }));
        const error = new Error(errorData.message || `An error occurred fetching data. Status: ${res.status}`);
        error.status = res.status;
        console.error("Fetcher Error:", error);
        throw error;
    }
    return res.json();
};

const parseAmountViem = (amountStr) => {
    try {
        const cleanAmount = String(amountStr).replace(',', '.');
        if (!/^\d*\.?\d*$/.test(cleanAmount) && cleanAmount !== '0') return null;
        const parsed = parseUnits(cleanAmount.trim(), USDT_DECIMALS);
        return parsed > 0n ? parsed : null;
    } catch (error) {
        console.error("Amount parsing error:", error);
        return null;
    }
};

const formatAddress = (address, prefixLength = 6, suffixLength = 4) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length < prefixLength + suffixLength + 3) return address;
    return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => toast.success('Copied to clipboard', {
            style: {
                background: 'hsl(222.2 84% 4.9%)',
                color: 'hsl(210 40% 96.1%)',
                border: '1px solid hsl(195, 80%, 50%)',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
            iconTheme: {
                primary: 'hsl(173, 80%, 40%)',
                secondary: 'hsl(210 40% 96.1%)',
            },
        }))
        .catch(err => toast.error('Failed to copy', {
            style: {
                background: 'hsl(222.2 84% 4.9%)',
                color: 'hsl(0, 70%, 70%)',
                border: '1px solid hsl(0, 72.2%, 50.6%)',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
        }));
};

const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const formatBalanceForOption = (balance) => {
    if (typeof balance !== 'number' || isNaN(balance)) return 'N/A';
    return balance.toFixed(2) + ' $';
}

// Helper to get status color and icon
const getStatusStyle = (status) => {
    switch (status) {
        case 'completed':
            return { color: 'text-green-400', bgColor: 'bg-green-500/10', icon: <CheckCircle size={14} /> };
        case 'pending':
            return { color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', icon: <Clock size={14} /> };
        case 'failed':
            return { color: 'text-red-400', bgColor: 'bg-red-500/10', icon: <XCircle size={14} /> };
        case 'cancelled':
            return { color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: <AlertTriangle size={14} /> };
        default:
            return { color: 'text-gray-500', bgColor: 'bg-gray-600/10', icon: <AlertTriangle size={14} /> };
    }
};

// Helper to get transaction type icon
const getTypeIcon = (type) => {
    switch (type) {
        case 'deposit': return <TrendingDown size={16} className="text-green-400" />;
        case 'withdrawal': return <TrendingUp size={16} className="text-red-400" />;
        case 'profit': return <DollarSign size={16} className="text-blue-400" />;
        case 'fee': return <Settings size={16} className="text-orange-400" />;
        case 'subscription': return <FileText size={16} className="text-purple-400" />;
        case 'payout': return <Send size={16} className="text-sky-400" />;
        default: return <ArrowRightLeft size={16} className="text-gray-400" />;
    }
};

// Skeleton loader for transaction cards
const TransactionCardSkeleton = () => (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/40 shadow-lg p-4 animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div className="space-y-1">
                <div className="h-3 bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-700 rounded w-32"></div>
            </div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
        </div>
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-700/30">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700/30 space-y-2">
            <div className="flex justify-between">
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            </div>
            <div className="h-3 bg-gray-700 rounded w-full"></div>
        </div>
    </div>
);

// Transaction Details Modal
const TransactionDetailsModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const statusStyle = getStatusStyle(transaction.status);
    const typeIcon = getTypeIcon(transaction.type);
    const amountColor = transaction.type === 'deposit' || transaction.type === 'profit' ? 'text-green-400' : transaction.type === 'withdrawal' || transaction.type === 'payout' ? 'text-red-400' : 'text-gray-300';
    const amountPrefix = transaction.type === 'deposit' || transaction.type === 'profit' ? '+' : transaction.type === 'withdrawal' || transaction.type === 'payout' ? '-' : '';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-900 border border-gray-700 rounded-xl shadow-xl max-w-lg w-full p-5"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-white">Transaction Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* User Info Section */}
                    {transaction.user && (
                        <div className="flex items-center gap-3 pb-3 border-b border-700/50">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                <Users size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400">User</div>
                                <div className="text-white font-medium">{transaction.user.name}</div>
                                <div className="text-xs text-gray-500">{transaction.user.email}</div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                            {typeIcon}
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">Transaction Type</div>
                            <div className="text-white capitalize">{transaction.type}</div>
                        </div>
                    </div>

                    <div className="flex flex-col pt-3 border-t border-gray-700/50">
                        <div className="flex justify-between py-2">
                            <div className="text-gray-400">Amount</div>
                            <div className={`font-semibold ${amountColor}`}>
                                {amountPrefix}{transaction.amount.toFixed(2)} {transaction.currency}
                            </div>
                        </div>

                        <div className="flex justify-between py-2">
                            <div className="text-gray-400">Status</div>
                            <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                                {statusStyle.icon}
                                {capitalizeFirstLetter(transaction.status)}
                            </div>
                        </div>

                        <div className="flex justify-between py-2">
                            <div className="text-gray-400">Date & Time</div>
                            <div className="text-white">{moment(transaction.createdAt).format('MMM D, YYYY h:mm A')}</div>
                        </div>

                        <div className="flex justify-between py-2">
                            <div className="text-gray-400">Balance Type</div>
                            <div className={transaction.balanceType === 'real' ? 'text-blue-400' : 'text-purple-400'}>
                                {capitalizeFirstLetter(transaction.balanceType)}
                            </div>
                        </div>

                        {transaction.txHash && (
                            <div className="flex justify-between py-2">
                                <div className="text-gray-400">Transaction Hash</div>
                                <div className="text-white break-all text-sm max-w-xs">{transaction.txHash}</div>
                            </div>
                        )}

                        {transaction.description && (
                            <div className="py-2">
                                <div className="text-gray-400 mb-1">Description</div>
                                <div className="text-white text-sm bg-gray-800/50 p-3 rounded-md">{transaction.description}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Date Range Picker Component
const DateRangeFilter = ({ startDate, endDate, onStartDateChange, onEndDateChange, onApply, onClear }) => {
    return (
        <div className="flex flex-col space-y-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Date Range</label>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <DatePicker
                        selected={startDate}
                        onChange={onStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={new Date()}
                        placeholderText="Start Date"
                        className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm text-gray-200"
                        wrapperClassName="w-full"
                        popperClassName="react-datepicker-dark"
                        dateFormat="MMM d, YYYY"
                    />
                    <Calendar size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                <div className="relative flex-1">
                    <DatePicker
                        selected={endDate}
                        onChange={onEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        maxDate={new Date()}
                        placeholderText="End Date"
                        className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm text-gray-200"
                        wrapperClassName="w-full"
                        popperClassName="react-datepicker-dark"
                        dateFormat="MMM d, YYYY"
                    />
                    <Calendar size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                <div className="flex gap-1">
                    <button
                        onClick={onApply}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-700 rounded-md text-white transition-colors text-sm flex-shrink-0"
                    >
                        Apply
                    </button>

                    {(startDate || endDate) && (
                        <button
                            onClick={onClear}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors text-sm flex-shrink-0"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Export Transactions Button
const ExportTransactions = ({ transactions, isLoading }) => {
    const handleExport = () => {
        if (!transactions || transactions.length === 0) return;

        const headers = ['User Name', 'User Email', 'Type', 'Amount', 'Currency', 'Status', 'Created At', 'Description', 'Transaction Hash'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(tx => [
                `"${tx.user?.name || 'N/A'}"`,
                `"${tx.user?.email || 'N/A'}"`,
                tx.type,
                tx.amount,
                tx.currency,
                tx.status,
                moment(tx.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                `"${tx.description || ''}"`,
                tx.txHash || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `admin_payout_history_${moment().format('YYYY-MM-DD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            disabled={isLoading || !transactions || transactions.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-md text-white transition-colors text-sm"
        >
            <FileDown size={16} />
            Export CSV
        </button>
    );
};

// Group transactions by date
const groupTransactionsByDate = (transactions) => {
    if (!transactions || transactions.length === 0) return [];

    const grouped = transactions.reduce((acc, transaction) => {
        const date = moment(transaction.createdAt).format('MMM D, YYYY');

        if (!acc[date]) {
            acc[date] = [];
        }

        acc[date].push(transaction);
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([date, txs]) => ({ date, transactions: txs }))
        .sort((a, b) => moment(b.date, 'MMM D, YYYY').diff(moment(a.date, 'MMM D, YYYY')));
};

const cardBaseClasses = "relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/40 via-gray-800/50 to-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl";

// --- Main Component ---
export default function PayoutGatewayPage() {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State for Payout Form
    const [pageError, setPageError] = useState(null);
    const [formError, setFormError] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountString, setAmountString] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // Actual search query state (debounced)
    const [searchQueryInput, setSearchQueryInput] = useState(''); // Input field value state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submittedTxHash, setSubmittedTxHash] = useState(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [currentPayoutRequest, setCurrentPayoutRequest] = useState(null);
    const [isEstimatingFee, setIsEstimatingFee] = useState(false);
    const [feeEstimationError, setFeeEstimationError] = useState(null);
    const [estimatedGasFeeEth, setEstimatedGasFeeEth] = useState(null);
    const [ethPriceUsd, setEthPriceUsd] = useState(null);
    const [ethPriceLoading, setEthPriceLoading] = useState(true);
    const [ethPriceError, setEthPriceError] = useState(null);

    // State for User Selection Pagination
    const [usersCurrentPage, setUsersCurrentPage] = useState(1);
    const USERS_PER_PAGE = 2; // Display 6 users per page

    // State for History View (new features)
    const [viewMode, setViewMode] = useState(searchParams.get('view') || 'form'); // 'form', 'history', 'help', 'grid', 'list', 'grouped'
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
    const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '9', 10)); // Default to 9 for grid
    const [historySearchTerm, setHistorySearchTerm] = useState(searchParams.get('historySearch') || '');
    const [filterType, setFilterType] = useState(searchParams.get('type') || '');
    const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : null);
    const [endDate, setEndDate] = useState(searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [historySearchInputValue, setHistorySearchInputValue] = useState(historySearchTerm);
    const [selectedTx, setSelectedTx] = useState(null); // For transaction details modal
    const helpTextSpecifyAmount = "Specify the amount to be sent to the user's wallet.";
    const helpTextReviewDetails = "Review the details of the payout request.";
    const helpTextInitiatePayoutStart = "Initiate the payout process.";
    const helpTextAdminWalletConnection = "Connect your admin wallet to initiate the payout process.";
    const helpTextGasFees = "Estimate the gas fees for the transaction.";
    const helpTextRecordKeeping = "Keep a record of the payout request for future reference.";
    const helpTextTxRevertedStart = "The transaction has been reverted. Please try again.";
    const helpTextSelectUserDropdownEmpty = "Select a user from the dropdown.";

   







    // --- SWR Data Fetching ---
    const shouldFetchUsers = sessionStatus === 'authenticated';
    const { data: usersData, error: usersError, isLoading: usersLoading, isValidating: usersValidating } = useSWR(
        shouldFetchUsers ? '/api/admin/payout-gateway' : null,
        fetcher,
        {
            onError: (err, key) => {
                console.error(`SWR Fetch Error (${key}):`, err);
                setPageError(err.message || 'Failed to load gateway data.');
            },
            revalidateOnFocus: true,
            revalidateOnMount: true,
            dedupingInterval: 7000,
        }
    );

    const allUsers = usersData?.users || []; // Renamed to allUsers

    const { data: fetchedPlatformBalance, isLoading: isPlatformBalanceLoading, isError: isPlatformBalanceError } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: LUXE_ABI.abi, // Use the 'abi' property from the imported JSON
        functionName: 'getBalanceOf',
        args: session?.user?.address ? [session.user.address] : undefined,
        query: {
            enabled: !!session?.user?.address, // Only fetch if walletAddress exists
        },
    });

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const publicClient = usePublicClient();

    // Fetch ETH price on mount
    useEffect(() => {
        const fetchEthPrice = async () => {
            try {
                setEthPriceLoading(true);
                setEthPriceError(null);
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                if (!response.ok) {
                    throw new Error(`Failed to fetch ETH price: ${response.statusText}`);
                }
                const data = await response.json();
                if (data && data.ethereum && data.ethereum.usd) {
                    setEthPriceUsd(data.ethereum.usd);
                } else {
                    throw new Error('Invalid response from price API');
                }
            } catch (error) {
                console.error("Error fetching ETH price:", error);
                setEthPriceError(error.message || 'Failed to fetch ETH price');
                setEthPriceUsd(null);
            } finally {
                setEthPriceLoading(false);
            }
        };

        fetchEthPrice();
        // Optionally refetch price periodically
        const intervalId = setInterval(fetchEthPrice, 60000); // Refetch every 60 seconds
        return () => clearInterval(intervalId);
    }, []);


    // --- Gas Estimation Function (Frontend) ---
    const estimateGasFee = useCallback(async () => {
        if (!selectedUserId || !recipientAddress || !amountString || !isAddress(recipientAddress) || parseAmountViem(amountString) === null) {
            setEstimatedGasFeeEth(null);
            setIsEstimatingFee(false);
            setFeeEstimationError(null);
            return;
        }

        setIsEstimatingFee(true);
        setFeeEstimationError(null);
        setEstimatedGasFeeEth(null);

        const selectedUser = allUsers.find(u => u._id === selectedUserId);
        if (!selectedUser || !selectedUser.walletAddress || !isAddress(selectedUser.walletAddress)) {
            setFeeEstimationError("Selected user has an invalid or missing source wallet address.");
            setIsEstimatingFee(false);
            return;
        }

        const amountParsed = parseAmountViem(amountString);
        if (!amountParsed) {
            setFeeEstimationError("Invalid amount for estimation.");
            setIsEstimatingFee(false);
            return;
        }

        const superAdminFeePercent = parseFloat(NEXT_PUBLIC_SUPER_ADMIN_FEE_PERCENT);
        const superAdminWalletAddress = NEXT_PUBLIC_SUPER_ADMIN_WALLET_ADDRESS;

        if (isNaN(superAdminFeePercent) || superAdminFeePercent < 0 || superAdminFeePercent > 100 || !isAddress(superAdminWalletAddress)) {
            setFeeEstimationError("Server configuration error (Fee Percent or Super Admin Wallet). Cannot estimate gas.");
            setIsEstimatingFee(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/payout-gateway?action=estimate-gas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUserId,
                    recipientAddress: recipientAddress,
                    amount: amountString,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `API Error: ${response.status}`);
            }
            //log
            console.log("Gas Estimation Result:", result);

            setEstimatedGasFeeEth(result.estimatedFeeEth);
            setFeeEstimationError(null); // Clear any previous errors

        } catch (error) {
            console.error("Error estimating gas fee via API:", error);
            let errorMessage = error.message || "Failed to estimate gas fee.";
            setFeeEstimationError(errorMessage);
            setEstimatedGasFeeEth(null);
        } finally {
            setIsEstimatingFee(false);
        }
    }, [selectedUserId, recipientAddress, amountString, allUsers]); // Removed publicClient from dependencies

    // Build the query string for history based on state
    const buildHistoryQueryString = useCallback(() => {
        const params = new URLSearchParams();
        params.set('action', 'history');
        params.set('page', currentPage.toString());
        params.set('limit', limit.toString());
        if (historySearchTerm) params.set('search', historySearchTerm);
        if (filterType) params.set('type', filterType);
        if (filterStatus) params.set('status', filterStatus);
        if (sort) params.set('sort', sort);
        if (startDate) params.set('startDate', startDate.toISOString().split('T')[0]);
        if (endDate) params.set('endDate', endDate.toISOString().split('T')[0]);
        return params.toString();
    }, [currentPage, limit, historySearchTerm, filterType, filterStatus, sort, startDate, endDate]);

    const historyApiUrl = sessionStatus === 'authenticated' && viewMode !== 'form' && viewMode !== 'help' ? `/api/admin/payout-gateway?${buildHistoryQueryString()}` : null;

    const { data: historyData, error: historyError, isLoading: historyLoading, isValidating: historyValidating, mutate: mutateHistory } = useSWR(
        historyApiUrl,
        fetcher,
        {
            onError: (err, key) => {
                console.error(`SWR History Fetch Error (${key}):`, err);
                toast.error(err.message || 'Failed to load payout history.');
            },
            revalidateOnFocus: true,
            revalidateOnMount: true,
            dedupingInterval: 15000,
            keepPreviousData: true,
        }
    );

    const transactionsHistory = historyData?.transactions || [];
    const totalHistoryItems = historyData?.total || 0;
    const totalHistoryPages = Math.ceil(totalHistoryItems / limit);

    const isComponentLoading = sessionStatus === 'loading' || (shouldFetchUsers && usersLoading && !usersData);
    const isDataRefreshing = usersValidating || historyValidating;

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const filtered = allUsers.filter(user =>
            user?._id &&
            (user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.walletAddress?.toLowerCase().includes(query))
        );

        // Apply pagination
        const startIndex = (usersCurrentPage - 1) * USERS_PER_PAGE;
        const endIndex = startIndex + USERS_PER_PAGE;
        return filtered.slice(startIndex, endIndex);
    }, [allUsers, searchQuery, usersCurrentPage]);

    const totalFilteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return allUsers.filter(user =>
            user?._id &&
            (user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.walletAddress?.toLowerCase().includes(query))
        ).length;
    }, [allUsers, searchQuery]);

    const totalUsersPages = Math.ceil(totalFilteredUsers / USERS_PER_PAGE);


    // --- Effects ---    
    useEffect(() => {
        // Screen size detection for responsive tab visibility
        if (typeof window !== 'undefined') {
            const mediaQuery = window.matchMedia('(max-width: 639px)');
            const updateScreenSize = () => setIsSmallScreen(mediaQuery.matches);
            updateScreenSize();
            mediaQuery.addEventListener('change', updateScreenSize);
            return () => mediaQuery.removeEventListener('change', updateScreenSize);
        }
    }, []);

    useEffect(() => {
        // If on a small screen and current view is 'list' (which will be hidden),
        // switch to a default visible view like 'grid'.
        if (isSmallScreen && viewMode === 'list') {
            setViewMode('grid');
        }
    }, [isSmallScreen, viewMode, setViewMode]);

    useEffect(() => {
        if (submitError) setSubmitError(null);
        if (submissionSuccess) setSubmissionSuccess(false);
        if (submittedTxHash) setSubmittedTxHash(null);
    }, [selectedUserId, recipientAddress, amountString]);

    // Debounced search handler for users
    const debouncedSetSearchQuery = useCallback(
        debounce((value) => {
            setSearchQuery(value);
        }, 300), // Debounce for 300ms
        []
    );

    // Reset user pagination when search query changes
    useEffect(() => {
        setUsersCurrentPage(1);
    }, [searchQuery]);

    // Initialize searchQueryInput with searchQuery
    useEffect(() => {
        setSearchQueryInput(searchQuery);
    }, [searchQuery]);


    useEffect(() => {
        const handler = setTimeout(() => {
            estimateGasFee();
        }, 500);
        return () => {
            clearTimeout(handler);
        };
    }, [selectedUserId, recipientAddress, amountString, estimateGasFee]);

    // Calculate estimated gas fee in USD
    const estimatedGasFeeUsd = useMemo(() => {
        if (estimatedGasFeeEth !== null && ethPriceUsd !== null) {
            return parseFloat(estimatedGasFeeEth) * ethPriceUsd;
        }
        return null;
    }, [estimatedGasFeeEth, ethPriceUsd]);


    // Update URL when history state changes
    useEffect(() => {
        const newParams = new URLSearchParams();
        newParams.set('view', viewMode);

        // Add history-related parameters only if the viewMode is one of the history views
        if (['grid', 'list', 'grouped'].includes(viewMode)) {
            newParams.set('page', currentPage.toString());
            newParams.set('limit', limit.toString());
            if (historySearchTerm) newParams.set('historySearch', historySearchTerm);
            if (filterType) newParams.set('type', filterType);
            if (filterStatus) newParams.set('status', filterStatus);
            if (sort) newParams.set('sort', sort);
            if (startDate) newParams.set('startDate', startDate.toISOString().split('T')[0]);
            if (endDate) newParams.set('endDate', endDate.toISOString().split('T')[0]);
        }

        router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }, [
        viewMode, currentPage, limit, historySearchTerm, filterType, filterStatus, sort, startDate, endDate,
        pathname, router
    ]);
    // Debounced search handler for history
    const debouncedHistorySearch = useCallback(
        debounce((value) => {
            setHistorySearchTerm(value);
            setCurrentPage(1);
        }, 800),
        []
    );

    const handleHistorySearchInputChange = (e) => {
        const value = e.target.value;
        setHistorySearchInputValue(value);
        debouncedHistorySearch(value);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'type') setFilterType(value);
        if (name === 'status') setFilterStatus(value);
        setCurrentPage(1);
    };

    const handleSortChange = (e) => {
        setSort(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalHistoryPages) {
            setCurrentPage(newPage);
        }
    };

    const handleUsersPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalUsersPages) {
            setUsersCurrentPage(newPage);
        }
    };

    const handleDateFilterApply = () => {
        setCurrentPage(1);
        mutateHistory();
    };

    const handleDateFilterClear = () => {
        setStartDate(null);
        setEndDate(null);
        setCurrentPage(1);
        mutateHistory();
    };

    // Adjust limit based on view
    useEffect(() => {
        if (viewMode === 'list' || viewMode === 'grouped') {
            setLimit(20);
        } else if (viewMode === 'grid') {
            setLimit(9);
        }
        setCurrentPage(1);
    }, [viewMode]);

    
    useEffect(() => {
        if (usersError) {
            console.error('Error fetching users:', usersError);
            setPageError(usersError.message || 'Failed to load users.');
        }
    }, [usersError]);

    // log usersData
    useEffect(() => {
        console.log('usersData:', usersData);
    }, [usersData]);


    // CSS for custom DatePicker styling
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .react-datepicker {
                background-color: #1F2937 !important;
                border-color: #4B5563 !important;
                color: white !important;
            }
            .react-datepicker__header {
                background-color: #111827 !important;
                border-color: #4B5563 !important;
            }
            .react-datepicker__day-name, .react-datepicker__current-month {
                color: white !important;
            }
            .react-datepicker__day {
                color: #D1D5DB !important;
            }
            .react-datepicker__day:hover {
                background-color: #374151 !important;
            }
            .react-datepicker__day--selected, .react-datepicker__day--in-range {
                background-color: #0EA5E9 !important; /* sky-500 */
                color: white !important;
            }
            .react-datepicker__day--disabled {
                color: #6B7280 !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // --- Handlers for Payout Form ---
    const handleUserChange = (event) => {
        setSelectedUserId(event.target.value);
    };

    const handlePayoutSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setSubmitError(null);
        setSubmittedTxHash(null);
        setSubmissionSuccess(false);

        if (!CONTRACT_ADDRESS || !isAddress(CONTRACT_ADDRESS)) {
            setFormError("Payout contract address is invalid or missing. Check configuration."); return;
        }
        const selectedUser = allUsers.find(u => u._id === selectedUserId);
        if (!selectedUser) {
            setFormError("Please select a valid user."); return;
        }
        if (!selectedUser.walletAddress || !isAddress(selectedUser.walletAddress)) {
            setFormError("Selected user has an invalid or missing source wallet address."); return;
        }
        if (!recipientAddress || !isAddress(recipientAddress)) {
            setFormError("Invalid recipient wallet address format."); return;
        }
        if (recipientAddress.toLowerCase() === selectedUser.walletAddress.toLowerCase()) {
            setFormError("Recipient address cannot be the same as the user's source address."); return;
        }

        const amountParsed = parseAmountViem(amountString);
        const userContractBalanceRaw = selectedUser.contractBalance;
        if (typeof userContractBalanceRaw !== 'number' || isNaN(userContractBalanceRaw) || userContractBalanceRaw < 0) {
            setFormError(`Cannot verify user's on-chain balance. It appears invalid (${userContractBalanceRaw}). Refresh data or contact support.`); return;
        }
        const userContractBalanceUnits = parseUnits(userContractBalanceRaw.toFixed(USDT_DECIMALS), USDT_DECIMALS);
        if (amountParsed > userContractBalanceUnits) {
            const amountFormatted = formatUnits(amountParsed, USDT_DECIMALS);
            const balanceFormatted = userContractBalanceRaw.toFixed(2);
            setFormError(`Insufficient balance. User has ${balanceFormatted} USDT on-chain, attempted: ${amountFormatted} USDT.`); return;
        }

        if (!amountParsed) {
            setFormError("Invalid amount. Please enter a positive number (e.g., 100.50)."); return;
        }

        let feeAmountBigInt = 0n;
        try {
            const feePercentNum = parseFloat(NEXT_PUBLIC_SUPER_ADMIN_FEE_PERCENT);
            if (amountParsed > 0n && !isNaN(feePercentNum) && feePercentNum >= 0 && feePercentNum <= 100) {
                feeAmountBigInt = (amountParsed * BigInt(Math.round(feePercentNum * 100))) / BigInt(10000);
            }
        } catch (e) {
            console.error("Error calculating fee amount for estimation:", e);
        }


        const userForModal = allUsers.find(u => u._id === selectedUserId);
        setCurrentPayoutRequest({
            userId: selectedUserId,
            userWalletAddress: userForModal?.walletAddress,
            recipientAddress: recipientAddress,
            amountString: amountString,
            estimatedGasFeeEth: estimatedGasFeeEth,
        });
        setIsConfirmModalOpen(true);
    };

    const handleConfirmPayout = async () => {
        if (!currentPayoutRequest) return;
        setIsConfirmModalOpen(false);
        setIsSubmitting(true);

        const { userId, recipientAddress: currentRecipientAddress, amountString: currentAmountString, estimatedGasFeeEth } = currentPayoutRequest;

        const payload = {
            userId: userId,
            recipientAddress: currentRecipientAddress,
            amount: currentAmountString,
            estimatedGasFeeEth: estimatedGasFeeEth
        };

        try {
            const response = await fetch('/api/admin/payout-gateway', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `API Error: ${response.status}`);
            }

            setSubmittedTxHash(result.transactionHash);
            setSubmissionSuccess(true);
            setCurrentPayoutRequest(prevDetails => ({
                ...prevDetails,
                estimatedEthFee: result.estimatedGasFeeEth
            }));

            toast.success(
                (t) => (
                    <div className="flex flex-col items-start relative pr-6">
                        <span className="font-semibold text-base text-green-400">Payout Submitted</span>
                        <span className="text-sm text-zinc-300 mt-1">Transaction sent to the network.</span>
                        {result.transactionHash && (
                            <a
                                href={`${BLOCKCHAIN_EXPLORER}${result.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline text-sky-400 hover:text-sky-300 mt-2 flex items-center group"
                            >
                                View on Explorer <ExternalLink size={12} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        )}
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="absolute top-1 right-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ),
                {
                    duration: 10000,
                    style: {
                        background: 'hsl(220 20% 10% / 0.95)',
                        color: 'hsl(100 70% 80%)',
                        border: '1px solid hsl(145, 63.4%, 40.8%)',
                        borderRadius: '0.75rem',
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                    },
                    icon: <CheckCircle size={20} className="text-green-400" />,
                }
            );

            setSelectedUserId('');
            setRecipientAddress('');
            setAmountString('');
            mutate('/api/admin/payout-gateway');
            if (viewMode === 'history') {
                mutateHistory();
            }
        } catch (error) {
            console.error("Payout submission error after confirmation:", error);
            const errorMessage = error.message || "An unknown error occurred during submission.";
            setSubmitError(errorMessage);
            toast.error(
                (t) => (
                    <div className="flex items-start relative pr-6">
                        <AlertTriangle size={20} className="mr-3 mt-0.5 text-red-400 flex-shrink-0" />
                        <div className="flex-1">
                            <span className="font-semibold block text-base text-red-400">Payout Submission Failed</span>
                            <span className="text-sm text-zinc-300 break-words mt-1">{errorMessage}</span>
                        </div>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="absolute top-1 right-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ),
                {
                    duration: 12000,
                    style: {
                        background: 'hsl(220 20% 10% / 0.95)',
                        color: 'hsl(0, 70%, 80%)',
                        border: '1px solid hsl(0, 72.2%, 50.6%)',
                        borderRadius: '0.75rem',
                        padding: '12px 16px',
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                        maxWidth: '450px',
                    },
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const groupedTransactions = useMemo(() =>
        groupTransactionsByDate(transactionsHistory),
        [transactionsHistory]
    );

    // --- Render Logic ---
    if (isComponentLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-zinc-400 bg-slate-950">
                <Loader2 className="animate-spin h-12 w-12 text-sky-500 mb-6" />
                <span className="text-xl font-medium animate-pulse">
                    {sessionStatus === 'loading' ? 'Verifying Session...' : 'Loading Gateway Interface...'}
                </span>
                <p className="text-sm text-zinc-500 mt-2">Please wait a moment.</p>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center px-6 bg-gradient-to-br from-red-900/20 via-slate-900/10 to-slate-950/30 rounded-lg py-16 border border-red-700/40">
                <AlertTriangle className="h-20 w-20 text-red-500/70 mb-8 opacity-80" strokeWidth={1.2} />
                <h2 className="text-3xl font-semibold text-red-400 mb-4">Gateway Unavailable</h2>
                <p className="text-zinc-300 max-w-md mb-10">{pageError}</p>
                {sessionStatus === 'unauthenticated' && (
                    <button
                        onClick={() => signIn()}
                        className="mt-6 px-8 py-3 bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-semibold rounded-lg shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                        Log In to Access
                    </button>
                )}
                {pageError.includes("wallet not connected") && (
                    <p className="mt-6 text-sm text-yellow-400">Please ensure your wallet is connected and the correct network is selected.</p>
                )}
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 text-sm text-zinc-400 hover:text-sky-400 underline flex items-center transition-colors"
                >
                    <RefreshCcw size={14} className="mr-2" /> Try Reloading Page
                </button>
            </div>
        );
    }

    let submitButtonText = 'Initiate Payout';
    let isButtonDisabled = isConfirmModalOpen || isSubmitting || isComponentLoading || sessionStatus !== 'authenticated' || !selectedUserId || !recipientAddress || !amountString || !isAddress(recipientAddress) || parseAmountViem(amountString) === null;

    if (sessionStatus !== 'authenticated') {
        submitButtonText = 'Login Required';
    } else if (!selectedUserId) {
        submitButtonText = 'Select a User';
    } else if (!recipientAddress || !isAddress(recipientAddress)) {
        submitButtonText = 'Enter Valid Recipient Address';
    } else if (!amountString || parseAmountViem(amountString) === null) {
        submitButtonText = 'Enter Valid Amount';
    } else if (isSubmitting) {
        submitButtonText = 'Processing Payout...';
    } else if (isConfirmModalOpen) {
        submitButtonText = 'Awaiting Confirmation...';
    }




    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans text-zinc-200 bg-slate-950 min-h-screen">
            <header className="mb-10 md:mb-14">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                    <div className="flex-1 text-left">
                        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 tracking-tight ${accentTextGradient}`}>
                            Admin Payout Gateway
                        </h1>
                        <p className="text-base text-zinc-400 max-w-xl">
                            Securely initiate and manage USDT transfers from user contract balances.
                        </p>
                    </div>
                </div>

                <nav className="mt-10 border-b border-slate-700 flex space-x-1 sm:space-x-1 overflow-x-auto">
                    {['form', 'grid', 'list', 'grouped', 'help'].map((mode) => {
                        const isActive = viewMode === mode;
                        let Icon, label;
                        switch (mode) {
                            case 'form': Icon = Send; label = 'New Payout'; break;
                            case 'grid': Icon = BarChart3; label = 'Grid View'; break;
                            case 'list': Icon = ClipboardList; label = 'List View'; break;
                            case 'grouped': Icon = Layers; label = 'Grouped View'; break;
                            case 'help': Icon = HelpCircle; label = 'Help'; break;
                            default: Icon = History; label = 'History';
                        }

                        let buttonSpecificClasses = '';
                        if (mode === 'list') {
                            buttonSpecificClasses = 'hidden sm:flex';
                        }

                        return (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`relative p-3 sm:px-4 sm:py-3.5 text-sm font-semibold flex items-center justify-center sm:justify-start transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-t-lg group min-w-max
                                        ${isActive
                                        ? 'text-sky-400'
                                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-slate-800/60'
                                    } ${buttonSpecificClasses}`}
                            >
                                <Icon size={16} className={`transition-colors ${isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-300'} sm:mr-2.5`} />
                                <span className="hidden sm:inline">{label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-tab-indicator-payout"
                                        className={`absolute bottom-[-1px] left-0 right-0 h-[3px] ${accentGradient}`}
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </header>

            {isDataRefreshing && !isComponentLoading && (
                <div className="fixed top-6 right-6 bg-slate-800/90 backdrop-blur-md p-3 rounded-full shadow-xl z-50 border border-slate-700 animate-pulse">
                    <RefreshCcw size={20} className="text-sky-400" />
                </div>
            )}

            <main>
                <PayoutConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => {
                        setIsConfirmModalOpen(false);
                        setCurrentPayoutRequest(null);
                    }}
                    onConfirm={handleConfirmPayout}
                    payoutDetails={currentPayoutRequest}
                    superAdminFeePercent={NEXT_PUBLIC_SUPER_ADMIN_FEE_PERCENT}
                    superAdminWalletAddress={NEXT_PUBLIC_SUPER_ADMIN_WALLET_ADDRESS}
                    toast={toast}
                />
                <AnimatePresence mode="wait">
                    {viewMode === 'form' && shouldFetchUsers && (

                        <motion.div
                            key="payout-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/40 via-gray-800/50 to-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl"
                        >
                            {/* Animated background overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5"></div>

                            <form onSubmit={handlePayoutSubmit} className="relative p-6 md:p-8 lg:p-12 space-y-10">
                                {/* Enhanced Header */}
                                <div className="flex flex-col lg:flex-row items-start lg:items-center lg:justify-between gap-6 border-b border-slate-700/50 pb-8 mb-8">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
                                            <Send size={24} className="text-white" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent tracking-tight">
                                                Create Payout Request
                                            </h2>
                                            <p className="text-gray-400 mt-1 text-sm">Send USDT payments securely on-chain</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                                            <span className="text-green-400  whitespace-nowrap text-xs font-medium flex items-center">
                                                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                                Network Active
                                            </span>
                                        </div>
                                        <div className="relative w-full sm:max-w-md">
                                            <Search size={35} className="absolute bg-gray-500/40 p-2 rounded-full left-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search user (name, email, wallet)"
                                                value={searchQueryInput}
                                                onChange={(e) => {
                                                    setSearchQueryInput(e.target.value);
                                                    debouncedSetSearchQuery(e.target.value);
                                                }}
                                                className="w-full placeholder:invisible md:placeholder:block pl-10 pr-10 py-[2px] bg-slate-700/50 border border-slate-600 rounded-full text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                                            />
                                            {searchQueryInput && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchQueryInput('');
                                                        setSearchQuery('');
                                                        debouncedSetSearchQuery.cancel(); // Cancel any pending debounced calls
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    aria-label="Clear search"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* User Selection Cards */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white flex items-center">
                                            <Users size={20} className="mr-3 text-blue-400" />
                                            Select Funding Source
                                        </h3>
                                        {searchQueryInput && (
                                            <span className="text-xs px-3 py-1.5 bg-slate-700/80 rounded-full text-zinc-300 border border-slate-600">
                                                {totalFilteredUsers} found
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredUsers.map((user) => (
                                            <motion.div
                                                key={user._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.2 }}
                                                onClick={() => handleUserChange({ target: { value: user._id } })}
                                                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectedUserId === user._id
                                                    ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 shadow-lg shadow-blue-500/20'
                                                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50 hover:shadow-lg'
                                                    }`}
                                            >
                                                {selectedUserId === user._id && (
                                                    <div className="absolute -top-2 -right-2 p-1.5 bg-blue-500 rounded-full shadow-lg">
                                                        <CheckCircle size={16} className="text-white" />
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="font-semibold text-white truncate">{user.name || 'Unnamed'}</h4>
                                                        <p className="text-sm text-gray-400 truncate">{user.email || 'N/A'}</p>
                                                    </div>

                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400">Wallet</span>
                                                            <span className="font-mono text-green-400 font-semibold">

                                                                {formatUSDTBalance(user.walletBalance)} (USDT)

                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-400">Platform</span>
                                                            <span className="font-mono text-cyan-400 font-semibold">{formatUSDTBalance(user.contractBalance)} (USDT)</span>
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-600">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-400 text-xs">Wallet</span>
                                                                <span className="font-mono text-blue-400 text-xs">{formatAddress(user.walletAddress)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {totalFilteredUsers > USERS_PER_PAGE && (
                                        <div className="mt-6 flex justify-center items-center space-x-4">
                                            <button
                                                onClick={() => handleUsersPageChange(usersCurrentPage - 1)}
                                                disabled={usersCurrentPage === 1 || usersLoading}
                                                className="px-3 py-1 rounded-md bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
                                            >
                                                <ChevronLeft size={16} className="mr-1" />
                                                Previous
                                            </button>

                                            <span className="text-sm text-gray-400">
                                                Page {usersCurrentPage} of {totalUsersPages}
                                            </span>

                                            <button
                                                onClick={() => handleUsersPageChange(usersCurrentPage + 1)}
                                                disabled={usersCurrentPage === totalUsersPages || usersLoading}
                                                className="px-3 py-1 rounded-md bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
                                            >
                                                Next
                                                <ChevronRight size={16} className="ml-1" />
                                            </button>
                                        </div>
                                    )}

                                    {filteredUsers.length === 0 && !usersLoading && !usersValidating && searchQueryInput && (
                                        <div className="text-center py-8">
                                            <p className="text-yellow-400 mb-2">No users match your search query</p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQueryInput('');
                                                    setSearchQuery('');
                                                    debouncedSetSearchQuery.cancel();
                                                }}
                                                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                            >
                                                Clear search to see all users
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Details Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Recipient Address */}
                                    <div className="space-y-4">
                                        <label htmlFor="recipientAddress" className="block text-sm font-semibold text-zinc-300 flex items-center">
                                            <Wallet size={18} className="mr-2 text-purple-400" />
                                            Recipient Wallet Address
                                        </label>
                                        <div className="relative group">
                                            <Wallet size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                                            <input
                                                type="text"
                                                id="recipientAddress"
                                                value={recipientAddress}
                                                onChange={(e) => setRecipientAddress(e.target.value)}
                                                required
                                                className="w-full pl-11 pr-12 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                                                placeholder="0x..."
                                                disabled={isSubmitting}
                                                spellCheck="false"
                                            />
                                            {recipientAddress && !isAddress(recipientAddress) && (
                                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500">
                                                    <AlertTriangle size={18} />
                                                </div>
                                            )}
                                            {recipientAddress && isAddress(recipientAddress) && (
                                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500">
                                                    <CheckCircle size={18} />
                                                </div>
                                            )}
                                        </div>
                                        {recipientAddress && !isAddress(recipientAddress) && (
                                            <p className="text-red-400 text-sm">Invalid Ethereum address format</p>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="space-y-4">
                                        <label htmlFor="amount" className="block text-sm font-semibold text-zinc-300 flex items-center">
                                            <DollarSign size={18} className="mr-2 text-green-400" />
                                            Amount (USDT)
                                        </label>
                                        <div className="relative group">
                                            <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-400 transition-colors" />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                id="amount"
                                                value={amountString}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (/^$|^\.$|^\d*\.?\d*$/.test(value)) {
                                                        setAmountString(value.replace(',', '.'));
                                                    }
                                                }}
                                                required
                                                pattern="^[0-9]*[.]?[0-9]+$"
                                                title="Enter a valid positive USDT amount (e.g., 100.50)"
                                                className="w-full pl-11 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono text-lg"
                                                placeholder="0.00"
                                                disabled={isSubmitting}
                                                spellCheck="false"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUserId && allUsers.find(u => u._id === selectedUserId) && (
                                                <>
                                                    {[
                                                        { label: '25%', valueFn: (bal) => (bal * 0.25).toFixed(USDT_DECIMALS) },
                                                        { label: '50%', valueFn: (bal) => (bal * 0.5).toFixed(USDT_DECIMALS) },
                                                        { label: '75%', valueFn: (bal) => (bal * 0.75).toFixed(USDT_DECIMALS) },
                                                        { label: 'Max', valueFn: (bal) => bal.toFixed(USDT_DECIMALS) }
                                                    ].map(btn => (
                                                        <button
                                                            key={btn.label}
                                                            type="button"
                                                            onClick={() => {
                                                                const bal = allUsers.find(u => u._id === selectedUserId)?.contractBalance ?? 0;
                                                                if (bal > 0) setAmountString(btn.valueFn(bal));
                                                            }}
                                                            className="px-4 py-2 text-sm font-medium text-zinc-300 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                                            disabled={isSubmitting || (allUsers.find(u => u._id === selectedUserId)?.contractBalance ?? 0) <= 0}
                                                        >
                                                            {btn.label}
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500">Enter standard decimal value. System handles conversion.</p>
                                    </div>
                                </div>

                                {/* Selected User Details */}
                                {selectedUserId && allUsers.find(u => u._id === selectedUserId) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                                        className="bg-gradient-to-br from-slate-800/60 via-zinc-800/70 to-slate-800/60 rounded-xl border border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-sm"
                                    >
                                        <div className="p-6 md:p-8">
                                            <h3 className="text-lg md:text-xl font-semibold text-zinc-100 mb-6 flex items-center">
                                                <CheckCircle size={22} className="mr-3.5 text-blue-400" strokeWidth={2} />
                                                Selected User Details
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-sm text-gray-400">Name</span>
                                                        <span className="text-zinc-100 font-medium text-sm">{allUsers.find(u => u._id === selectedUserId)?.name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-sm text-gray-400">Email</span>
                                                        <span className="text-blue-300 text-sm truncate max-w-[200px]" title={allUsers.find(u => u._id === selectedUserId)?.email}>
                                                            {allUsers.find(u => u._id === selectedUserId)?.email || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-400">User Wallet</span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-blue-300 font-mono text-sm">
                                                                {formatAddress(allUsers.find(u => u._id === selectedUserId)?.walletAddress)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(allUsers.find(u => u._id === selectedUserId)?.walletAddress)}
                                                                className="p-1 text-gray-400 hover:text-blue-300 hover:bg-slate-700 rounded transition-colors"
                                                                title="Copy wallet address"
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-400">Wallet Balance</span>
                                                        <span className="font-mono text-green-400 font-semibold text-sm">
                                                            {(formatUSDTBalance(allUsers.find(u => u._id === selectedUserId)?.walletBalance) ?? 0)} USDT
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-400">Platform Balance</span>
                                                        <span className="font-mono text-cyan-400 font-semibold text-sm">
                                                            {(formatUSDTBalance(allUsers.find(u => u._id === selectedUserId)?.contractBalance) ?? 0)} USDT
                                                        </span>
                                                    </div>
                                                    {session?.user?.role === 'super-admin' && allUsers.find(u => u._id === selectedUserId)?.referredByAdmin && (
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-sm text-gray-400">Referred By</span>
                                                            <code className="text-xs text-zinc-500 truncate max-w-[150px]" title={allUsers.find(u => u._id === selectedUserId).referredByAdmin}>
                                                                {allUsers.find(u => u._id === selectedUserId).referredByAdmin}
                                                            </code>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Status Messages */}
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {formError && !isSubmitting && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5, transition: { duration: 0.2 } }}
                                                className="flex items-start p-4 bg-red-500/10 border border-red-500/30 rounded-xl shadow-lg"
                                            >
                                                <AlertTriangle size={20} className="mr-3 flex-shrink-0 mt-0.5 text-red-400" strokeWidth={2} />
                                                <span className="flex-1 font-medium text-red-300">{formError}</span>
                                                <button
                                                    onClick={() => setFormError(null)}
                                                    className="ml-3 text-red-400/80 hover:text-red-300 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </motion.div>
                                        )}
                                        {submitError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5, transition: { duration: 0.2 } }}
                                                className="flex items-start p-4 bg-red-500/10 border border-red-500/30 rounded-xl shadow-lg"
                                            >
                                                <AlertTriangle size={20} className="mr-3 flex-shrink-0 mt-0.5 text-red-400" strokeWidth={2} />
                                                <span className="flex-1 font-medium text-red-300">Submission Error: {submitError}</span>
                                                <button
                                                    onClick={() => setSubmitError(null)}
                                                    className="ml-3 text-red-400/80 hover:text-red-300 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </motion.div>
                                        )}
                                        {submittedTxHash && !submitError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className="flex items-start p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl shadow-lg"
                                            >
                                                <Info size={20} className="mr-3 flex-shrink-0 mt-0.5 text-blue-400" strokeWidth={2} />
                                                <div className="flex-1">
                                                    <span className="font-semibold text-blue-300">Transaction Submitted Successfully</span>
                                                    <p className="text-xs text-blue-400/90 mt-1">
                                                        Hash: <code className="text-blue-200">{formatAddress(submittedTxHash, 10, 6)}</code>
                                                    </p>
                                                    <p className="text-xs text-blue-400/90 mt-1">
                                                        Check block explorer or history tab for confirmation status.
                                                    </p>
                                                </div>
                                                <a
                                                    href={`${BLOCKCHAIN_EXPLORER}${submittedTxHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-3 p-1.5 text-blue-400/90 hover:text-blue-200 hover:bg-blue-500/20 rounded-md transition-colors"
                                                    title="View on Block Explorer"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Gas Estimation Display */}
                                {(isEstimatingFee || estimatedGasFeeEth !== null || feeEstimationError) && (
                                    <div className="pt-6 border-t border-slate-700/50">
                                        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                                            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center">
                                                <Zap size={16} className="mr-2 text-yellow-400" />
                                                Estimated Gas Fee
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-sm">
                                                    {isEstimatingFee && (
                                                        <span className="text-blue-400 flex items-center">
                                                            <Loader2 size={16} className="animate-spin mr-2" /> Calculating...
                                                        </span>
                                                    )}
                                                    {feeEstimationError && (
                                                        <span className="text-red-400 flex items-center">
                                                            <AlertTriangle size={16} className="mr-2" /> {feeEstimationError}
                                                        </span>
                                                    )}
                                                    {estimatedGasFeeEth !== null && !isEstimatingFee && !feeEstimationError && (
                                                        <span className="text-green-400 font-mono font-semibold">
                                                            ~{parseFloat(estimatedGasFeeEth).toFixed(6)} ETH
                                                            {estimatedGasFeeUsd !== null && (
                                                                <span className="text-gray-400 ml-2">
                                                                    (~${estimatedGasFeeUsd.toFixed(2)})
                                                                </span>
                                                            )}
                                                            {ethPriceLoading && <Loader2 size={12} className="animate-spin ml-2 inline-block" />}
                                                            {ethPriceError && <span className="text-red-400 ml-2" title={ethPriceError}><AlertTriangle size={12} className="inline-block" /></span>}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Network fee required for transaction
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-8 flex justify-end border-t border-slate-700/50">
                                    <button
                                        type="submit"
                                        disabled={isButtonDisabled || isEstimatingFee}
                                        className={`group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center ${isButtonDisabled || isEstimatingFee
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:scale-105 hover:shadow-2xl'
                                            }`}
                                    >
                                        {(isSubmitting || isEstimatingFee) && (
                                            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        )}
                                        {isEstimatingFee ? 'Estimating Fee...' : submitButtonText}
                                        {!isSubmitting && !isButtonDisabled && !isEstimatingFee && (
                                            <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {(viewMode === 'grid' || viewMode === 'list' || viewMode === 'grouped') && shouldFetchUsers && (
                        <motion.div
                            key="transaction-history-views"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                            className={cardBaseClasses}
                        >
                            <div className="p-6 md:p-8 lg:p-10">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 sm:gap-5 border-b border-slate-700 pb-8 mb-8">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-100 flex items-center tracking-tight">
                                        <History size={24} className="mr-4 text-sky-400" strokeWidth={2} />
                                        Payout History
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <ExportTransactions
                                            transactions={transactionsHistory}
                                            isLoading={historyLoading || historyValidating}
                                        />
                                        <button
                                            onClick={() => mutateHistory()}
                                            disabled={historyLoading || historyValidating}
                                            className="flex items-center px-4 py-2 text-sm font-medium text-zinc-300 bg-slate-700/80 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors disabled:opacity-60 disabled:cursor-wait shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                            title="Refresh History"
                                        >
                                            <RefreshCcw size={15} className={`mr-2 ${(historyLoading || historyValidating) ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>
                                    </div>
                                </div>

                                {/* Filter, Sort, Search Controls */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700/30"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                                        {/* Search Input */}
                                        <div className="relative">
                                            <label htmlFor="historySearch" className="block text-xs font-medium text-gray-400 mb-1">Search</label>
                                            <input
                                                type="search"
                                                id="historySearch"
                                                name="historySearch"
                                                placeholder="Search user, status..."
                                                value={historySearchInputValue}
                                                onChange={handleHistorySearchInputChange}
                                                className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm text-gray-200 placeholder-gray-500"
                                            />
                                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-0.5 mt-2 text-gray-500 pointer-events-none" />
                                        </div>

                                        {/* Filter by Status */}
                                        <div>
                                            <label htmlFor="status" className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                                            <select
                                                id="status"
                                                name="status"
                                                value={filterStatus}
                                                onChange={handleFilterChange}
                                                className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm text-gray-200"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="pending">Pending</option>
                                                <option value="completed">Completed</option>
                                                <option value="failed">Failed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        {/* Sort By */}
                                        <div>
                                            <label htmlFor="sort" className="block text-xs font-medium text-gray-400 mb-1">Sort By</label>
                                            <select
                                                id="sort"
                                                name="sort"
                                                value={sort}
                                                onChange={handleSortChange}
                                                className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm text-gray-200"
                                            >
                                                <option value="-createdAt">Newest First</option>
                                                <option value="createdAt">Oldest First</option>
                                                <option value="amount">Amount (Low to High)</option>
                                                <option value="-amount">Amount (High to Low)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Advanced Filters Toggle */}
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                            className="flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                            <Filter size={14} />
                                            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                                            <ChevronDown
                                                size={14}
                                                className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                                            />
                                        </button>

                                        {/* Advanced Filters Section */}
                                        {showAdvancedFilters && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="mt-4 pt-4 border-t border-gray-700/30"
                                            >
                                                <DateRangeFilter
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    onStartDateChange={setStartDate}
                                                    onEndDateChange={setEndDate}
                                                    onApply={handleDateFilterApply}
                                                    onClear={handleDateFilterClear}
                                                />
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Content Area */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="mt-6"
                                >
                                    {(historyLoading && !historyData) ? (
                                        <div className={`grid grid-cols-1 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-5`}>
                                            {Array(limit).fill(0).map((_, index) => (
                                                <TransactionCardSkeleton key={index} />
                                            ))}
                                        </div>
                                    ) : historyError ? (
                                        <div className="text-center py-10 text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 p-4">
                                            <AlertTriangle size={24} className="mx-auto mb-2" />
                                            <h3 className="font-medium mb-1">Error Loading Transactions</h3>
                                            <p className="text-sm">{historyError.message || 'Please try again later.'}</p>
                                        </div>
                                    ) : transactionsHistory.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 bg-gray-800/30 rounded-lg border border-gray-700/30 p-6">
                                            <Info size={24} className="mx-auto mb-3" />
                                            <h3 className="font-medium mb-2">No Payouts Found</h3>
                                            <p className="text-sm sm:text-base max-w-md mx-auto">No payouts match your current filters. Try adjusting your search criteria or filters to see more results.</p>
                                        </div>
                                    ) : viewMode === 'grid' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {transactionsHistory.map((tx) => {
                                                const statusStyle = getStatusStyle(tx.status);
                                                const typeIcon = getTypeIcon(tx.type);
                                                const amountColor = tx.type === 'deposit' || tx.type === 'profit' ? 'text-green-400' : tx.type === 'withdrawal' || tx.type === 'payout' ? 'text-red-400' : 'text-gray-300';
                                                const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' || tx.type === 'payout' ? '-' : '';

                                                return (
                                                    <motion.div
                                                        key={tx._id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="bg-gradient-to-br from-gray-800/50 via-gray-850/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/40 rounded-xl shadow-lg p-4 flex flex-col space-y-3 hover:border-gray-600/60 transition-all duration-200 cursor-pointer"
                                                        onClick={() => setSelectedTx(tx)}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold text-white text-sm flex items-center gap-1">
                                                                    <Users size={12} className="text-gray-400" /> {tx.user?.name || 'N/A'}
                                                                </div>
                                                                <div className="text-gray-400 text-xs flex items-center gap-1">
                                                                    <Mail size={12} className="text-gray-500" /> {tx.user?.email || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-300 capitalize">
                                                                {typeIcon}
                                                                {tx.type}
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
                                                            <div className={`text-lg font-bold ${amountColor}`}>
                                                                {amountPrefix}{tx.amount.toFixed(2)} <span className="text-xs text-gray-500">USDT</span>
                                                            </div>
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                                                                {statusStyle.icon}
                                                                {capitalizeFirstLetter(tx.status)}
                                                            </span>
                                                        </div>

                                                        <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-700/30">
                                                            <div className="flex justify-between items-center">
                                                                <span>{moment(tx.createdAt).format('MMM D, YYYY h:mm A')}</span>
                                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.balanceType === 'real' ? 'bg-blue-500/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'}`}>
                                                                    {capitalizeFirstLetter(tx.balanceType)} Balance
                                                                </span>
                                                            </div>
                                                            <div className="truncate pt-1" title={tx.description || tx.txHash || 'No details'}>
                                                                <span className="font-medium text-gray-300">Details:</span> {tx.description || tx.txHash || '-'}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : viewMode === 'list' ? (
                                        <div className="overflow-x-auto bg-gray-800/20 rounded-xl border border-gray-700/40">
                                            <table className="min-w-full divide-y divide-gray-700/60">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance Type</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-700/40">
                                                    {transactionsHistory.map((tx) => {
                                                        const statusStyle = getStatusStyle(tx.status);
                                                        const typeIcon = getTypeIcon(tx.type);
                                                        const amountColor = tx.type === 'deposit' || tx.type === 'profit' ? 'text-green-400' : tx.type === 'withdrawal' || tx.type === 'payout' ? 'text-red-400' : 'text-gray-300';
                                                        const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' || tx.type === 'payout' ? '-' : '';

                                                        return (
                                                            <tr
                                                                key={tx._id}
                                                                className="hover:bg-gray-700/20 transition-colors cursor-pointer"
                                                                onClick={() => setSelectedTx(tx)}
                                                            >
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className="text-sm text-white">{tx.user?.name || 'N/A'}</div>
                                                                    <div className="text-xs text-gray-400">{tx.user?.email || 'N/A'}</div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className="flex items-center gap-1.5">
                                                                        {typeIcon}
                                                                        <span className="text-sm text-gray-300 capitalize">{tx.type}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <span className={`text-sm font-medium ${amountColor}`}>
                                                                        {amountPrefix}{tx.amount.toFixed(2)} USDT
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                                                                        {statusStyle.icon}
                                                                        {capitalizeFirstLetter(tx.status)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                                                    {moment(tx.createdAt).format('MMM D, YYYY h:mm A')}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.balanceType === 'real' ? 'bg-blue-500/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'}`}>
                                                                        {capitalizeFirstLetter(tx.balanceType)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-400 max-w-xs">
                                                                    {tx.description || tx.txHash || '-'}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                                                    <button
                                                                        className="text-sky-400 hover:text-sky-300 transition-colors"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedTx(tx);
                                                                        }}
                                                                    >
                                                                        <Eye size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {groupedTransactions.map((group) => (
                                                <motion.div
                                                    key={group.date}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="bg-gray-800/20 rounded-xl border border-gray-700/40 overflow-hidden"
                                                >
                                                    <div className="bg-gray-800/60 px-4 py-3 flex justify-between items-center">
                                                        <h3 className="font-medium text-white">{group.date}</h3>
                                                        <span className="text-xs text-gray-400">{group.transactions.length} transaction{group.transactions.length !== 1 ? 's' : ''}</span>
                                                    </div>

                                                    <div className="divide-y divide-gray-700/40">
                                                        {group.transactions.map((tx) => {
                                                            const statusStyle = getStatusStyle(tx.status);
                                                            const typeIcon = getTypeIcon(tx.type);
                                                            const amountColor = tx.type === 'deposit' || tx.type === 'profit' ? 'text-green-400' : tx.type === 'withdrawal' || tx.type === 'payout' ? 'text-red-400' : 'text-gray-300';
                                                            const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' || tx.type === 'payout' ? '-' : '';

                                                            return (
                                                                <div
                                                                    key={tx._id}
                                                                    className="px-4 py-3 hover:bg-gray-700/20 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                                                                    onClick={() => setSelectedTx(tx)}
                                                                >
                                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                        <div className="flex-shrink-0">
                                                                            {typeIcon}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="text-sm text-white truncate">{tx.user?.name || 'N/A'}</div>
                                                                            <div className="text-xs text-gray-400 capitalize flex items-center gap-2">
                                                                                <span>{tx.type}</span>
                                                                                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                                                                                    {statusStyle.icon && React.cloneElement(statusStyle.icon, { size: 10 })}
                                                                                    {capitalizeFirstLetter(tx.status)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-shrink-0 items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                                                                        <div className="text-sm text-gray-400 text-right">
                                                                            <div>{moment(tx.createdAt).format('h:mm A')}</div>
                                                                            <div className={`text-xs ${tx.balanceType === 'real' ? 'text-blue-400' : 'text-purple-400'}`}>
                                                                                {capitalizeFirstLetter(tx.balanceType)}
                                                                            </div>
                                                                        </div>

                                                                        <div className={`text-sm font-medium ${amountColor} w-24 text-right`}>
                                                                            {amountPrefix}{tx.amount.toFixed(2)} USDT
                                                                        </div>

                                                                        <button
                                                                            className="text-sky-400 hover:text-sky-300 transition-colors"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setSelectedTx(tx);
                                                                            }}
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {totalHistoryPages > 1 && (
                                        <div className="mt-8 flex justify-center items-center space-x-4">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1 || historyLoading}
                                                className="px-3 py-1 rounded-md bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
                                            >
                                                <ChevronLeft size={16} className="mr-1" />
                                                Previous
                                            </button>

                                            <div className="hidden sm:flex items-center space-x-1">
                                                {currentPage > 2 && (
                                                    <button
                                                        onClick={() => handlePageChange(1)}
                                                        className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                                                    >
                                                        1
                                                    </button>
                                                )}

                                                {currentPage > 3 && (
                                                    <span className="px-2 text-gray-500">...</span>
                                                )}

                                                {currentPage > 1 && (
                                                    <button
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                                                    >
                                                        {currentPage - 1}
                                                    </button>
                                                )}

                                                <button
                                                    className="px-3 py-1 rounded-md bg-sky-600 text-white text-sm"
                                                >
                                                    {currentPage}
                                                </button>

                                                {currentPage < totalHistoryPages && (
                                                    <button
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                                                    >
                                                        {currentPage + 1}
                                                    </button>
                                                )}

                                                {currentPage < totalHistoryPages - 2 && (
                                                    <span className="px-2 text-gray-500">...</span>
                                                )}

                                                {currentPage < totalHistoryPages - 1 && (
                                                    <button
                                                        onClick={() => handlePageChange(totalHistoryPages)}
                                                        className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                                                    >
                                                        {totalHistoryPages}
                                                    </button>
                                                )}
                                            </div>

                                            <span className="text-sm text-gray-400">
                                                Page {currentPage} of {totalHistoryPages} ({totalHistoryItems} items)
                                            </span>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalHistoryPages || historyLoading}
                                                className="px-3 py-1 rounded-md bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
                                            >
                                                Next
                                                <ChevronRight size={16} className="ml-1" />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {viewMode === 'help' && (
                        <motion.div
                            key="help-view"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                            className={cardBaseClasses}
                        >
                            <div className="p-6 md:p-8 lg:p-10">
                                <div className="flex items-center border-b border-slate-700 pb-8 mb-10">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-100 flex items-center tracking-tight">
                                        <HelpCircle size={24} className="mr-4 text-sky-400" strokeWidth={2} />
                                        Help & Documentation
                                    </h2>
                                </div>

                                <div className="space-y-12 text-zinc-300 text-base leading-relaxed max-w-4xl mx-auto prose prose-invert prose-headings:text-sky-400 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-strong:text-zinc-100 prose-code:bg-slate-700/70 prose-code:text-teal-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-ul:marker:text-sky-500 prose-ol:marker:text-sky-500">
                                    <section>
                                        <h3 className="text-xl md:text-2xl font-semibold mb-5">Using the Payout Gateway</h3>
                                        <ol className="list-decimal list-outside space-y-5 pl-6">
                                            <li>
                                                <strong className="block mb-1">1. Select User:</strong> Choose the source account. The dropdown displays Name, Wallet Address, and Platform Balance. Ensure sufficient <code>USDT</code> is available. Use the search to filter.
                                            </li>
                                            <li>
                                                <strong className="block mb-1">2. Enter Recipient:</strong> Input the destination <code>0x...</code> address. A green checkmark indicates valid format. <strong className="text-yellow-300">Verify this address meticulously</strong>; transfers are irreversible.
                                            </li>
                                            <li>
                                                <strong className="block mb-1">3. Specify Amount:</strong> {helpTextSpecifyAmount}
                                            </li>
                                            <li>
                                                <strong className="block mb-1">4. Review Details:</strong> {helpTextReviewDetails}
                                            </li>
                                            <li>
                                                <strong className="block mb-1">5. Initiate & Confirm:</strong> {helpTextInitiatePayoutStart}<span className="italic">in your wallet</span> and approve.
                                            </li>
                                            <li>
                                                <strong className="block mb-1">6. Monitor Status:</strong> A success/failure notification will appear. Check &#39;History&#39; or block explorer for detailed status.
                                            </li>
                                        </ol>
                                    </section>

                                    <section>
                                        <h3 className="text-xl md:text-2xl font-semibold mb-5">Key Considerations</h3>
                                        <ul className="list-disc list-outside space-y-4 pl-6">
                                            <li><strong>Admin Wallet Connection:</strong> {helpTextAdminWalletConnection}</li>
                                            <li><strong>Gas Fees (ETH/Native Token):</strong> {helpTextGasFees}</li>
                                            <li><strong>Transaction Irreversibility:</strong> Once confirmed, payouts are final. <span className="text-red-400">Extreme caution is advised.</span></li>
                                            <li><strong>Contract Allowances:</strong> Assumes user approved Payout Contract to spend their USDT. Failures may occur if allowance is insufficient.</li>
                                            <li><strong>Record Keeping:</strong> {helpTextRecordKeeping}</li>
                                        </ul>
                                    </section>

                                    <section className="bg-slate-800/60 border border-yellow-600/60 rounded-xl p-6 shadow-lg not-prose">
                                        <h3 className="text-lg md:text-xl font-semibold text-yellow-300 flex items-center mb-5">
                                            <AlertTriangle size={20} className="mr-3" strokeWidth={2} />
                                            Common Issues & Troubleshooting
                                        </h3>
                                        <ul className="space-y-3.5 text-zinc-300 text-sm list-disc list-outside pl-5 marker:text-yellow-500">
                                            <li><strong className="text-zinc-100 font-medium">Transaction Reverted/Failed:</strong> {helpTextTxRevertedStart}<code>{formatAddress(CONTRACT_ADDRESS, 8, 6)}</code>. Network congestion can also cause failures.</li>
                                            <li><strong className="text-zinc-100 font-medium">User Balance Discrepancy:</strong> Platform vs. Wallet data might differ. Refresh or reload. Contact support if persistent.</li>
                                            <li><strong className="text-zinc-100 font-medium">Wallet Connection Errors:</strong> Ensure wallet is unlocked, connected, and on correct network. Try reconnecting.</li>
                                            <li><strong className="text-zinc-100 font-medium">Incorrect Amount Sent:</strong> Use standard decimal notation (e.g., <code>100.50</code>). System handles decimal conversion.</li>
                                            <li><strong className="text-zinc-100 font-medium">{helpTextSelectUserDropdownEmpty}</strong> Wait for loading. If user missing, verify account status in main admin panel.</li>
                                        </ul>
                                    </section>

                                    <footer className="text-zinc-500 text-sm pt-8 text-center border-t border-slate-700">
                                        For persistent issues or security concerns, please escalate to the designated system administrator or the core development team.
                                    </footer>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {selectedTx && (
                        <TransactionDetailsModal
                            transaction={selectedTx}
                            onClose={() => setSelectedTx(null)}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// --- Helper Sub-components for Info Display ---

const InfoRow = ({ label, value, valueClass = 'text-zinc-200', title = '' }) => (
    <div className="flex justify-between items-center py-1.5">
        <span className="text-zinc-400 text-sm">{label}:</span>
        <span className={`text-right text-sm ${valueClass}`} title={title || (typeof value === 'string' ? value : '')}>
            {value}
        </span>
    </div>
);

const WalletDisplay = ({ address, copyFn, addressClass = "text-sky-400", buttonClass = "hover:text-sky-300 hover:bg-slate-700" }) => {
    if (!address) return <span className="text-zinc-500">N/A</span>;
    return (
        <span className="flex items-center justify-end group" title={address}>
            <code className={`font-mono text-sm ${addressClass}`}>{formatAddress(address)}</code>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); copyFn(address); }}
                className={`ml-2 p-1.5 text-zinc-500 rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100 ${buttonClass}`}
                title="Copy address"
            >
                <Copy size={13} />
            </button>
        </span>
    );
};
