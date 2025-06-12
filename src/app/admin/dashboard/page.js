'use client';

import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useSession } from 'next-auth/react';
import useSWR, { mutate as globalMutate } from 'swr'; // Add globalMutate
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; // Import toast
import Link from 'next/link';
import {
  Loader2,
  ShieldAlert,
  Settings,
  ShieldCheck,
  Users,
  BarChart2,
  AlertCircle,
  DollarSign,
  Zap,
  PlusCircle,
  FileText,
  Shield,
  Clock,
  ArrowRight,
  CreditCard,
  Share2,
  Activity,
  Eye, // Added Eye icon for View All
  ArrowRightLeft, // Added ArrowRightLeft for verification summary
  Wallet // Added Wallet icon
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ActivityItem from '../components/ActivityItem';
import UserCard from '../components/UserCard';
import CreateUserModal from '../components/CreateUserModal'; // Import CreateUserModal
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'; // Import the confirm modal
import { motion } from 'framer-motion';
import moment from 'moment'; // Import moment
import { useLastSeen } from '@/hooks/useLastSeen';
import { useReadContract } from 'wagmi'; // Import useReadContract
import { formatUnits } from 'viem'; // Import formatUnits
import { formatUSDTBalance } from '@/lib/utils/formatUsdtBalance';

// Helper to extract details, potentially adding target user info
const formatDetails = (activity) => {
  let details = activity.details || '';
  // Example: Append target user if relevant and not already in details
  if (activity.targetUser?.name && !details.toLowerCase().includes(activity.targetUser.name.toLowerCase())) {
    details = details ? `${details} (Target: ${activity.targetUser.name})` : `Target: ${activity.targetUser.name}`;
  }
  return details;
};

// Complete LUXE_ABI including getTotalUserBalances
const LUXE_ABI = [
  {
    name: 'processDirectDeposit',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'txHash', type: 'bytes32' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'deposit',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getUnprocessedDeposits',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getBalanceOf',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'DirectDeposit',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'txHash', type: 'bytes32', indexed: true }
    ]
  },
   {
      "inputs": [],
      "name": "getTotalUserBalances",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "getContractBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "getContractStatus",
      "outputs": [
        {
          "internalType": "address",
          "name": "currentAdmin",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isPaused",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "totalUsers",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalDeposits",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "availableLiquidity",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export default function AdminDashboardPage() {
  useLastSeen();
  const { data: session, status } = useSession();
  // Fetch activities - adjust API route if needed



  const hasRunVerification = useRef(false); // Create a ref

  const { data: activitiesData, error: activitiesError } = useSWR(
    status === 'authenticated' ? `/api/admin/activity` : null,
    (url) => fetch(url).then((res) => res.json())
  );
  const activities = activitiesData?.activities || []; // Use all activities for now, will slice later

  // Fetch dashboard stats
  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR(
    status === 'authenticated' ? `/api/admin/dashboard-stat` : null,
    (url) => fetch(url).then((res) => res.json())
  );

  // Fetch unprocessed deposits from Luxe contract
  const { data: unprocessedDeposits, isLoading: unprocessedDepositsLoading, error: unprocessedDepositsError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LUXE_ABI,
    functionName: 'getUnprocessedDeposits',
    watch: true, // Watch for changes
    enabled: status === 'authenticated', // Only fetch if authenticated
  });

  // Fetch total user balances from Luxe contract
  const { data: totalUserBalances, isLoading: totalUserBalancesLoading, error: totalUserBalancesError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LUXE_ABI,
    functionName: 'getTotalUserBalances',
    watch: true, // Watch for changes
    enabled: status === 'authenticated', // Only fetch if authenticated
  });

  // Fetch contract balance for Super Admins
  const { data: contractBalance, isLoading: contractBalanceLoading, error: contractBalanceError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LUXE_ABI,
    functionName: 'getContractBalance',
    watch: true,
    enabled: status === 'authenticated' && session?.user?.role === 'super-admin',
  });

  // Fetch contract status for Super Admins
  const { data: contractStatus, isLoading: contractStatusLoading, error: contractStatusError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LUXE_ABI,
    functionName: 'getContractStatus',
    watch: true,
    enabled: status === 'authenticated' && session?.user?.role === 'super-admin',
  });

  // Fetch user data and get mutate function for refresh (for user management section)
  const { data: usersData, error: usersError, mutate: mutateUsers } = useSWR(
    session?.user?.id ? `/api/admin/users` : null, // Only fetch if session exists
    (url) => fetch(url).then((res) => res.json())
  );
  const users = usersData?.users || [];

  // Function to refresh user data
  const handleUserUpdate = () => {
    mutateUsers(); // Re-fetch users from the API
  };

  // Prepare for deletion: find user, set state, open confirm modal
  const handleUserDelete = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setUserToDelete(user);
      setIsConfirmModalOpen(true);
    } else {
      toast.error("Could not find user to delete.");
    }
  };

  // Execute the deletion after confirmation
  const executeDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    const loadingToastId = toast.loading('Deleting user...');

    try {
      const response = await fetch(`/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete user (${response.status})`);
      }

      toast.success('User deleted successfully!', { id: loadingToastId });
      setIsConfirmModalOpen(false); // Close modal on success
      setUserToDelete(null); // Clear user to delete
      mutateUsers(); // Trigger revalidation
      // Also revalidate dashboard stats as user count might change
      globalMutate('/api/admin/dashboard-stat');

    } catch (err) {
        console.error("Error deleting user:", err);
        toast.error(`Delete failed: ${err.message}`, { id: loadingToastId });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const router = useRouter();
  const [lastLoginTime, setLastLoginTime] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for create modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for delete modal
  const [userToDelete, setUserToDelete] = useState(null); // State to hold user info for deletion confirmation
  const [isDeletingUser, setIsDeletingUser] = useState(false); // State for delete loading indicator
  const [isVerifying, setIsVerifying] = useState(false); // State for verification loading
  const [verificationStatus, setVerificationStatus] = useState(''); // State for verification status message
  const [detailedVerificationResults, setDetailedVerificationResults] = useState(null); // New state for detailed results


  useEffect(() => {
    // Set the locale string only on the client after mount
    setLastLoginTime(new Date().toLocaleString());
  }, []); // Empty dependency array ensures this runs only once on mount

  React.useEffect(() => {
    // Redirect if not loading and not authenticated, or if authenticated but not an admin
    if (status !== 'loading') {
      if (!session) {
        router.push('/auth/signin?callbackUrl=/admin/dashboard'); // Redirect to signin if not logged in
      } else if (!['admin', 'super-admin'].includes(session.user?.role)) { // Check for both roles
        router.push('/dashboard'); // Redirect to regular dashboard if not admin/super-admin
      }
    }
  }, [session, status, router]);

  // Background Transaction Verification
  const runVerification = async () => {
    if (isVerifying) return; // Prevent multiple simultaneous runs
    setIsVerifying(true);
    setVerificationStatus('Checking pending transactions...');
    console.log("Admin Dashboard: Running background verification...");
    let checkCompletedSuccessfully = false; // Flag to track if try block finished
    try {
      const response = await fetch('/api/investor/wallet/verify-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Verify all types by default for admin dashboard
        body: JSON.stringify({ types: ['deposit', 'withdrawal', 'approval', 'payout', 'tokenApprovalLog'] }),
      });

      // Log status regardless of ok/not ok
      console.log(`Admin Dashboard: Verification API response status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log("Admin Dashboard: Verification result:", result.results);
        // Simple status update for now
        const { transactions, approvals, payouts, tokenApprovalLogs } = result.results;
        setDetailedVerificationResults(result.results); // Store detailed results
        const completed = (transactions?.completed || 0) + (approvals?.completed || 0) + (payouts?.completed || 0) + (tokenApprovalLogs?.completed || 0);
        const failed = (transactions?.failed || 0) + (approvals?.failed || 0) + (payouts?.failed || 0) + (tokenApprovalLogs?.failed || 0);
        let statusMsg = `Verification ran.`;
        if (completed > 0 || failed > 0) {
          statusMsg += ` Status: ${completed} completed, ${failed} failed.`;
        }
        setVerificationStatus(statusMsg);
        toast.success('Background verification ran.', { duration: 2000 });
        checkCompletedSuccessfully = true;

        globalMutate('/api/admin/payout-gateway?action=history');
        console.log("Admin Dashboard: Triggered revalidation for payout history.");
      } else {
        const responseText = await response.text();
        console.error(`Admin Dashboard: Error verifying transactions. Status: ${response.status}, StatusText: ${response.statusText}. Response:`, responseText);
        setVerificationStatus(`Verification failed. Status: ${response.status}.`);
        setDetailedVerificationResults(null); // Clear detailed results on failure
      }
    } catch (error) {
        console.error("Admin Dashboard: Background verification error encountered (network or JSON parsing):", error);
        setVerificationStatus('Verification error. Check console.');
        setDetailedVerificationResults(null); // Clear detailed results on error
    } finally {
      setIsVerifying(false);
      if (!checkCompletedSuccessfully) {
         setVerificationStatus('Verification check finished.');
      }
      setTimeout(() => setVerificationStatus(''), 5000);
    }
  };

  useEffect(() => {
    // Run verification on mount if user is admin/super-admin
    // Use ref to ensure it only runs once on initial mount (even in Strict Mode)
    if (session && ['admin', 'super-admin'].includes(session.user?.role) && !hasRunVerification.current) {
      runVerification();
      hasRunVerification.current = true; // Mark as run
      // Optional: Set up an interval or re-run on window focus
      // const intervalId = setInterval(runVerification, 60000); // e.g., every 60 seconds
      // return () => clearInterval(intervalId);
    }
  }, [session]); // Run when session data is available





  // Loading state while checking session and role
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Verifying access...</span>
      </div>
    );
  }

  // If authenticated and is an admin/super-admin, show the admin dashboard
  if (session && ['admin', 'super-admin'].includes(session.user?.role)) {
    const isSuperAdmin = session.user?.role === 'super-admin'; // Check for super-admin role

    // Prepare stats for display
    const dashboardStats = [
      { title: 'Total Users', value: statsData?.totalUsers?.toLocaleString() || '0', icon: <Users size={20} className="text-gray-300" />, change: '+5%', changeType: 'positive' },
      { title: 'Active Subscriptions', value: statsData?.activeSubscriptions?.toLocaleString() || '0', icon: <CreditCard size={20} className="text-gray-300" />, change: '+2%', changeType: 'positive' },
      { title: 'New Users (30D)', value: statsData?.newUsersLast30Days?.toLocaleString() || '0', icon: <Activity size={20} className="text-gray-300" />, change: '+10%', changeType: 'positive' },
      { title: 'Total Admins', value: statsData?.totalAdmins?.toLocaleString() || '0', icon: <ShieldCheck size={20} className="text-gray-300" />, change: 'N/A', changeType: 'neutral' },
      { title: 'Total Super Admins', value: statsData?.totalSuperAdmins?.toLocaleString() || '0', icon: <ShieldAlert size={20} className="text-gray-300" />, change: 'N/A', changeType: 'neutral' },
      // Only show these stats for Super Admins
      ...(isSuperAdmin ? [
        {
          title: 'Unprocessed Deposits',
          value: unprocessedDeposits !== undefined ? formatUSDTBalance(unprocessedDeposits) + ' USDT' : unprocessedDepositsLoading ? 'Loading...' : 'N/A',
          icon: <Clock size={20} className="text-yellow-400" />,
          change: unprocessedDepositsError ? 'Error' : '',
          changeType: unprocessedDepositsError ? 'negative' : 'neutral',
        },
         {
          title: 'Total User Balances (Contract)',
          value: totalUserBalances !== undefined ? `${formatUSDTBalance(totalUserBalances)} USDT` : totalUserBalancesLoading ? 'Loading...' : 'N/A',
          icon: <Wallet size={20} className="text-green-400" />,
          change: totalUserBalancesError ? 'Error' : '',
          changeType: totalUserBalancesError ? 'negative' : 'positive', // Assuming total balance is generally positive
        },
        {
          title: 'Contract Balance',
          value: contractBalance !== undefined ? `${formatUSDTBalance(contractBalance)} USDT` : contractBalanceLoading ? 'Loading...' : 'N/A',
          icon: <DollarSign size={20} className="text-yellow-400" />,
          change: contractBalanceError ? 'Error' : '',
          changeType: contractBalanceError ? 'negative' : 'neutral',
        },
        {
          title: 'Contract Status',
          value: contractStatus !== undefined ? (contractStatus.isPaused ? 'Paused' : 'Active') : contractStatusLoading ? 'Loading...' : 'N/A',
          icon: contractStatus?.isPaused ? <AlertCircle size={20} className="text-red-400" /> : <ShieldCheck size={20} className="text-green-400" />,
          change: contractStatusError ? 'Error' : '',
          changeType: contractStatusError ? 'negative' : (contractStatus?.isPaused ? 'negative' : 'positive'),
        },
      ] : []),
    ];

    // Limit activities for dashboard display
    const recentActivities = activities.slice(0, 5);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 md:p-8">
        <div className="container mx-auto pt-[2.5rem] md:pt-[5rem]">
          {/* Dashboard Header */}
          <div className="mb-16 animate-fade-in ">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-lg text-gray-300 mt-2">
                  Welcome, <span className="font-medium text-white">{session.user?.email || 'User'}</span>
                </p>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.user?.role === 'super-admin'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50'
                    : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50'
                    }`}>
                    {session.user?.role === 'super-admin' ? 'Super Admin' : 'Admin'}
                  </span>
                  {/* Render lastLoginTime only if it's set (i.e., on client) */}
                  {lastLoginTime && (
                    <span className="ml-2 text-xs text-gray-400">Last login: {lastLoginTime}</span>
                  )}
                  {/* Verification Status Indicator */}
                  {verificationStatus && (
                    <div className={`flex items-center text-xs mt-1 ${isVerifying ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {isVerifying && <Loader2 size={12} className="animate-spin mr-1.5" />}
                      {verificationStatus}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href='/admin/dashboard/settings'>
                  <motion.button
                    className="px-4 py-2 rounded-lg bg-gray-800/70 hover:bg-gray-700/60 border border-gray-700/30 transition-all text-sm flex items-center hover:-translate-y-0.5"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </motion.button>
                </Link>
                <motion.button
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all text-sm flex items-center shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_15px_rgba(0,0,0,0.25)] hover:-translate-y-0.5"
                  onClick={() => router.push('/dashboard')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  User Dashboard
                </motion.button>
              </div>
            </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
              {/* Stats Overview */}
              <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {statsLoading || unprocessedDepositsLoading || totalUserBalancesLoading || contractBalanceLoading || contractStatusLoading ? (
                  <div className="md:col-span-4 flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <span className="ml-3 text-gray-400">Loading stats...</span>
                  </div>
                ) : statsError || unprocessedDepositsError || totalUserBalancesError || contractBalanceError || contractStatusError ? (
                  <div className="md:col-span-4 text-red-400 p-4 bg-red-900/30 rounded-lg border border-red-700/50">Failed to load dashboard stats.</div>
                ) : (
                  dashboardStats.map((stat, index) => (
                    <StatCard
                      key={index}
                      icon={stat.icon}
                      title={stat.title}
                      value={stat.value}
                      change={stat.change}
                      changePositive={stat.changeType === 'positive'}
                      gradient={stat.changeType === 'positive' ? 'from-indigo-600/80 to-indigo-700/80' : stat.changeType === 'negative' ? 'from-red-600/80 to-red-700/80' : 'from-amber-600/80 to-amber-700/80'}
                    />
                  ))
                )}
              </div>

              {/* Background Verification Summary */}
              {isSuperAdmin && detailedVerificationResults && (
                <div className="lg:col-span-4 bg-gradient-to-b from-gray-800/50 to-gray-900/60 backdrop-blur-[2px] border border-gray-700/30 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_20px_rgba(0,0,0,0.2)] p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700/50 flex items-center">
                    <ShieldCheck size={18} className="mr-2 text-teal-400" />
                    Background Verification Summary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(detailedVerificationResults).map(([key, value]) => {
                      if (typeof value === 'object' && value !== null && 'checked' in value) {
                        const titleMap = {
                          transactions: 'Transactions',
                          approvals: 'Token Approvals',
                          payouts: 'Payouts',
                          tokenApprovalLogs: 'Transfer Logs',
                        };
                        const iconMap = {
                          transactions: <ArrowRightLeft size={16} className="text-blue-400" />,
                          approvals: <ShieldCheck size={16} className="text-green-400" />,
                          payouts: <DollarSign size={16} className="text-purple-400" />,
                          tokenApprovalLogs: <FileText size={16} className="text-orange-400" />,
                        };

                        return (
                          <div key={key} className="bg-gray-900/50 border border-gray-700/40 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-gray-300 font-medium">
                              {iconMap[key]}
                              <span className="capitalize">{titleMap[key] || key}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Completed:</span>
                              <span className="text-green-400 font-semibold">{value.completed}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Failed:</span>
                              <span className="text-red-400 font-semibold">{value.failed}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Pending</span>
                              <span className="text-yellow-400 font-semibold">{value.notFoundOrStillPending + value.errors}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {/* User Management Section - Replaced Table with Cards */}
              <div className="lg:col-span-3 space-y-4"> {/* Added space-y-4 */}
                <div className="flex justify-between items-center"> {/* Container for title and button */}
                  <h2 className="text-xl font-semibold text-white">User Management</h2>
                  {/* Conditionally render View All only if there are users */}
                  {users.length > 0 && (
                     <Link href="/admin/users" className="flex items-center text-sm text-indigo-300 hover:text-indigo-200 transition-colors group">
                        View All
                        <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                     </Link>
                  )}
                </div>
                {usersError ? (
                  <div className="text-red-400 p-4 bg-red-900/30 rounded-lg border border-red-700/50">Failed to load users.</div>
                ) : !usersData ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                  </div>
                ) : users.length > 0 ? (
                  // Display only the first 3 users
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {users.slice(0, 3).map((user) => (
                      <div key={user._id} >
                        <UserCard
                          user={user}
                          onUserUpdate={handleUserUpdate}
                          onUserDelete={handleUserDelete}
                          currentUserRole={session?.user?.role}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">No users found.</div>
                )}
              </div>

              {/* Quick Actions & Activity Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Quick Actions Card */}
                <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/60 backdrop-blur-[2px] border border-gray-700/30 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_20px_rgba(0,0,0,0.2)] p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700/50 flex items-center">
                    <Zap size={18} className="mr-2 text-yellow-400" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {/* Conditionally render Create User button for super-admin */}
                    {isSuperAdmin ? (
                      <motion.button
                        onClick={() => setIsCreateModalOpen(true)} // Open modal on click
                        className="w-full flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-700/50 rounded-lg border border-gray-700/30 transition-all group hover:-translate-y-0.5"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Create New User (Super Admin Only)"
                      >
                        <span className="flex items-center">
                          <PlusCircle size={16} className="mr-3 text-indigo-400" />
                          Create New User
                        </span>
                        <ArrowRight size={16} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                      </motion.button>
                    ) : null}
                    {/* Other buttons remain */}
                    <button className="w-full flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-all group">
                      <span className="flex items-center">
                        <FileText size={16} className="mr-3 text-blue-400" />
                        Generate Reports
                      </span>
                      <ArrowRight size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-gray-800/40 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-all group">
                      <span className="flex items-center">
                        <Shield size={16} className="mr-3 text-green-400" />
                        Security Audit
                      </span>
                      <ArrowRight size={16} className="text-gray-500 group-hover:text-green-400 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-gray-700/50 flex items-center">
                    <Clock size={18} className="mr-2 text-purple-400" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3"> {/* Changed spacing */}
                    {activitiesError ? (
                      <div className="text-center text-red-400 text-sm">Failed to load activity.</div>
                    ) : !activitiesData ? (
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                      </div>
                    ) : recentActivities.length > 0 ? ( // Use recentActivities here
                      recentActivities.map(activity => (
                        <ActivityItem
                          key={activity._id}
                          // Removed avatar prop
                          name={activity.user?.name || 'System/Unknown User'}
                          action={activity.action} // Pass raw action type
                          details={formatDetails(activity)} // Pass formatted details string
                          time={moment(activity.createdAt).fromNow()} // Use moment.js
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-400 text-sm py-4">
                        No recent activities found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/* Render CreateUserModal */}
        {isCreateModalOpen && (
          <CreateUserModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onUserCreated={() => {
              setIsCreateModalOpen(false); // Close modal first
              mutateUsers(); // Use mutateUsers instead of fetchUsers to refresh the user list
            }}
          />
        )}

        {/* Render ConfirmDeleteModal */}
        {isConfirmModalOpen && userToDelete && (
          <ConfirmDeleteModal
            isOpen={isConfirmModalOpen}
            onClose={() => {
              if (!isDeletingUser) { // Prevent closing while delete is in progress
                setIsConfirmModalOpen(false);
                setUserToDelete(null);
              }
            }}
            onConfirm={executeDeleteUser}
            userName={userToDelete.name || userToDelete.email} // Display name or email
            isDeleting={isDeletingUser}
          />
        )}
      </div> // Closing tag for the main container div
    );
  }

  // Fallback/Unauthorized access view (if redirection hasn't happened or user isn't admin/super-admin)
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
