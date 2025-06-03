'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import React from 'react';

const StatCard = ({ icon, title, value, change, changePositive, gradient }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-r ${gradient} p-5 rounded-xl border border-gray-700/20 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_25px_25px_rgba(0,0,0,0.25)] transition-all duration-200`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between">
        <div className="text-gray-300">
          {icon}
        </div>
        <ChevronRight size={18} className="text-gray-500 hover:text-white transition-colors" />
      </div>

      <div className="mt-3">
        <h3 className="text-xs font-medium text-gray-400/80 uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-bold mt-1 text-gray-100/90">{value}</p>
      </div>

      <div className={`flex items-center mt-4 text-sm font-medium ${changePositive ? 'text-green-400/90' : 'text-red-400/90'}`}>
        {changePositive ? (
          <ArrowUp size={14} className="mr-1" />
        ) : (
          <ArrowDown size={14} className="mr-1" />
        )}
        <span>{change}</span>
      </div>
    </motion.div>
  );
};

export default StatCard;
