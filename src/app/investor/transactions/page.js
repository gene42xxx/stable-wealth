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

// Transaction Details Modal
const TransactionDetailsModal = ({ transaction, onClose, isOpen = true }) => {
  const [copied, setCopied] = useState(false);
  const [showFullHash, setShowFullHash] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [networkFee, setNetworkFee] = useState(null);
  const publicClient = usePublicClient();

  // Enhanced status configurations with more sophisticated styling
  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        icon: <CheckCircle size={16} />,
        gradient: 'from-emerald-500/20 to-green-500/5',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        glowColor: 'shadow-emerald-500/20',
        pulseColor: 'animate-pulse-emerald'
      },
      pending: {
        icon: <Clock size={16} />,
        gradient: 'from-amber-500/20 to-yellow-500/5',
        color: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        glowColor: 'shadow-amber-500/20',
        pulseColor: 'animate-pulse-amber'
      },
      failed: {
        icon: <XCircle size={16} />,
        gradient: 'from-red-500/20 to-rose-500/5',
        color: 'text-red-400',
        borderColor: 'border-red-500/30',
        glowColor: 'shadow-red-500/20',
        pulseColor: 'animate-pulse-red'
      },
      processing: {
        icon: <RefreshCw size={16} className="animate-spin" />,
        gradient: 'from-blue-500/20 to-cyan-500/5',
        color: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        glowColor: 'shadow-blue-500/20',
        pulseColor: 'animate-pulse-blue'
      }
    };
    return configs[status] || configs.pending;
  };

  // Enhanced type configurations
  const getTypeConfig = (type) => {
    const configs = {
      deposit: {
        icon: <ArrowDownLeft size={24} />,
        color: 'text-emerald-400',
        prefix: '+',
        gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
        bgPattern: 'bg-gradient-to-br from-emerald-500/10 to-green-500/5',
        accentColor: 'border-emerald-500/30'
      },
      withdrawal: {
        icon: <ArrowUpRight size={24} />,
        color: 'text-red-400',
        prefix: '-',
        gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
        bgPattern: 'bg-gradient-to-br from-red-500/10 to-rose-500/5',
        accentColor: 'border-red-500/30'
      },
      profit: {
        icon: <TrendingUp size={24} />,
        color: 'text-emerald-400',
        prefix: '+',
        gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
        bgPattern: 'bg-gradient-to-br from-emerald-500/10 to-green-500/5',
        accentColor: 'border-emerald-500/30'
      },
      transfer: {
        icon: <RefreshCw size={24} />,
        color: 'text-blue-400',
        prefix: '→',
        gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
        bgPattern: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5',
        accentColor: 'border-blue-500/30'
      }
    };
    return configs[type] || {
      icon: <DollarSign size={24} />,
      color: 'text-slate-400',
      prefix: '',
      gradient: 'from-slate-500/20 via-gray-500/10 to-transparent',
      bgPattern: 'bg-gradient-to-br from-slate-500/10 to-gray-500/5',
      accentColor: 'border-slate-500/30'
    };
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleCopyHash = async () => {
    if (transaction?.txHash) {
      try {
        await navigator.clipboard.writeText(transaction.txHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy hash:', err);
      }
    }
  };

  const handleExploreHash = () => {
    if (transaction?.txHash) {
      window.open(`https://etherscan.io/tx/${transaction.txHash}`, '_blank');
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

  // Handle escape key
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

  if (!transaction) return null;

  const statusConfig = getStatusConfig(transaction.status);
  const typeConfig = getTypeConfig(transaction.type);

  // Fetch network fee using Wagmi
  useEffect(() => {
    const fetchNetworkFee = async () => {
      if (transaction?.txHash && publicClient) {
        try {
          const txReceipt = await publicClient.getTransactionReceipt({
            hash: transaction.txHash,
          });
          if (txReceipt) {
            const gasUsed = txReceipt.gasUsed;
            const effectiveGasPrice = txReceipt.effectiveGasPrice;
            const fee = gasUsed * effectiveGasPrice;
            setNetworkFee(parseFloat(formatEther(fee)));
          }
        } catch (error) {
          console.error('Error fetching transaction receipt:', error);
          setNetworkFee(null);
        }
      } else {
        setNetworkFee(null);
      }
    };

    if (isOpen) {
      fetchNetworkFee();
    }
  }, [transaction?.txHash, isOpen, publicClient]);

  // Use the actual transaction data, with fallbacks for display
  const displayTransaction = {
    id: transaction._id,
    type: transaction.type,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    txHash: transaction.txHash,
    createdAt: transaction.createdAt,
    description: transaction.description,
    // Use fetched networkFee, fallback to blockchainData if available
    networkFee: networkFee !== null ? networkFee : transaction.blockchainData?.networkFee,
    confirmations: transaction.blockchainData?.confirmations,
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 
            p-2 sm:p-4 md:p-6 transition-all duration-300"
          onClick={handleClose}
        >
          <div
            className={`bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 
              backdrop-blur-2xl border border-slate-600/30 rounded-2xl sm:rounded-3xl shadow-2xl 
              max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden transition-all duration-300 transform
              ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
              shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col`}
            onClick={e => e.stopPropagation()}
          >
            {/* Decorative top gradient */}
            <div className={`h-1 bg-gradient-to-r ${typeConfig.gradient}`} />

            {/* Header */}
            <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 sm:px-6 lg:px-8 
              py-4 sm:py-6 border-b border-slate-600/30 flex-shrink-0">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent)] opacity-50" />

              <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl 
                    ${typeConfig.bgPattern} flex items-center justify-center border ${typeConfig.accentColor}
                    shadow-lg ${typeConfig.color} relative overflow-hidden group flex-shrink-0`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <div className="scale-75 sm:scale-90 lg:scale-100">
                      {typeConfig.icon}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight truncate">
                      Transaction Details
                    </h3>
                    <p className="text-slate-400 capitalize font-medium mt-0.5 sm:mt-1 text-sm sm:text-base truncate">
                      {displayTransaction.type} Transaction
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-2 sm:p-3 
                    rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 
                    backdrop-blur-sm flex-shrink-0 ml-2"
                  aria-label="Close modal"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex-shrink-0">
              <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg sm:rounded-xl border border-slate-700/30">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 
                    text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2
                    ${activeTab === 'details'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <Receipt size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Details</span>
                </button>
                <button
                  onClick={() => setActiveTab('technical')}
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 
                    text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2
                    ${activeTab === 'technical'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <Activity size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Technical</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:pt-6 flex-1 overflow-y-auto">
              {/* Amount Section - Always visible */}
              <div className="mb-6 sm:mb-8">
                <div className={`relative p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border backdrop-blur-sm
                  bg-gradient-to-br ${typeConfig.gradient} ${typeConfig.accentColor}
                  shadow-xl overflow-hidden group`}>
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)]" />

                  <div className="relative text-center">
                    <div className="text-xs sm:text-sm text-slate-400 mb-2 font-medium tracking-wide uppercase">
                      Amount
                    </div>
                    <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${typeConfig.color} tracking-tight mb-2 sm:mb-3 break-all`}>
                      {typeConfig.prefix}{formatAmount(displayTransaction.amount, displayTransaction.currency)}
                    </div>
                    <div className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 
                      text-xs sm:text-sm font-medium border bg-gradient-to-r ${statusConfig.gradient} ${statusConfig.color} 
                      ${statusConfig.borderColor} shadow-lg ${statusConfig.glowColor}`}>
                      <div className="scale-90 sm:scale-100">
                        {statusConfig.icon}
                      </div>
                      <span className="truncate">
                        {displayTransaction.status.charAt(0).toUpperCase() + displayTransaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'details' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Date & Time */}
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/30">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Calendar size={16} className="text-blue-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                        <span className="text-slate-400 font-medium text-sm sm:text-base truncate">Date & Time</span>
                      </div>
                      <span className="text-white font-mono text-xs sm:text-sm leading-relaxed break-all">
                        {formatDate(displayTransaction.createdAt)}
                      </span>
                    </div>

                    {/* Transaction ID */}
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/30">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Hash size={16} className="text-purple-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                        <span className="text-slate-400 font-medium text-sm sm:text-base truncate">Transaction ID</span>
                      </div>
                      <span className="text-white font-mono text-xs sm:text-sm break-all">
                        #{displayTransaction.id}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {displayTransaction.description && (
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/30">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <Info size={16} className="text-cyan-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                        <span className="text-slate-400 font-medium text-sm sm:text-base">Description</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                        {displayTransaction.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'technical' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Transaction Hash */}
                  {displayTransaction.txHash && (
                    <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/30">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <Shield size={16} className="text-green-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                          <span className="text-slate-400 font-medium text-sm sm:text-base truncate">Transaction Hash</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setShowFullHash(!showFullHash)}
                            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs sm:text-sm 
                              font-medium transition-colors px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-blue-500/10 
                              whitespace-nowrap"
                          >
                            {showFullHash ? <EyeOff size={12} className="sm:w-[14px] sm:h-[14px]" /> : <Eye size={12} className="sm:w-[14px] sm:h-[14px]" />}
                            <span className="hidden xs:inline">{showFullHash ? 'Collapse' : 'Expand'}</span>
                          </button>
                          <button
                            onClick={handleCopyHash}
                            className="text-slate-400 hover:text-white transition-all duration-200 p-1.5 sm:p-2 
                              rounded-lg hover:bg-slate-700/50 hover:scale-105 active:scale-95"
                            title="Copy hash"
                          >
                            {copied ? <CheckCircle size={14} className="text-green-400 sm:w-4 sm:h-4" /> : <Copy size={14} className="sm:w-4 sm:h-4" />}
                          </button>
                          <button
                            onClick={handleExploreHash}
                            className="text-slate-400 hover:text-white transition-all duration-200 p-1.5 sm:p-2 
                              rounded-lg hover:bg-slate-700/50 hover:scale-105 active:scale-95"
                            title="View on explorer"
                          >
                            <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-700/50 
                        backdrop-blur-sm font-mono text-xs sm:text-sm overflow-hidden">
                        <code className="text-slate-300 break-all leading-relaxed block">
                          {truncateHash(displayTransaction.txHash)}
                        </code>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Network Fee */}
                    {displayTransaction.networkFee !== undefined && displayTransaction.networkFee !== null && (
                      <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/30">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <Zap size={16} className="text-yellow-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                          <span className="text-slate-400 font-medium text-sm sm:text-base truncate">Network Fee</span>
                        </div>
                        <span className="text-white font-semibold text-sm sm:text-base break-all">
                          {formatAmount(displayTransaction.networkFee, displayTransaction.currency)}
                        </span>
                      </div>
                    )}

                    {/* Confirmations */}
                    {displayTransaction.confirmations !== undefined && displayTransaction.confirmations !== null && (
                      <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/30">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <Star size={16} className="text-orange-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                          <span className="text-slate-400 font-medium text-sm sm:text-base truncate">Confirmations</span>
                        </div>
                        <span className="text-white font-mono font-semibold text-sm sm:text-base">
                          {displayTransaction.confirmations}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm 
              px-8 py-6 border-t border-slate-600/30">
              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600 
                    hover:from-slate-600 hover:to-slate-500 rounded-xl text-white font-medium 
                    transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg 
                    hover:shadow-xl border border-slate-500/30"
                >
                  <Download size={18} />
                  Export Receipt
                </button>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 
                    hover:to-blue-400 rounded-xl text-white font-semibold transition-all duration-200 
                    hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/25"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
