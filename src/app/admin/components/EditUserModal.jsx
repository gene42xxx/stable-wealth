'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

const EditUserModal = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [formData, setFormData] = useState({ name: '', email: '', role: '', status: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Populate form when user data is available and modal opens
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user', // Default role if missing
        status: user.status || 'active', // Default status if missing
      });
      setError(null); // Reset error on open
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) return; // Ensure user ID exists

    setIsSubmitting(true);
    setError(null);
    const loadingToastId = toast.loading('Updating user...');

    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          status: formData.status,
          // Do not allow email editing for now
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to update user (${response.status})`);
      }

      toast.success('User updated successfully!', { id: loadingToastId });
      onUserUpdate({ ...user, ...formData }); // Pass updated data back to parent
      onClose(); // Close modal on success

    } catch (err) {
      console.log("Error updating user:", err);
      setError(err.message);
      toast.error(`Update failed: ${err.message}`, { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent rendering if not open
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={onClose} // Close on backdrop click
        >
            <motion.div
              key="modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg bg-gradient-to-br from-gray-850 via-gray-900 to-gray-850 border border-indigo-700/20 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_30px rgba(0,0,0,0.2)] overflow-hidden z-50 backdrop-blur-[2px]"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-600/20 bg-gradient-to-r from-indigo-900/30 to-purple-900/20">
              <h3 className="text-lg font-semibold text-indigo-200/90 tracking-tight">Edit User Details</h3>
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
                <label htmlFor="name" className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500 transition-all hover:border-indigo-500/50 focus:border-indigo-500/70"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2.5 text-sm text-gray-400/80 cursor-not-allowed"
                  title="Email cannot be changed"
                />
              </div>

              {/* Role Select */}
              <div>
                <label htmlFor="role" className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:border-indigo-500/50 focus:border-indigo-500/70 appearance-none bg-no-repeat bg-right pr-8"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.7rem center', backgroundSize: '1.2em 1.2em' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super Admin</option>
                </select>
              </div>

              {/* Status Select */}
              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition appearance-none bg-no-repeat bg-right pr-8"
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
                  className="px-5 py-2 whitespace-nowrap rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    <Save size={16} className="mr-2" />
                  )}
                  Save Changes
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditUserModal;
