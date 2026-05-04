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
    'from-blue-600 to-indigo-600',
    'from-purple-600 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-600 to-purple-700'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
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
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
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
        relative rounded-2xl h-full
        bg-slate-900/40 backdrop-blur-xl
        border border-white/5 hover:border-white/20
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        group-hover:-translate-y-1 flex flex-col
      "
        style={{ overflow: showActions ? 'visible' : 'hidden' }}
      >
        {/* Modern Perimeter Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-700 pointer-events-none" />
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,1) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />

        <div className="p-4 h-full flex flex-col relative z-10">
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Enhanced Avatar with requested style */}
              <div className="relative flex-shrink-0 group/avatar">
                <div className={`
                  w-14 h-14 rounded-full bg-gradient-to-tr ${getAvatarGradient(safeUser.name)}
                  flex items-center justify-center text-white font-bold text-lg
                  shadow-xl ring-2 ring-white/10 transition-all duration-500
                  group-hover/avatar:scale-105 group-hover/avatar:ring-white/30
                  relative overflow-hidden
                `}>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                  <span className="relative z-10">{getInitials(safeUser.name)}</span>
                </div>

                <div className={`
                  absolute bottom-0 right-0 w-4 h-4 rounded-full
                  border-[3px] border-slate-900 transition-all duration-300
                  ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}
                  ${isActive ? 'shadow-[0_0_10px_rgba(16,185,129,0.6)]' : ''}
                `} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h3 className="font-bold text-white text-[15px] leading-tight truncate max-w-[150px]"
                    title={safeUser.name}>
                    {safeUser.name}
                  </h3>

                  <div className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${roleConfig.accent} ${roleConfig.color} border border-white/5
                  `}>
                    <RoleIcon size={10} strokeWidth={3} />
                    <span>{roleConfig.text}</span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs truncate max-w-full opacity-80" title={safeUser.email}>
                  {safeUser.email}
                </p>
              </div>

                <div className="flex flex-col gap-1.5 pt-3 mt-3 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Calendar size={12} className="text-blue-400/60" />
                    <span className="truncate">Member since {formatDate(safeUser.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Activity size={12} className="text-purple-400/60" />
                    <span className="truncate">Last active {safeUser.lastSeen}</span>
                  </div>
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

                      {(
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

          <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/5 gap-4">
            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              <div className={`
                flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300
                ${hasSubscription ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}
              `}>
                {hasSubscription ? <Zap size={12} className="fill-current" /> : <XCircle size={12} />}
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {hasSubscription ? 'Subscription' : 'Free Tier'}
                </span>
              </div>
            </div>

            {/* Withdrawal Toggle */}
            {(isSuperAdmin || isAdmin) && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none mb-1">Payouts</p>
                  <p className={`text-[11px] font-bold leading-none ${localCanWithdraw ? 'text-blue-400' : 'text-slate-400'}`}>
                    {localCanWithdraw ? 'Active' : 'Locked'}
                  </p>
                </div>

                <button
                  onClick={handleCanWithdrawToggle}
                  disabled={isTogglingWithdraw}
                  className={`
                    relative inline-flex h-5 w-9 items-center rounded-full
                    transition-all duration-300
                    ${localCanWithdraw ? 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]' : 'bg-slate-700'}
                    ${isTogglingWithdraw ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
                  `}
                >
                  <motion.span
                    animate={{ x: localCanWithdraw ? 18 : 2 }}
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-sm"
                  >
                    {isTogglingWithdraw && <Loader2 size={8} className="text-slate-600 animate-spin" />}
                  </motion.span>
                </button>
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