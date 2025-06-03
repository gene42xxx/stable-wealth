'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Info } from 'lucide-react';

// Animation variants (can be passed as props or defined here)
const defaultContainerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.2, duration: 0.5 } // Adjust delay as needed
  }
};

export default function ResourcesHelp({ containerVariants = defaultContainerVariants }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-8 mb-12" // Keep margins here or manage in parent
    >
      <div className="bg-gradient-to-b from-gray-800/70 to-gray-900/80 p-6 rounded-xl border border-gray-700/50 shadow-xl backdrop-blur-md">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Info size={18} className="mr-2 text-cyan-400" />
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Resources & Help</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/investor/help">
            <div className="p-4 bg-gray-800/60 rounded-lg border border-gray-700/40 hover:bg-gray-800/80 hover:border-cyan-700/40 transition-all duration-300 h-full">
              <h4 className="font-medium text-cyan-300 mb-2">Help Center</h4>
              <p className="text-xs text-gray-400">Find answers to frequently asked questions and learn how our platform works.</p>
            </div>
          </Link>

          <Link href="/investor/support">
            <div className="p-4 bg-gray-800/60 rounded-lg border border-gray-700/40 hover:bg-gray-800/80 hover:border-purple-700/40 transition-all duration-300 h-full">
              <h4 className="font-medium text-purple-300 mb-2">Contact Support</h4>
              <p className="text-xs text-gray-400">Need help? Our support team is available 24/7 to assist you with any issues.</p>
            </div>
          </Link>

          <Link href="/investor/plans">
            <div className="p-4 bg-gray-800/60 rounded-lg border border-gray-700/40 hover:bg-gray-800/80 hover:border-green-700/40 transition-all duration-300 h-full">
              <h4 className="font-medium text-green-300 mb-2">Investment Plans</h4>
              <p className="text-xs text-gray-400">Explore our investment plans and find the one that best suits your financial goals.</p>
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
