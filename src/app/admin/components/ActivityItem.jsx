'use client';

import React from 'react';
// Removed Image import
import { motion } from 'framer-motion';
import { LogIn, UserCog, UserPlus, UserX, Settings2, CreditCard, Activity, UserCircle } from 'lucide-react'; // Added UserCircle

// Helper to get an icon based on action type
const getActionIcon = (action) => {
  switch (action) {
    case 'login': return <LogIn size={16} />;
    case 'user_update': return <UserCog size={16} />;
    case 'user_create': return <UserPlus size={16} />;
    case 'user_delete': return <UserX size={16} />;
    case 'settings_change': return <Settings2 size={16} />;
    case 'subscription_update': return <CreditCard size={16} />;
    default: return <Activity size={16} />; // Default icon
  }
};

// Define color classes based on action type for the icon
const getIconColorClass = (action) => {
    switch (action) {
      case 'login': return 'text-blue-400';
      case 'user_update': return 'text-yellow-400';
      case 'user_create': return 'text-green-400';
      case 'user_delete': return 'text-red-400';
      case 'settings_change': return 'text-purple-400';
      case 'subscription_update': return 'text-teal-400';
      default: return 'text-gray-400';
    }
  };


const ActivityItem = ({ name, action, details, time }) => { // Removed avatar prop
  const IconComponent = getActionIcon(action); // Get icon based on the raw action type
  const iconColorClass = getIconColorClass(action);

  // Format the action string for display (e.g., 'user_update' -> 'User Update')
  const formattedAction = action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <motion.div
      className="flex items-center p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/70 border border-slate-700/40 shadow-lg hover:shadow-blue-500/15 hover:border-blue-600/60 transition-all duration-300 group backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Icon Placeholder */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700/50 border-2 border-slate-600/50 mr-4 flex items-center justify-center shadow-md group-hover:border-blue-500/70 group-hover:bg-slate-700 transition-colors duration-300">
        <UserCircle size={20} className="text-slate-400 group-hover:text-blue-300 transition-colors duration-300" />
      </div>

      {/* Main Content */}
      <div className="flex-grow min-w-0"> {/* Added min-w-0 for flex truncation */}
        <div className="flex items-center justify-between mb-1 flex-wrap gap-x-2"> {/* Added flex-wrap and gap */}
           {/* Action Type with Icon */}
           <div className={`flex items-center text-xs font-semibold ${iconColorClass} group-hover:brightness-110 transition-all duration-300`}>
             {IconComponent && React.cloneElement(IconComponent, { className: `mr-1.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ${iconColorClass}` })}
             <span className="truncate">{formattedAction}</span>
           </div>
           {/* Time */}
           <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-300 flex-shrink-0">{time}</p>
        </div>

        {/* User Name and Details */}
        <p className="text-sm text-slate-200 truncate"> {/* Added truncate */}
          <span className="font-semibold text-slate-100 group-hover:text-white transition-colors duration-300">{name}</span>
          {details && <span className="text-slate-400 ml-1.5">{details}</span>}
        </p>
      </div>
    </motion.div>
  );
};

export default ActivityItem;
