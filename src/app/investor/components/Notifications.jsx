'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Info, Clock } from 'lucide-react';

// Animation variants (can be passed as props or defined here)
const defaultItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12
    }
  }
};

export default function Notifications({ itemVariants = defaultItemVariants }) {
  // In a real app, notifications would come from state or props
  const notifications = [
    {
      id: 1,
      type: 'info',
      title: 'Welcome to your dashboard',
      message: 'Explore your investment performance and upcoming deposit requirements.',
      icon: Info,
      color: 'blue'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Weekly deposit reminder',
      message: 'Your next required deposit is approaching soon.',
      icon: Clock,
      color: 'amber'
    }
    // Add more dynamic notifications here
  ];

  const getIconStyles = (color) => {
    switch (color) {
      case 'blue': return 'bg-blue-900/20 border-blue-700/30 text-blue-400';
      case 'amber': return 'bg-amber-900/20 border-amber-700/30 text-amber-400';
      default: return 'bg-gray-900/20 border-gray-700/30 text-gray-400';
    }
  };

  const getIconWrapperStyles = (color) => {
    switch (color) {
      case 'blue': return 'bg-blue-500/20';
      case 'amber': return 'bg-amber-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const getTextStyles = (color) => {
    switch (color) {
      case 'blue': return 'text-blue-300';
      case 'amber': return 'text-amber-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <motion.div variants={itemVariants} className="bg-gradient-to-b from-gray-800/70 to-gray-900/80 p-6 rounded-xl border border-gray-700/50 shadow-xl backdrop-blur-md">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <AlertCircle size={18} className="mr-2 text-orange-400" />
        <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Notifications</span>
      </h3>

      {/* Enhanced notifications UI */}
      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = notification.icon;
            const iconStyles = getIconStyles(notification.color);
            const iconWrapperStyles = getIconWrapperStyles(notification.color);
            const textStyles = getTextStyles(notification.color);

            return (
              <div key={notification.id} className={`p-3 ${iconStyles} rounded-lg flex items-start`}>
                <div className={`p-1.5 ${iconWrapperStyles} rounded-md mr-3 mt-0.5`}>
                  <Icon size={14} className={textStyles} />
                </div>
                <div>
                  <p className={`text-sm ${textStyles} font-medium`}>{notification.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No new notifications.</p>
        )}
      </div>

      {/* Coming soon badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 pt-3 border-t border-gray-700/30 text-center"
      >
        <div className="inline-block bg-orange-900/30 rounded-full px-3 py-1 text-xs text-orange-300 border border-orange-700/40">
          <span className="flex items-center">
            <Clock size={12} className="mr-1.5" />
            More Notifications Coming Soon
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
