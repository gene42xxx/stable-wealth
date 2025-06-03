'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

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

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, userName, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop-confirm-delete"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" // Increased z-index
          onClick={onClose}
        >
          <motion.div
            key="modal-confirm-delete"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md bg-gradient-to-br from-gray-850 via-gray-900 to-gray-850 border border-red-700/40 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_30px rgba(0,0,0,0.3)] overflow-hidden z-50 backdrop-blur-[2px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-600/20 bg-gradient-to-r from-red-900/40 to-gray-900/30">
              <h3 className="text-lg font-semibold text-red-300/90 tracking-tight flex items-center">
                <AlertTriangle size={20} className="mr-2 text-red-500" />
                Confirm Deletion
              </h3>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="text-gray-400 hover:text-white transition-all rounded-full p-1 hover:bg-white/10 hover:rotate-90 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              <p className="text-gray-300 mb-2">
                Are you sure you want to permanently delete the user:
              </p>
              <p className="font-semibold text-white mb-5 break-words">
                {userName || 'this user'}?
              </p>
              <p className="text-sm text-red-400">
                This action cannot be undone.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end items-center p-4 space-x-3 bg-gray-900/30 border-t border-red-600/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
                whileHover={{ scale: isDeleting ? 1 : 1.05 }}
                whileTap={{ scale: isDeleting ? 1 : 0.95 }}
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  <AlertTriangle size={16} className="mr-2" /> // Or Trash2
                )}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteModal;
