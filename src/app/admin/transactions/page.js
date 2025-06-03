'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Loader2,
  ShieldAlert,
  Filter,
  Download,
  DollarSign,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
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
  ChevronDown,
  Users, // Added for user info
  Mail // Added for user info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import useSWR from 'swr';
import { debounce } from 'lodash';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import TransactionAnalytics from '@/components/TransactionAnalytics';

// Helper to get status color and icon (same as investor page)
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

// Helper to get transaction type icon (same as investor page)
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

// Skeleton loader for transaction cards (adapted for admin view)
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

// Transaction Details Modal (adapted for admin view)
const TransactionDetailsModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const statusStyle = getStatusStyle(transaction.status);
  const typeIcon = getTypeIcon(transaction.type);
  const amountColor = transaction.type === 'deposit' || transaction.type === 'profit' ? 'text-green-400' : transaction.type === 'withdrawal' ? 'text-red-400' : 'text-gray-300';
  const amountPrefix = transaction.type === 'deposit' || transaction.type === 'profit' ? '+' : transaction.type === 'withdrawal' ? '-' : '';

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
            <div className="flex items-center gap-3 pb-3 border-b border-gray-700/50">
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
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </div>
            </div>

            <div className="flex justify-between py-2">
              <div className="text-gray-400">Date & Time</div>
              <div className="text-white">{moment(transaction.createdAt).format('MMM D, YYYY h:mm A')}</div>
            </div>

            <div className="flex justify-between py-2">
              <div className="text-gray-400">Balance Type</div>
              <div className={transaction.balanceType === 'real' ? 'text-blue-400' : 'text-purple-400'}>
                {transaction.balanceType.charAt(0).toUpperCase() + transaction.balanceType.slice(1)}
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

// Analytics Dashboard Component (same as investor page, data comes from API)


// Date Range Picker Component (same as investor page)
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

// Export Transactions Button (same as investor page)
const ExportTransactions = ({ transactions, isLoading }) => {
  const handleExport = () => {
    if (!transactions || transactions.length === 0) return;

    // Format transaction data for CSV
    const headers = ['User Name', 'User Email', 'Type', 'Amount', 'Currency', 'Status', 'Balance Type', 'Created At', 'Description', 'Transaction Hash'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => [
        `"${tx.user?.name || 'N/A'}"`,
        `"${tx.user?.email || 'N/A'}"`,
        tx.type,
        tx.amount,
        tx.currency,
        tx.status,
        tx.balanceType,
        moment(tx.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        `"${tx.description || ''}"`,
        tx.txHash || ''
      ].join(','))
    ].join('\n');

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `admin_transactions_${moment().format('YYYY-MM-DD')}.csv`);
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

// Group transactions by date (same as investor page)
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

export default function AdminTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for API features
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '9', 10)); // Default to 9 for grid
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState('');
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
    if (filterStatus) params.set('status', filterStatus);
    if (sort) params.set('sort', sort);
    if (startDate) params.set('startDate', startDate.toISOString().split('T')[0]); // Send YYYY-MM-DD
    if (endDate) params.set('endDate', endDate.toISOString().split('T')[0]); // Send YYYY-MM-DD
    return params.toString();
  }, [currentPage, limit, searchTerm, filterType, filterStatus, sort, startDate, endDate]);

  const queryString = buildQueryString();
  const apiUrl = session?.user?.id ? `/api/admin/transactions?${queryString}` : null;

  const { data: transactionsData, error: transactionsError, mutate: mutateTransactions, isLoading: isLoadingSWR } = useSWR(
    apiUrl,
    fetcher,
    { keepPreviousData: true }
  );

  const transactions = transactionsData?.transactions || [];
  const totalItems = transactionsData?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);
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
    // Trigger SWR refetch by changing the query string
    mutateTransactions();
  };

  const handleDateFilterClear = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    // Trigger SWR refetch
    mutateTransactions();
  };

  // Adjust limit based on view
  useEffect(() => {
    if (view === 'list' || view === 'grouped') {
      setLimit(20); // Show more items in list/grouped view
    } else {
      setLimit(9); // Default for grid/analytics
    }
    setCurrentPage(1); // Reset page when view changes
  }, [view]);

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

  if (!session || !['admin', 'super-admin'].includes(session.user?.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8 pt-24">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
        <p className="text-gray-400 text-center">You do not have permission to view this page.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors"
        >
          Go to Dashboard
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
                Admin Transaction History
              </motion.h1>
              <p className="text-lg text-gray-300">
                {session.user.role === 'super-admin' ? 'Overview of all user transactions.' : 'Overview of transactions for users you manage.'}
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
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} hidden sm:flex`}
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
                  placeholder="Search user, type, status..."
                  value={searchInputValue}
                  onChange={handleSearchInputChange}
                  className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-800/60 border border-gray-700/50 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm text-gray-200 placeholder-gray-500"
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
                  {/* Add other sort options if needed, e.g., by user name */}
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
            <div className={`grid grid-cols-1 ${view === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-5`}>
              {Array(limit).fill(0).map((_, index) => (
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
                const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' ? '-' : '';

                return (
                  <motion.div
                    key={tx._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-gray-800/50 via-gray-850/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/40 rounded-xl shadow-lg p-4 flex flex-col space-y-3 hover:border-gray-600/60 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    {/* Card Header: User Info & Type */}
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
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.balanceType === 'real' ? 'bg-blue-500/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'}`}>
                          {tx.balanceType.charAt(0).toUpperCase() + tx.balanceType.slice(1)} Balance
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
          ) : view === 'list' ? (
            // List View
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
                  {transactions.map((tx) => {
                    const statusStyle = getStatusStyle(tx.status);
                    const typeIcon = getTypeIcon(tx.type);
                    const amountColor = tx.type === 'deposit' || tx.type === 'profit' ? 'text-green-400' : tx.type === 'withdrawal' ? 'text-red-400' : 'text-gray-300';
                    const amountPrefix = tx.type === 'deposit' || tx.type === 'profit' ? '+' : tx.type === 'withdrawal' ? '-' : '';

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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.balanceType === 'real' ? 'bg-blue-500/10 text-blue-300' : 'bg-purple-500/10 text-purple-300'}`}>
                            {tx.balanceType.charAt(0).toUpperCase() + tx.balanceType.slice(1)}
                          </span>
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
                          {/* Left Side: User & Type/Status */}
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
                                   {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                 </span>
                               </div>
                             </div>
                          </div>

                          {/* Right Side: Date/Balance & Amount */}
                          <div className="flex flex-shrink-0 items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                            <div className="text-sm text-gray-400 text-right">
                              <div>{moment(tx.createdAt).format('h:mm A')}</div>
                              <div className={`text-xs ${tx.balanceType === 'real' ? 'text-blue-400' : 'text-purple-400'}`}>
                                {tx.balanceType.charAt(0).toUpperCase() + tx.balanceType.slice(1)}
                              </div>
                            </div>

                            <div className={`text-sm font-medium ${amountColor} w-24 text-right`}>
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
                Page {currentPage} of {totalPages} ({totalItems} items)
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
