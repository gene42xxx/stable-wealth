'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, Edit, Trash2, Eye, CheckCircle, XCircle,
  Crown, Shield, Dot, MoreHorizontal, Calendar, Activity, Zap, Loader2
} from 'lucide-react';
import EditUserModal from './EditUserModal'; // Assuming these exist
import UserDetailsModal from './UserDetailsModal'; // Assuming these exist
import moment from 'moment';

// Helper functions (kept as is)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: '2-digit'
    });
  } catch (e) {
    return 'Invalid';
  }
};

const getRoleConfig = (role) => {
  switch (role) {
    case 'super-admin':
      return {
        text: 'Super Admin',
        icon: Crown,
        color: 'text-amber-300',
        accent: 'bg-amber-400/10 border-amber-400/30',
        glow: 'shadow-amber-400/20'
      };
    case 'admin':
      return {
        text: 'Admin',
        icon: ShieldCheck,
        color: 'text-cyan-300',
        accent: 'bg-cyan-400/10 border-cyan-400/30',
        glow: 'shadow-cyan-400/20'
      };
    default:
      return {
        text: 'User',
        icon: User,
        color: 'text-slate-300',
        accent: 'bg-slate-500/10 border-slate-500/30',
        glow: 'shadow-slate-500/10'
      };
  }
};

const getAvatarGradient = (name) => {
  if (!name) return 'from-slate-600 to-slate-700';
  const gradients = [
    'from-violet-500 to-indigo-600',
    'from-blue-400 to-cyan-500',
    'from-emerald-400 to-green-500',
    'from-orange-400 to-pink-500',
    'from-rose-400 to-purple-600',
    'from-indigo-400 to-blue-500'
  ];
  return gradients[name.charCodeAt(0) % gradients.length];
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Main Component
export default function UserCard({
  user = {
    _id: 'demo-1',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-03-15T10:30:00Z',
    subscription: { isActive: true },
    lastSeen: '2 hours ago',
    canWithdraw: true
  },
  onUserUpdate,
  onUserDelete,
  currentUserRole = 'super-admin'
}) {
  console.log(user);
  const [showActions, setShowActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [localCanWithdraw, setLocalCanWithdraw] = useState(user?.canWithdraw ?? true);
  const [isTogglingWithdraw, setIsTogglingWithdraw] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  const safeUser = {
    _id: user?._id ?? `demo-${Math.random()}`,
    name: user?.name ?? 'Unknown User',
    email: user?.email ?? 'no-email@example.com',
    role: user?.role ?? 'user',
    status: user?.status ?? 'active',
    createdAt: user?.createdAt,
    subscription: user?.subscription ?? { isActive: false },
    lastSeen: moment(user?.lastSeen).fromNow() ?? 'Never',
    canWithdraw: user?.canWithdraw ?? true
  };

  const roleConfig = getRoleConfig(safeUser.role);
  const isActive = safeUser.status === 'active';
  const hasSubscription = safeUser.subscription?.isActive;
  const isSuperAdmin = currentUserRole === 'super-admin';
  const isAdmin = currentUserRole === 'admin';
  const RoleIcon = roleConfig.icon;

  // Handle canWithdraw toggle
  const handleCanWithdrawToggle = async () => {
    if (isTogglingWithdraw) return; // Prevent multiple clicks

    const newCanWithdrawStatus = !localCanWithdraw;
    setIsTogglingWithdraw(true);
    setUpdateError(null);

    try {
      const response = await fetch(`/api/admin/users/${safeUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canWithdraw: newCanWithdrawStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to update user (${response.status})`);
      }

      // Update local state on success
      setLocalCanWithdraw(newCanWithdrawStatus);
      onUserUpdate?.({ ...safeUser, canWithdraw: newCanWithdrawStatus });
    } catch (error) {
      console.error('Failed to update canWithdraw status:', error);
      setUpdateError(error.message);
    } finally {
      setIsTogglingWithdraw(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative h-full"
      style={{ zIndex: showActions ? 50 : 'auto' }}
    >
      <div className="
        relative rounded-2xl
        bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60
        backdrop-blur-xl border border-white/[0.08]
        hover:border-white/20 hover:shadow-2xl hover:shadow-black/40
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        flex flex-col h-full
      "
        style={{ overflow: showActions ? 'visible' : 'hidden' }}
      >
        {/* Animated background subtle pattern */}
        <div className="
          absolute inset-0 z-0 opacity-10
          bg-[radial-gradient(circle,theme(colors.slate.700)_1px,transparent_1px)]
          [background-size:20px_20px]
          transition-opacity duration-700 group-hover:opacity-[0.03]
        "/>
        <div className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5
          transition-opacity duration-700 z-0
        " />

        {/* Status accent bar */}
        {/* <div className={`
          absolute left-0 top-0 bottom-0 w-[3px]
          ${isActive
            ? 'bg-gradient-to-b from-emerald-400 to-green-500'
            : 'bg-gradient-to-b from-slate-500 to-slate-600'
          }
          shadow-lg ${isActive ? 'shadow-emerald-400/50' : 'shadow-slate-500/30'}
        `} /> */}

        <div className="p-4 h-full flex flex-col relative z-10">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Enhanced Avatar with requested style */}
              <div className="relative flex-shrink-0">
                <div className={`
                  w-12 h-12 rounded-full bg-gradient-to-tr ${getAvatarGradient(safeUser.name)}
                  flex items-center justify-center text-white font-bold text-base
                  shadow-xl ring-1 ring-white/20 transition-all duration-300
                  group-hover:scale-110 group-hover:shadow-2xl
                  relative overflow-hidden
                `}>
                  {/* Shimmer effect */}
                  <div className="
                    absolute inset-0 -translate-x-full group-hover:translate-x-full
                    bg-gradient-to-r from-transparent via-white/20 to-transparent
                    transition-transform duration-1000 ease-out
                  " />
                  <span className="relative z-10">{getInitials(safeUser.name)}</span>
                </div>

                {/* Status indicator with glow */}
                <div className={`
                  absolute -bottom-1 -right-1 w-3 h-3 rounded-full
                  border-2 border-slate-900 transition-all duration-300
                  ${isActive
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                    : 'bg-slate-500 shadow-lg shadow-slate-500/30'
                  }
                `} />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white text-sm leading-tight truncate max-w-[180px]"
                    title={safeUser.name}>
                    {safeUser.name}
                  </h3>

                  {/* Minimal role indicator */}
                  <div className={`
                    inline-flex items-center gap-1 px-1 py-0.3 rounded-full text-[.6rem] font-medium
                    ${roleConfig.accent} ${roleConfig.color} backdrop-blur-sm
                    border ${roleConfig.accent.includes('border-') ? '' : 'border-white/10'} transition-all duration-300
                    hover:${roleConfig.glow} hover:scale-105 flex-shrink-0
                  `}>
                    <RoleIcon size={10} className="flex-shrink-0" />
                    <span>{roleConfig.text}</span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs truncate max-w-[200px] mb-1"
                  title={safeUser.email}>
                  {safeUser.email}
                </p>

                {/* Metadata row */}
                <div className="flex items-center border-t pt-5 border-gray-600/30 gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Joined {formatDate(safeUser.createdAt)}</span>
                  </span>

                  <div className="w-0.5 h-0.5 rounded-full bg-slate-600" />

                  <span className="flex items-center gap-1">
                    <Activity size={14} className="text-slate-400" />
                    <span>Active {safeUser.lastSeen}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowActions(!showActions)}
                className="
                  w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/80
                  backdrop-blur-sm border border-white/10 hover:border-white/20
                  flex items-center justify-center text-slate-400 hover:text-white
                  transition-all duration-300 opacity-70 group-hover:opacity-100
                  hover:shadow-lg hover:shadow-black/20
                "
              >
                <MoreHorizontal size={14} />
              </motion.button>

              {/* Enhanced Modern Dropdown */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="
                      absolute right-0 top-full mt-3 w-48 py-1.5 rounded-2xl
                      bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-950/95
                      backdrop-blur-2xl border border-white/15
                      shadow-2xl shadow-black/60 z-[100]
                      ring-1 ring-white/5
                    "
                  >
                    {/* Subtle glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="relative z-10 space-y-0.5 p-1">
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setIsEditModalOpen(true);
                          setShowActions(false);
                        }}
                        className="
                          group relative w-full px-3 py-3 text-left text-sm text-slate-300 
                          hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/5
                          flex items-center gap-3 transition-all duration-300 rounded-xl
                          hover:shadow-lg hover:shadow-blue-500/10
                        "
                      >
                        <div className="
                          w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center
                          transition-all duration-300 group-hover:bg-blue-500/20
                          group-hover:shadow-lg group-hover:shadow-blue-500/20
                        ">
                          <Edit size={14} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Edit User</span>
                          <span className="text-xs text-slate-500">Modify user details</span>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        </div>
                      </motion.button>

                      {isSuperAdmin && (
                        <>
                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              setIsViewModalOpen(true);
                              setShowActions(false);
                            }}
                            className="
                              group relative w-full px-3 py-3 text-left text-sm text-slate-300 
                              hover:text-white hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-green-500/5
                              flex items-center gap-3 transition-all duration-300 rounded-xl
                              hover:shadow-lg hover:shadow-emerald-500/10
                            "
                          >
                            <div className="
                              w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center
                              transition-all duration-300 group-hover:bg-emerald-500/20
                              group-hover:shadow-lg group-hover:shadow-emerald-500/20
                            ">
                              <Eye size={14} className="text-emerald-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">View Details</span>
                              <span className="text-xs text-slate-500">See full information</span>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            </div>
                          </motion.button>

                          {/* Elegant Separator */}
                          <div className="relative my-2 mx-3">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                            <div className="relative flex justify-center">
                              <div className="w-2 h-2 rounded-full bg-slate-700 border border-white/10" />
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => {
                              onUserDelete?.(safeUser._id);
                              setShowActions(false);
                            }}
                            className="
                              group relative w-full px-3 py-3 text-left text-sm text-red-400 
                              hover:text-red-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-pink-500/5
                              flex items-center gap-3 transition-all duration-300 rounded-xl
                              hover:shadow-lg hover:shadow-red-500/10
                            "
                          >
                            <div className="
                              w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center
                              transition-all duration-300 group-hover:bg-red-500/20
                              group-hover:shadow-lg group-hover:shadow-red-500/20
                            ">
                              <Trash2 size={14} className="text-red-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">Delete User</span>
                              <span className="text-xs text-slate-500">Remove permanently</span>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            </div>
                          </motion.button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Row - Status & Controls */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-white/5">
            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              {/* Subscription Status */}
              <div className="flex items-center gap-1.5">
                <div className={`
                  w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300
                  ${hasSubscription
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-400/20'
                    : 'bg-slate-500/20 text-slate-400'
                  }
                `}>
                  {hasSubscription ? <Zap size={12} /> : <XCircle size={12} />}
                </div>
                <div className="text-xs">
                  <div className={`font-medium ${hasSubscription ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {hasSubscription ? 'Active ' : 'No '}
                  </div>
                  <div className="text-slate-500">Subscription</div>
                </div>
              </div>
            </div>

            {/* Withdrawal Toggle - Enhanced with Loading */}
            {(isSuperAdmin || isAdmin) && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="text-right font-bold text-[0.67rem]">
                    <div className={`font-medium ${localCanWithdraw ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {localCanWithdraw ? 'Enabled' : 'Disabled'}
                    </div>
                    <div className="text-slate-400">Withdrawals</div>
                  </div>

                  <button
                    onClick={handleCanWithdrawToggle}
                    disabled={isTogglingWithdraw}
                    className={`
                      relative inline-flex h-6 w-10 items-center rounded-full
                      transition-all duration-300 ease-out border-2 border-transparent
                      ${localCanWithdraw
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-400/30 hover:shadow-emerald-400/50'
                        : 'bg-slate-600 hover:bg-slate-500'
                      }
                      ${!isTogglingWithdraw ? 'hover:scale-105' : 'opacity-75 cursor-not-allowed'}
                      focus:outline-none focus:ring-2 focus:ring-white/20
                    `}
                  >
                    {/* Toggle Ball */}
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white
                        transition-all duration-300 ease-out shadow-lg
                        flex items-center justify-center
                        ${localCanWithdraw ? 'translate-x-4' : 'translate-x-1'}
                      `}
                    >
                      {/* Loading Spinner */}
                      {isTogglingWithdraw && (
                        <Loader2
                          size={10}
                          className="text-slate-600 animate-spin"
                        />
                      )}
                    </span>
                  </button>
                </div>

                {/* Error Message */}
                {updateError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 max-w-[120px] text-right"
                  >
                    Update failed
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subtle border glow on hover */}
        <div className="
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
          bg-gradient-to-r from-transparent via-white/5 to-transparent
          transition-opacity duration-500 pointer-events-none
        " />
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditUserModal
          user={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUserUpdate={onUserUpdate}
        />
      )}

      {isViewModalOpen && (
        <UserDetailsModal
          user={user}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </motion.div>
  );
}