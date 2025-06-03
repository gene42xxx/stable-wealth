'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Notification = ({ message, type = 'info', onClose, duration = 5000 }) => {
    let bgColorClass = '';
    let icon = null;
    let textColorClass = '';
    let iconColorClass = '';

    switch (type) {
        case 'success':
            bgColorClass = 'bg-green-900/70 border-green-700/50';
            textColorClass = 'text-green-200';
            iconColorClass = 'text-green-400';
            icon = <CheckCircle size={20} />;
            break;
        case 'error':
            bgColorClass = 'bg-red-900/70 border-red-700/50';
            textColorClass = 'text-red-200';
            iconColorClass = 'text-red-400';
            icon = <XCircle size={20} />;
            break;
        case 'info':
        default:
            bgColorClass = 'bg-blue-900/70 border-blue-700/50';
            textColorClass = 'text-blue-200';
            iconColorClass = 'text-blue-400';
            icon = <Info size={20} />;
            break;
    }

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
                    className={`fixed bottom-6 right-6 z-[100] p-4 rounded-lg shadow-lg backdrop-blur-md ${bgColorClass} border flex items-center space-x-3 max-w-sm`}
                    role="alert"
                >
                    <div className={`flex-shrink-0 ${iconColorClass}`}>
                        {icon}
                    </div>
                    <div className={`flex-1 font-medium ${textColorClass}`}>
                        {message}
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                        aria-label="Close notification"
                    >
                        <X size={18} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Notification;
