'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DashboardError({ error }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white p-8 pt-24">
      <ShieldAlert className="h-16 w-16 text-red-500 mb-6" />
      <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Dashboard Data</h1>
      <p className="text-gray-400 text-center mb-6 max-w-md">
        Could not fetch dashboard data. Please try refreshing the page or contact support if the issue persists.
      </p>
      {error && (
        <div className="w-full max-w-md bg-gray-800/60 rounded-lg border border-gray-700/50 overflow-hidden mt-4">
          <div className="bg-gray-800 p-3 border-b border-gray-700/50">
            <span className="text-sm font-medium text-gray-400">Error Details</span>
          </div>
          <pre className="text-xs text-gray-500 p-4 overflow-auto max-h-48">
            {error.message || JSON.stringify(error)}
          </pre>
        </div>
      )}
    </div>
  );
}
