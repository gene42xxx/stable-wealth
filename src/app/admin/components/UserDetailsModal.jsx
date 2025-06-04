'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Wallet, TrendingUp, Bot, Calendar, Shield, Mail, Crown, Zap, Clock } from 'lucide-react';

// Mock user data for demonstration
const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  name: "John Doe",
  email: "john.doe@example.com",
  status: "active",
  role: "admin",
  walletAddress: "0x742d35Cc6Db86e12345678901234567890abcdef",
  createdAt: "2024-01-15T10:30:00Z",
  subscriptionStartDate: "2024-01-20T09:00:00Z",
  fakeProfits: 1250.75,
  createdUsers: [1, 2, 3, 4, 5],
  botActive: true,
  lastBalanceCheck: "2025-05-29T15:45:00Z",
  canWithdraw: true, // Added canWithdraw to mock data
  referredByAdmin: {
    name: "Admin Smith",
    email: "admin@example.com"
  },
  userWalletUsdtBalance: 125.00 // Added for mock data consistency
};

export default function UserDetailsModal({ isOpen = true, onClose = () => { }, user = mockUser, currentUserRole, onUserUpdate }) {
  const [mounted, setMounted] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [localCanWithdraw, setLocalCanWithdraw] = useState(user?.canWithdraw ?? true); // State for canWithdraw toggle

  // Update localCanWithdraw when user prop changes
  useEffect(() => {
    setLocalCanWithdraw(user?.canWithdraw ?? true);
  }, [user?.canWithdraw]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = setTimeout(() => setContentVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setContentVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'text-green-400', bg: 'bg-green-400/10', dot: 'bg-green-400' },
      inactive: { color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400' },
      pending: { color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400' }
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} border border-white/5`}>
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`text-sm ${config.color} capitalize`}>{status || 'Pending'}</span>
      </div>
    );
  };

  const isSuperAdmin = currentUserRole === 'super-admin';
  const isAdmin = currentUserRole === 'admin';

  // Handle canWithdraw toggle
  const handleCanWithdrawToggle = async () => {
    console.log('UserDetailsModal: handleCanWithdrawToggle called');
    const newCanWithdrawStatus = !localCanWithdraw;
    setLocalCanWithdraw(newCanWithdrawStatus); // Optimistic update
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canWithdraw: newCanWithdrawStatus }),
      });
      console.log('UserDetailsModal: Fetch request sent.');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(result.message || `Failed to update user (${response.status})`);
      }
      toast.success('Withdrawal status updated successfully!');
      console.log('UserDetailsModal: Withdrawal status updated successfully.');
      onUserUpdate?.({ ...user, canWithdraw: newCanWithdrawStatus }); // Inform parent
    } catch (error) {
      console.error('UserDetailsModal: Failed to update canWithdraw status:', error);
      setLocalCanWithdraw(!newCanWithdrawStatus); // Revert on error
      toast.error(`Update failed: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'financial', label: 'Financial', icon: TrendingUp },
    { id: 'system', label: 'System', icon: Bot }
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
      }`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>

      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-4xl mx-auto transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>

        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className={`p-6 border-b border-white/5 transition-opacity duration-300 ${contentVisible ? 'opacity-100' : 'opacity-0'
            }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                    <User size={24} className="text-white/70" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-medium text-white mb-1">{user.name}</h1>
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                  {getStatusBadge(user.status)}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6 p-1 bg-white/5 rounded-lg border border-white/5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all ${activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className={`p-6 max-h-96 overflow-y-auto transition-opacity duration-300 delay-100 ${contentVisible ? 'opacity-100' : 'opacity-0'
            }`}>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Role Card */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield size={18} className="text-blue-400" />
                      <h3 className="text-white font-medium">Role & Permissions</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Role</div>
                        <div className="flex items-center gap-2">
                          <Crown size={14} className="text-amber-400" />
                          <span className="text-white capitalize">{user.role}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">User ID</div>
                        <div className="font-mono text-sm text-gray-300 bg-white/5 rounded-lg p-2 border border-white/5 break-all">
                          {user._id}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar size={18} className="text-purple-400" />
                      <h3 className="text-white font-medium">Timeline</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Member Since</div>
                        <div className="text-gray-300 text-sm">{formatDate(user.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Subscription Start</div>
                        <div className="text-gray-300 text-sm">{formatDate(user.subscriptionStartDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referral Info */}
                {user.referredByAdmin && (
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <User size={16} className="text-blue-400" />
                      <h3 className="text-white font-medium">Referral Information</h3>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Referred by <span className="text-blue-400">{user.referredByAdmin.name}</span>
                      <span className="text-gray-400 ml-2">({user.referredByAdmin.email})</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
              <div className="space-y-6">

                {/* USDT Wallet Balance */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Wallet size={20} className="text-green-400" />
                    <h3 className="text-white font-medium">USDT Wallet Balance</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className=" text-lg rounded-lg bg-green-500/10 p-4  tracking-wide font-semibold text-white">
                      ${user.userWalletUsdtBalance?.toFixed(2) ?? '0.00'}
                      <span className="text-gray-500 text-sm"> USDT</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Profits */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp size={18} className="text-amber-400" />
                      <h3 className="text-white font-medium">Simulated Profits</h3>
                    </div>
                    <div className="text-2xl font-mono text-amber-400 font-semibold">
                      ${user.fakeProfits?.toFixed(2) ?? '0.00'}
                    </div>
                  </div>

                  {/* Managed Users */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <User size={18} className="text-blue-400" />
                      <h3 className="text-white font-medium">Managed Users</h3>
                    </div>
                    <div className="text-2xl font-semibold text-blue-400">
                      {user.createdUsers?.length ?? 0}
                    </div>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Wallet Address</div>
                  <div className="font-mono text-sm text-gray-300 bg-white/5 rounded-lg p-3 border border-white/5 break-all">
                    {user.walletAddress || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Bot Status */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Bot size={18} className={user.botActive ? 'text-green-400' : 'text-red-400'} />
                      <h3 className="text-white font-medium">Bot Status</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${user.botActive ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className={`font-medium ${user.botActive ? 'text-green-400' : 'text-red-400'}`}>
                        {user.botActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock size={18} className="text-purple-400" />
                      <h3 className="text-white font-medium">Last Activity</h3>
                    </div>
                    <div className="text-gray-300 text-sm">
                      {formatDate(user.lastBalanceCheck)}
                    </div>
                  </div>

                  {/* Can Withdraw Toggle */}
                  {(isSuperAdmin || isAdmin) && (
                    <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap size={18} className={localCanWithdraw ? 'text-emerald-400' : 'text-slate-400'} />
                        <h3 className="text-white font-medium">Withdrawal Status</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">Allow Withdrawals</span>
                        <button
                          type="button"
                          onClick={handleCanWithdrawToggle}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
                            ${localCanWithdraw ? 'bg-emerald-500' : 'bg-slate-600'}
                          `}
                          title={localCanWithdraw ? 'Withdrawal Enabled' : 'Withdrawal Disabled'}
                        >
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
                              ${localCanWithdraw ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
