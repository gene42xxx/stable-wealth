'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import {
  Loader2,
  ShieldAlert,
  Filter,
  Download,
  DollarSign,
  EyeOff,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Receipt,
  Activity,
  FileText,
  CheckCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Zap,
  Star,
  Hash,
  Copy,
  ExternalLink,
  RefreshCw,
  XCircle,
  Clock,
  AlertCircle,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  BarChart3,
  Eye,
  CircleDollarSign,
  CalendarRange,
  Info,
  FileDown,
  ClipboardList,
  ListFilter,
  Layers,
  ArrowDown,
  ArrowUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import useSWR from 'swr';
import { debounce } from 'lodash';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import TransactionAnalytics from '@/components/TransactionAnalytics';
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
      return { color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: <AlertCircle size={14} /> };
    default:
      return { color: 'text-gray-500', bgColor: 'bg-gray-600/10', icon: <AlertCircle size={14} /> };
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
    default: return <ArrowRightLeft size={16} className="text-gray-400" />;
  }
};

const fetcher = (url) => fetch(url).then((res) => res.json());

// Skeleton loader for transaction cards
const TransactionCardSkeleton = () => (
  <div className="bg-gray-800/50 rounded-xl border border-gray-700/40 shadow-lg p-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="h-4 bg-gray-700 rounded w-1/4"></div>
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


const TransactionDetailsModal = ({ transaction, onClose, isOpen = true }) => {
  const [copied, setCopied] = useState(false);
  const [showFullHash, setShowFullHash] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Mock transaction data for demo
  const mockTransaction = {
    _id: 'TX123456789',
    type: 'deposit',
    status: 'completed',
    amount: 1250.50,
    currency: 'USDC',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    createdAt: new Date().toISOString(),
    description: 'Deposit from external wallet',
    blockchainData: {
      networkFee: 0.0024,
      confirmations: 12
    }
  };

  const displayTransaction = transaction || mockTransaction;

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        icon: <CheckCircle size={16} />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-900/20',
        borderColor: 'border-emerald-400/30'
      },
      pending: {
        icon: <Clock size={16} />,
        color: 'text-amber-400',
        bgColor: 'bg-amber-900/20',
        borderColor: 'border-amber-400/30'
      },
      failed: {
        icon: <XCircle size={16} />,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-400/30'
      },
      processing: {
        icon: <RefreshCw size={16} className="animate-spin" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-400/30'
      }
    };
    return configs[status] || configs.pending;
  };

  const getTypeConfig = (type) => {
    const configs = {
      deposit: {
        icon: <ArrowDownLeft size={20} />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-900/20',
        prefix: '+'
      },
      withdrawal: {
        icon: <ArrowUpRight size={20} />,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        prefix: '-'
      },
      profit: {
        icon: <TrendingUp size={20} />,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-900/20',
        prefix: '+'
      },
      transfer: {
        icon: <RefreshCw size={20} />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        prefix: '→'
      }
    };
    return configs[type] || {
      icon: <ArrowDownLeft size={20} />,
      color: 'text-purple-300',
      bgColor: 'bg-purple-900/20',
      prefix: ''
    };
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose && onClose();
      setIsClosing(false);
    }, 150);
  };

  const handleCopyHash = async () => {
    if (displayTransaction?.txHash) {
      try {
        await navigator.clipboard.writeText(displayTransaction.txHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy hash:', err);
      }
    }
  };

  const handleExploreHash = () => {
    if (displayTransaction?.txHash) {
      window.open(`https://etherscan.io/tx/${displayTransaction.txHash}`, '_blank');
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatAmount = (amount, currency) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount) + ` ${currency || 'USD'}`;
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return showFullHash ? hash : `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const statusConfig = getStatusConfig(displayTransaction.status);
  const typeConfig = getTypeConfig(displayTransaction.type);

  return (
    <div
      className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 transition-all duration-200"
      onClick={handleClose}
    >
      <div
        className={`bg-gray-600/55 backdrop-blur-xl rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden transition-all duration-150 transform border border-purple-600/30
          ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-600/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${typeConfig.bgColor} flex items-center justify-center ${typeConfig.color} border border-purple-600/30`}>
              {typeConfig.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-purple-100">Transaction Details</h2>
              <p className="text-sm text-purple-300 capitalize">{displayTransaction.type}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-purple-800/50 rounded-lg transition-colors duration-150"
          >
            <X size={20} className="text-purple-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Amount & Status */}
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-purple-100 mb-2">
              {typeConfig.prefix}{formatAmount(displayTransaction.amount, displayTransaction.currency)}
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
              {statusConfig.icon}
              <span className="capitalize">{displayTransaction.status}</span>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="space-y-4 px-2 ">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-purple-300 mb-1">
                  <Calendar size={16} />
                  Date & Time
                </div>
                <div className="text-sm font-medium text-purple-100">
                  {formatDate(displayTransaction.createdAt)}
                </div>
              </div>
   
            </div>

            {/* Description */}
            {displayTransaction.description && (
              <div>
                <div className="text-sm text-purple-300 mb-2">Description</div>
                <div className="text-sm text-purple-100 bg-purple-800/30 rounded-lg p-3 border border-purple-600/20">
                  {displayTransaction.description}
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {displayTransaction.txHash && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex font-bold items-center gap-2 text-sm text-purple-300">
                    <Shield size={16} />
                     Transaction Hash
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowFullHash(!showFullHash)}
                      className="p-1.5 hover:bg-purple-800/50 rounded-lg transition-colors text-purple-300 hover:text-purple-100"
                      title={showFullHash ? 'Collapse' : 'Expand'}
                    >
                      {showFullHash ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={handleCopyHash}
                      className="p-1.5 hover:bg-purple-800/50 rounded-lg transition-colors text-purple-300 hover:text-purple-100"
                      title="Copy hash"
                    >
                      {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={handleExploreHash}
                      className="p-1.5 hover:bg-purple-800/50 rounded-lg transition-colors text-purple-300 hover:text-purple-100"
                      title="View on explorer"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
                <div className="bg-purple-800/30 rounded-lg p-3 font-mono text-sm text-purple-200 break-all border border-purple-600/20">
                  {truncateHash(displayTransaction.txHash)}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="grid grid-cols-2 gap-4">
              {displayTransaction.blockchainData?.networkFee && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-purple-300 mb-1">
                    <Zap size={16} />
                    Network Fee
                  </div>
                  <div className="text-sm font-medium text-purple-100">
                    {formatAmount(displayTransaction.blockchainData.networkFee, 'ETH')}
                  </div>
                </div>
              )}
              {displayTransaction.blockchainData?.confirmations && (
                <div>
                  <div className="text-sm text-purple-300 mb-1">Confirmations</div>
                  <div className="text-sm font-medium text-purple-100 font-mono">
                    {displayTransaction.blockchainData.confirmations}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-purple-600/30 bg-purple-800/30">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-purple-300 hover:text-purple-100 font-medium transition-colors duration-150"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-purple-100 font-medium rounded-lg transition-colors duration-150"
          >
            Export Receipt
          </button>
        </div>
      </div>
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
            className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm text-gray-200"
            wrapperClassName="w-full"
            popperClassName="react-datepicker-dark"
            dateFormat="MMM d, yyyy"
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
            className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm text-gray-200"
            wrapperClassName="w-full"
            popperClassName="react-datepicker-dark"
            dateFormat="MMM d, yyyy"
          />
          <Calendar size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="flex gap-1">
          <button
            onClick={onApply}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors text-sm flex-shrink-0"
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

    // Format transaction data for CSV
    const headers = ['Type', 'Amount', 'Currency', 'Status', 'Created At', 'Description', 'Transaction Hash', 'Confirmations', 'Network Fee'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.type,
        tx.amount,
        tx.currency,
        tx.status,
        moment(tx.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        `"${tx.description || ''}"`,
        tx.txHash || '',
        tx.blockchainData?.confirmations || '',
        tx.blockchainData?.networkFee || ''
      ].join(','))
    ].join('\n');

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${moment().format('YYYY-MM-DD')}.csv`);
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

  // Convert to array and sort by date (newest first)
  return Object.entries(grouped)
    .map(([date, txs]) => ({ date, transactions: txs }))
    .sort((a, b) => moment(b.date, 'MMM D, YYYY').diff(moment(a.date, 'MMM D, YYYY')));
};

export default function InvestorTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for API features
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '9', 10));
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState(searchParams.get('type') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');

  // Enhanced states
  const [selectedTx, setSelectedTx] = useState(null);
  const [view, setView] = useState('grid'); // 'grid', 'list', 'analytics', 'grouped'
  const [startDate, setStartDate] = useState(searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : null);
  const [endDate, setEndDate] = useState(searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState(searchTerm);

  // Build the query string based on state
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', limit.toString());
    if (searchTerm) params.set('search', searchTerm);
    if (filterType) params.set('type', filterType);
    if (filterStatus) params.set('status', filterStatus);
    if (sort) params.set('sort', sort);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());
    return params.toString();
  }, [currentPage, limit, searchTerm, filterType, filterStatus, sort, startDate, endDate]);

  const queryString = buildQueryString();
  const apiUrl = session?.user?.id ? `/api/investor/transactions?${queryString}` : null;

  const { data: transactionsData, error: transactionsError, mutate: mutateTransactions, isLoading: isLoadingSWR } = useSWR(
    apiUrl,
    fetcher,
    { keepPreviousData: true }
  );

  const transactions = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination || { total: 0, page: 1, limit: limit };
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const isLoadingTransactions = isLoadingSWR;

  // Grouped transactions for the grouped view
  const groupedTransactions = useMemo(() =>
    groupTransactionsByDate(transactions),
    [transactions]
  );

  // Update URL when state changes
  useEffect(() => {
    const newQueryString = buildQueryString();
    router.replace(`${pathname}?${newQueryString}`, { scroll: false });
  }, [buildQueryString, pathname, router]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset to page 1 on search
    }, 500),
    []
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInputValue(value);
    debouncedSearch(value);
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
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDateFilterApply = () => {
    setCurrentPage(1);
    // Date filtering will be handled by the buildQueryString function
  };

  const handleDateFilterClear = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  // Verify pending deposits in the background
  useEffect(() => {
    const verifyAllTransactions = async () => {
      console.log("Attempting to verify pending deposits...");
      try {
        const response = await fetch('/api/investor/wallet/verify-transactions', {
          method: 'POST',
        });
        const result = await response.json();
        if (response.ok) {
          console.log('Pending deposits verification result:', result);
          if (result?.results?.completed > 0 || result?.results?.failed > 0) {
            console.log("Verification updated some transactions, re-fetching list...");
            mutateTransactions();
          } else {
            console.log("Verification ran, but no status changes detected.");
          }
        } else {
          console.error('Error verifying pending deposits:', response.status, response.statusText, result);
        }
      } catch (error) {
        console.error('Network or parsing error verifying pending deposits:', error);
      }
    };

    verifyAllTransactions();
  }, [mutateTransactions]);

  // CSS for custom DatePicker styling
  useEffect(() => {
    // Add custom styling for the date picker to match our dark theme
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
        background-color: #4F46E5 !important;
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

  // --- Render Logic ---

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading session...</span>
      </div>
    );
  }

  if (!session || session.user?.role !== 'user') {
    return (
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8 pt-24">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
        <p className="text-gray-400 text-center">You do not have permission to view this page.</p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Main content render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 md:p-8">
      <div className="container mx-auto pt-[5rem]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-2xl md:text-3xl font-normal mb-6 md:mb-8 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                Transaction History
              </motion.h1>
              <p className="text-lg text-gray-300">
                Overview of your transactions and financial activity.
              </p>
            </div>

            {/* View Controls */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <ExportTransactions
                transactions={transactions}
                isLoading={isLoadingTransactions}
              />

              <div className="flex rounded-md overflow-hidden border border-gray-700/50">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${view === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  <ClipboardList size={16} />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setView('grouped')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${view === 'grouped' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  <Layers size={16} />
                  <span className="hidden sm:inline">Grouped</span>
                </button>
                <button
                  onClick={() => setView('analytics')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${view === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  <BarChart3 size={16} />
                  <span className="hidden sm:inline">Analytics</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter, Sort, Search Controls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Search Input */}
              <div className="relative">
                <label htmlFor="search" className="block text-xs font-medium text-gray-400 mb-1">Search</label>
                <input
                  type="search"
                  id="search"
                  name="search"
                  placeholder="Search type, status, desc..."
                  value={searchInputValue}
                  onChange={handleSearchInputChange}
                  className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm text-gray-200 placeholder-gray-500"
                />
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-0.5 mt-2 text-gray-500 pointer-events-none" />
              </div>

              {/* Filter by Type */}
              <div>
                <label htmlFor="type" className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                <select
                  id="type"
                  name="type"
                  value={filterType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm text-gray-200"
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="profit">Profit</option>
                  <option value="fee">Fee</option>
                  <option value="subscription">Subscription</option>
                </select>
              </div>

              {/* Filter by Status */}
              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filterStatus}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm text-gray-200"
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
                  className="w-full px-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm text-gray-200"
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
                className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
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
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          {isLoadingTransactions && !transactionsData ? (
            // Skeleton Loader Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(6).fill(0).map((_, index) => (
                <TransactionCardSkeleton key={index} />
              ))}
            </div>
          ) : transactionsError ? (
            <div className="text-center py-10 text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 p-4">
              <AlertCircle size={24} className="mx-auto mb-2" />
              <h3 className="font-medium mb-1">Error Loading Transactions</h3>
              <p className="text-sm">{transactionsError.message || 'Please try again later.'}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-800/30 rounded-lg border border-gray-700/30 p-6">
              <Info size={24} className="mx-auto mb-3" />
              <h3 className="font-medium mb-2">No Transactions Found</h3>
              <p className="text-sm max-w-md mx-auto">No transactions match your current filters. Try adjusting your search criteria or filters to see more results.</p>
            </div>
          ) : view === 'analytics' ? (
            <TransactionAnalytics transactions={transactions} />
          ) : view === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {transactions.map((tx) => {
                const statusStyle = getStatusStyle(tx.status);
                const typeIcon = getTypeIcon(tx.type);
                const amountColor = tx.type === 'deposit' || tx.type === 'profit' ? 'text-green-400' : tx.type === 'withdrawal' ? 'text-red-400' : 'text-gray-300';
                const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' && '';

                return (
                  <motion.div
                    key={tx._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-gray-800/50 via-gray-850/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/40 rounded-xl shadow-lg p-4 flex flex-col space-y-3 hover:border-gray-600/60 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    {/* Card Header: Type */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5 text-xs text-gray-300 capitalize">
                        {typeIcon}
                        {tx.type}
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}>
                        <Eye size={14} />
                      </button>
                    </div>

                    {/* Card Body: Amount & Status */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
                      <div className={`text-lg font-bold ${amountColor}`}>
                        {amountPrefix}{tx.amount.toFixed(2)} <span className="text-xs text-gray-500">{tx.currency}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                        {statusStyle.icon}
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </div>

                    {/* Card Footer: Date, Balance Type, Details */}
                    <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-700/30">
                      <div className="flex justify-between items-center">
                        <span>{moment(tx.createdAt).format('MMM D, YYYY h:mm A')}</span>
                      </div>
                      <div className="truncate pt-1" title={tx.description || tx.txHash || 'No details'}>
                        <span className="font-medium text-gray-300">Details:</span> {tx.description || tx.txHash || '-'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : view === 'list' ? (
            // List View
            <div className="overflow-x-auto bg-gray-800/20 rounded-xl border border-gray-700/40">
              <table className="min-w-full divide-y divide-gray-700/60">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/40">
                  {transactions.map((tx) => {
                    const statusStyle = getStatusStyle(tx.status);
                    const typeIcon = getTypeIcon(tx.type);
                    const amountColor = tx.type === 'deposit' || tx.type === 'profit' ? 'text-green-400' : tx.type === 'withdrawal' ? 'text-red-400' : 'text-gray-300';
                    const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' && '';

                    return (
                      <tr
                        key={tx._id}
                        className="hover:bg-gray-700/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedTx(tx)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {typeIcon}
                            <span className="text-sm text-gray-300 capitalize">{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm font-medium ${amountColor}`}>
                            {amountPrefix}{tx.amount.toFixed(2)} {tx.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                            {statusStyle.icon}
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {moment(tx.createdAt).format('MMM D, YYYY h:mm A')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                          {tx.description || tx.txHash || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <button
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
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
            // Grouped View
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
                      const amountColor = tx.type === 'deposit' || tx.type === 'profit' ? 'text-green-400' : tx.type === 'withdrawal' ? 'text-red-400' : 'text-gray-300';
                      const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' ? '-' : '';

                      return (
                        <div
                          key={tx._id}
                          className="px-4 py-3 hover:bg-gray-700/20 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              {typeIcon}
                              <span className="text-sm text-gray-300 capitalize">{tx.type}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bgColor} ${statusStyle.color}`}>
                              {statusStyle.icon}
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </span>
                          </div>

                          <div className="flex flex-1 items-center justify-between md:justify-end gap-4">
                            <div className="text-sm text-gray-400">
                              {moment(tx.createdAt).format('h:mm A')}
                              <span className="mx-2 text-gray-600">•</span>
                            </div>

                            <div className={`text-sm font-medium ${amountColor}`}>
                              {amountPrefix}{tx.amount.toFixed(2)} {tx.currency}
                            </div>

                            <button
                              className="text-indigo-400 hover:text-indigo-300 transition-colors"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingTransactions}
                className="px-3 py-1 rounded-md bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>

              <div className="hidden sm:flex items-center space-x-1">
                {/* First Page Button */}
                {currentPage > 2 && (
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    1
                  </button>
                )}

                {/* Ellipsis if needed */}
                {currentPage > 3 && (
                  <span className="px-2 text-gray-500">...</span>
                )}

                {/* Page Before Current (if applicable) */}
                {currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    {currentPage - 1}
                  </button>
                )}

                {/* Current Page */}
                <button
                  className="px-3 py-1 rounded-md bg-indigo-600 text-white text-sm"
                >
                  {currentPage}
                </button>

                {/* Page After Current (if applicable) */}
                {currentPage < totalPages && (
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    {currentPage + 1}
                  </button>
                )}

                {/* Ellipsis if needed */}
                {currentPage < totalPages - 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}

                {/* Last Page Button */}
                {currentPage < totalPages - 1 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-3 py-1 rounded-md bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm"
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <span className="text-sm text-gray-400">
                Page {pagination.page} of {totalPages} ({pagination.total} items)
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingTransactions}
                className="px-3 py-1 rounded-md bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Transaction Details Modal */}
        <AnimatePresence>
          {selectedTx && (
            <TransactionDetailsModal
              transaction={selectedTx}
              onClose={() => setSelectedTx(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
