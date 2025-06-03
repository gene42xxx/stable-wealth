'use client';

import React, { useState } from 'react';
import { Lock, Loader2, Eye, EyeOff, User, Bell, ShieldCheck, CheckCircle } from 'lucide-react'; // Added CheckCircle
// Removed toast import
import { motion } from 'framer-motion'; // Import motion

// Enhanced Password Input Component
const PasswordInput = ({ id, value, onChange, placeholder, autoComplete }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full px-4 py-3 pr-12 bg-gray-800/60 border border-gray-700/80 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/80 transition-all duration-300 shadow-sm focus:shadow-md focus:bg-gray-800" // Enhanced styling
      />
      <motion.button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-blue-400 transition-colors duration-200"
        aria-label={showPassword ? "Hide password" : "Show password"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </motion.button>
    </div>
  );
};

// Main Settings Page Component
export default function InvestorSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Added success message state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setSuccessMessage(''); // Clear previous success message

    // Client-side validation (remains the same)
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      // toast.error('New passwords do not match.'); // Removed toast
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      // toast.error('New password must be at least 8 characters long.'); // Removed toast
      return;
    }
    if (!currentPassword) {
        setError('Please enter your current password.');
        // toast.error('Please enter your current password.'); // Removed toast
        return;
    }

    setIsLoading(true);
    // const toastId = toast.loading('Updating password...'); // Removed toast loading

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);

      // toast.success('Password updated successfully!', { id: toastId }); // Removed toast success
      setSuccessMessage('Password updated successfully!'); // Set success message
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(''); // Clear error on success
    } catch (err) {
      console.error("Password change failed:", err);
      const errorMessage = err.message || 'Failed to update password. Please try again.';
      setError(errorMessage);
      // toast.error(errorMessage, { id: toastId }); // Removed toast error
    } finally {
      setIsLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 80, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 text-gray-200 p-6 md:p-10 pt-[6rem]"> {/* Adjusted background and padding */}
      {/* Enhanced Animated background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-70">
        <div className="absolute -top-60 -right-60 w-[30rem] h-[30rem] bg-gradient-radial from-blue-600/15 via-transparent to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 -left-52 w-[30rem] h-[30rem] bg-gradient-radial from-purple-600/15 via-transparent to-transparent rounded-full blur-3xl animation-delay-2000 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-[25rem] h-[25rem] bg-gradient-radial from-cyan-600/15 via-transparent to-transparent rounded-full blur-3xl animation-delay-4000 animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-2xl md:text-3xl font-normal mb-10 md:mb-12 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent" // Refined gradient
      >
        Account Settings
      </motion.h1>

      {/* Main Content Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Security Settings Section - Enhanced Card */}
        <motion.div
          className="lg:col-span-2"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 p-6 sm:p-8 rounded-2xl border border-gray-700/60 shadow-2xl backdrop-blur-lg transition-shadow hover:shadow-blue-500/10"> {/* Enhanced card style */}
            <h2 className="text-2xl font-semibold mb-7 flex items-center text-gray-100">
              <ShieldCheck size={24} className="mr-3 text-blue-400" /> {/* Changed Icon */}
              Security Settings

            </h2>

            <form onSubmit={handleSubmit} className="space-y-6"> {/* Increased spacing */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-400 mb-2">
                  Current Password
                </label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••" // Use dots for placeholder
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-400 mb-2">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 bg-red-900/40 px-4 py-2.5 rounded-lg border border-red-700/60 flex items-center"
                >
                  <Lock size={16} className="mr-2" /> {error}
                 </motion.p>
              )}

              {successMessage && ( // Display success message inline
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-400 bg-green-900/40 px-4 py-2.5 rounded-lg border border-green-700/60 flex items-center"
                >
                   <CheckCircle size={16} className="mr-2"/> {successMessage}
                </motion.p>
              )}

              <div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center px-6 py-3 mt-4 rounded-lg text-white font-semibold transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 ${isLoading
                      ? 'bg-gray-600/70 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-blue-500/30'
                    }`}
                  whileHover={{ scale: 1.03, y: -2 }} // Subtle hover effect
                  whileTap={{ scale: 0.98 }} // Subtle tap effect
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Placeholder Section - Enhanced Card */}
        <motion.div
          className="lg:col-span-1"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 p-6 sm:p-8 rounded-2xl border border-gray-700/60 shadow-2xl backdrop-blur-lg h-full flex flex-col transition-shadow hover:shadow-purple-500/10"> {/* Enhanced card style */}
            <h2 className="text-2xl font-semibold mb-5 flex items-center text-gray-100">
              <User size={22} className="mr-3 text-purple-400" />
              Profile
            </h2>
            <p className="text-gray-400 text-sm mb-6 flex-grow">
              Manage your personal information and preferences here. This section is currently under development.
            </p>
            <div className="mt-auto pt-4 border-t border-gray-700/50">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-200">
                <Bell size={18} className="mr-2 text-yellow-400" />
                Notifications
              </h3>
              <p className="text-gray-400 text-sm">
                Notification settings coming soon.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div> {/* <-- Added missing closing tag for the main content grid motion.div */}

      {/* Add custom animation styles if needed */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
