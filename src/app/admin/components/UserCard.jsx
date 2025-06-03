'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, ShieldCheck, Edit, Trash2, Eye, CheckCircle, XCircle,
  Crown, Shield, Dot, MoreHorizontal, Calendar, Activity
} from 'lucide-react';
import EditUserModal from './EditUserModal';
import UserDetailsModal from './UserDetailsModal'; // Import UserDetailsModal

// Helper functions
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
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
      };
    case 'admin':
      return {
        text: 'Admin',
        icon: ShieldCheck,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
      };
    default:
      return {
        text: 'User',
        icon: User,
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/20'
      };
  }
};

const getAvatarColor = (name) => {
  if (!name) return 'from-slate-500 to-slate-600';
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600'
  ];
  return colors[name.charCodeAt(0) % colors.length];
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
    lastSeen: '2 hours ago'
  },
  onUserUpdate,
  onUserDelete,
  currentUserRole = 'super-admin'
}) {
  const [showActions, setShowActions] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // New state for view modal
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
    lastSeen: user?.lastSeen ?? 'Never'
  };

  const roleConfig = getRoleConfig(safeUser.role);
  const isActive = safeUser.status === 'active';
  const hasSubscription = safeUser.subscription?.isActive;
  const isSuperAdmin = currentUserRole === 'super-admin';
  const RoleIcon = roleConfig.icon;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative"
      style={{ zIndex: showActions ? 50 : 'auto' }} // Dynamically increase z-index when dropdown is open
    >
      <div className="
        relative p-5 rounded-xl bg-white/5 backdrop-blur-sm
        border border-white/10 hover:border-white/20
        transition-all duration-300 ease-out
        hover:bg-white/[0.08] hover:shadow-lg hover:shadow-black/20
        hover:transform hover:scale-[1.01]
        h-20 flex items-center
      ">
        {/* Status indicator line */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-1 rounded-l-xl
          ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}
          transition-colors duration-300
        `} />

        <div className="flex items-center gap-4 w-full">
          {/* Avatar - Fixed size */}
          <div className="relative flex-shrink-0">
            <div className={`
              w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(safeUser.name)}
              flex items-center justify-center text-white text-sm font-semibold
              shadow-lg ring-2 ring-white/10 transition-transform duration-200
              group-hover:scale-105
            `}>
              {getInitials(safeUser.name)}
            </div>

            {/* Online status dot */}
            <div className={`
              absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full
              border-2 border-slate-900 transition-colors duration-300
              ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}
            `} />
          </div>

          {/* User Info - Controlled width */}
          <div className="flex-1 min-w-0 max-w-[45%]">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white text-sm truncate max-w-[140px]" title={safeUser.name}>
                {safeUser.name}
              </h3>

              {/* Role badge - Fixed size */}
              <div className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
                ${roleConfig.bg} ${roleConfig.border} ${roleConfig.color} border flex-shrink-0
                min-w-[60px] justify-center
              `}>
                <RoleIcon size={10} />
                <span className="hidden sm:inline text-[10px]">{roleConfig.text}</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs truncate mb-1 max-w-[200px]" title={safeUser.email}>
              {safeUser.email}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 flex-shrink-0">
                <Calendar size={10} />
                <span className="text-[10px]">{formatDate(safeUser.createdAt)}</span>
              </span>

              <Dot size={8} className="text-slate-600 flex-shrink-0" />

              <span className="flex items-center gap-1 truncate">
                <Activity size={10} className="flex-shrink-0" />
                <span className="text-[10px] truncate">{safeUser.lastSeen}</span>
              </span>
            </div>
          </div>

          {/* Status indicators - Fixed width */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-[72px] justify-end">
            {/* Subscription status */}
            <div className={`
              w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
              ${hasSubscription ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}
            `} title={hasSubscription ? 'Premium' : 'Free'}>
              {hasSubscription ? <CheckCircle size={12} /> : <XCircle size={12} />}
            </div>

            {/* Actions menu */}
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowActions(!showActions)}
                className="
                  w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50
                  flex items-center justify-center text-slate-400 hover:text-white
                  transition-colors duration-200 opacity-0 group-hover:opacity-100
                "
              >
                <MoreHorizontal size={14} />
              </motion.button>

              {/* Actions dropdown - Fixed positioning */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="
                      absolute right-0 top-full mt-1 w-32 py-1 rounded-lg
                      bg-slate-800/95 backdrop-blur-sm border border-white/10
                      shadow-xl z-[100]
                    "
                    style={{ zIndex: 100 }} // Explicit z-index for the dropdown
                  >
                    <button
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setShowActions(false);
                      }}
                      className="
                        w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white
                        hover:bg-white/10 flex items-center gap-2 transition-colors duration-150
                      "
                    >
                      <Edit size={12} />
                      Edit
                    </button>

                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setIsViewModalOpen(true); // Open the view modal
                            setShowActions(false);
                          }}
                          className="
                            w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white
                            hover:bg-white/10 flex items-center gap-2 transition-colors duration-150
                          "
                        >
                          <Eye size={12} />
                          View
                        </button>

                        <hr className="my-1 border-white/10" />

                        <button
                          onClick={() => {
                            onUserDelete?.(safeUser._id);
                            setShowActions(false);
                          }}
                          className="
                            w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300
                            hover:bg-red-500/10 flex items-center gap-2 transition-colors duration-150
                          "
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className="
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
          bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5
          transition-opacity duration-300 pointer-events-none
        " />
      </div>

      {/* Mock Edit Modal */}
      {isEditModalOpen && (
        <EditUserModal
          user={user}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUserUpdate={onUserUpdate}
        />
      )}

      {/* User Details Modal */}
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
