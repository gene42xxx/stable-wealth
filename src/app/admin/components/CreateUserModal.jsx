'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2, ease: 'easeIn' } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  // No need for session here anymore as referral determines the referrer
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', status: 'active', adminReferralCode: '', userReferralCode: '' }); // Added userReferralCode
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const loadingToastId = toast.loading('Creating user...');

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
        setError('Name, Email, and Password are required.');
        setIsSubmitting(false);
        toast.error('Name, Email, and Password are required.', { id: loadingToastId });
        return;
    }
    if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setIsSubmitting(false);
        toast.error('Password must be at least 8 characters long.', { id: loadingToastId });
        return;
    }
    // Referral code validation based on role
    if (formData.role === 'admin' && !formData.adminReferralCode) {
        setError('Admin Referral Code is required when creating an Admin user.');
        setIsSubmitting(false);
        toast.error('Admin Referral Code is required.', { id: loadingToastId });
        return;
    }
    if (formData.role === 'user' && !formData.userReferralCode) {
        setError('User Referral Code is required when creating a User.');
        setIsSubmitting(false);
        toast.error('User Referral Code is required.', { id: loadingToastId });
        toast.error('Password must be at least 8 characters long.', { id: loadingToastId });
        return;
    }


    try {
      let requestBody = { ...formData };

      // Clean up request body based on role
      if (formData.role === 'user') {
        delete requestBody.adminReferralCode; // Remove admin code if role is user
        // userReferralCode is already in requestBody
      } else if (formData.role === 'admin') {
        delete requestBody.userReferralCode; // Remove user code if role is admin
        // adminReferralCode is already in requestBody
      } else { // super-admin
        delete requestBody.adminReferralCode;
        delete requestBody.userReferralCode;
      }

      const response = await fetch(`/api/admin/users`, { // Use POST to the base route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), // Send all form data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to create user (${response.status})`);
      }

      toast.success('User created successfully!', { id: loadingToastId });
      onUserCreated(); // Callback to refresh user list in parent
      onClose(); // Close modal on success

    } catch (err) {
      console.log("Error creating user:", err);
      setError(err.message);
      toast.error(`Creation failed: ${err.message}`, { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop-create"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            key="modal-create"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-lg bg-gradient-to-br from-gray-850 via-gray-900 to-gray-850 border border-purple-700/20 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_30px rgba(0,0,0,0.2)] overflow-hidden z-50 backdrop-blur-[2px]"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-600/20 bg-gradient-to-r from-purple-900/30 to-indigo-900/20">
              <h3 className="text-lg font-semibold text-purple-200/90 tracking-tight">Create New User</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-all rounded-full p-1 hover:bg-white/10 hover:rotate-90"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Error Display */}
              {error && (
                <div className="flex items-center p-3 bg-red-900/40 border border-red-700/60 rounded-lg text-red-300 text-sm">
                  <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name Input */}
              <div>
                <label htmlFor="create-name" className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  id="create-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 transition-all hover:border-purple-500/50 focus:border-purple-500/70"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="create-email" className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  id="create-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 transition-all hover:border-purple-500/50 focus:border-purple-500/70"
                  placeholder="Enter email address"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <label htmlFor="create-password" className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="create-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 transition-all hover:border-purple-500/50 focus:border-purple-500/70"
                  placeholder="Enter password (min 8 chars)"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Role Select */}
              <div>
                <label htmlFor="create-role" className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
                <select
                  id="create-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all hover:border-purple-500/50 focus:border-purple-500/70 appearance-none bg-no-repeat bg-right pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.7rem center', backgroundSize: '1.2em 1.2em' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>

              {/* User Referral Code Input (Conditional) */}
              {formData.role === 'user' && (
                <div>
                  <label htmlFor="create-userReferralCode" className="block text-xs font-medium text-gray-400 mb-1.5">User Referral Code</label>
                  <input
                    type="text"
                    id="create-userReferralCode"
                    name="userReferralCode"
                    value={formData.userReferralCode}
                    onChange={handleChange}
                    className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 transition-all hover:border-purple-500/50 focus:border-purple-500/70"
                    placeholder="Enter referral code for new user"
                    required={formData.role === 'user'} // Required only if role is user
                  />
                </div>
              )}

              {/* Admin Referral Code Input (Conditional) */}
              {formData.role === 'admin' && (
                <div>
                  <label htmlFor="create-adminReferralCode" className="block text-xs font-medium text-gray-400 mb-1.5">Admin Referral Code</label>
                  <input
                    type="text"
                    id="create-adminReferralCode"
                    name="adminReferralCode"
                    value={formData.adminReferralCode}
                    onChange={handleChange}
                    className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 transition-all hover:border-purple-500/50 focus:border-purple-500/70"
                    placeholder="Enter referral code for new admin"
                    required={formData.role === 'admin'} // Required only if role is admin
                  />
                </div>
              )}

              {/* Status Select */}
              <div>
                <label htmlFor="create-status" className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <select
                  id="create-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition appearance-none bg-no-repeat bg-right pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.7rem center', backgroundSize: '1.2em 1.2em' }}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end items-center pt-4 space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Create User
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateUserModal;
