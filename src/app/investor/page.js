'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    // If status is not loading and there's no session, redirect to signin
    if (status !== 'loading' && !session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Show loading state while session is being checked
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading dashboard...</span>
      </div>
    );
  }

  // If authenticated, show the dashboard content
  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 pt-24">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-lg text-gray-300 mb-6">
            Welcome back, {session.user?.email || 'User'}!
          </p>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Your Account Overview</h2>
            {/* Placeholder for dashboard content */}
            <p className="text-gray-400">
              This is your secure dashboard area. More features coming soon.
            </p>
            {/* You can add more components and data fetching here */}
          </div>
        </div>
      </div>
    );
  }

  // Fallback in case redirection hasn't happened yet (or if logic fails)
  // This shouldn't normally be reached due to the useEffect redirect.
  return (
     <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Redirecting to sign in...</p>
     </div>
  );
}
