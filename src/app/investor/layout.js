'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/app/investor/components/Sidebar'; // Import the INVESTOR Sidebar component
import { Loader2, Menu } from 'lucide-react';

// Import icons for investor nav items
import {
    LayoutDashboard, // Dashboard
    ListOrdered,     // Investment Plans / Subscription Plans
    ArrowDownCircle, // Deposit
    ArrowUpCircle,   // Withdraw
    Settings as SettingsIcon // Settings
} from 'lucide-react';

// Define INVESTOR navigation items
const investorNavItems = [
    { name: 'Dashboard', href: '/investor/dashboard', icon: LayoutDashboard },
    { name: 'Plans', href: '/investor/plans', icon: ListOrdered }, // Assuming '/investor/plans' is the route
    { name: 'Deposit', href: '/investor/deposit', icon: ArrowDownCircle }, // Assuming '/investor/deposit'
    { name: 'Withdraw', href: '/investor/withdraw', icon: ArrowUpCircle }, // Assuming '/investor/withdraw'
    { name: 'Settings', href: '/investor/settings', icon: SettingsIcon }, // Assuming '/investor/settings'
];

export default function InvestorLayout({ children }) {
    const { data: session, status } = useSession();
    const [isMobileOpen, setIsMobileOpen] = useState(false); // State for mobile sidebar

    const toggleMobileSidebar = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    // Loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" /> {/* Adjusted color */}
            </div>
        );
    }

    // Ensure user is authenticated and has the 'user' role
    if (status !== 'authenticated' || session?.user?.role !== 'user') {
        // Handle unauthorized state - redirect or show message
        // Depending on middleware, this might not be strictly necessary, but good practice
        // For now, return null, assuming middleware handles redirection.
        // Or redirect explicitly:
        // import { useRouter } from 'next/navigation';
        // const router = useRouter();
        // React.useEffect(() => { router.push('/auth/signin'); }, [router]);
        return (
             <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
                <span>Redirecting...</span> {/* Or an access denied message */}
            </div>
        );
    }

    // Prepare user info for the sidebar
    const userInfo = { email: session.user.email, role: session.user.role };

    return (
        <div className="h-screen flex bg-gray-950 text-gray-100">
            {/* Pass state and toggle function to INVESTOR Sidebar */}
            <Sidebar
                navItems={investorNavItems} 
                userInfo={userInfo}
                isMobileOpen={isMobileOpen}
                toggleMobileSidebar={toggleMobileSidebar}
            />

            {/* Main content area */}
            <div className="flex-grow flex flex-col "> {/* Keep padding for fixed sidebar */}
                {/* Mobile Header with Toggle Button */}
                <div className="lg:hidden h-16 flex items-center px-4 bg-gray-900/30  border-gray-700/50 flex-shrink-0 z-30"> {/* Adjusted z-index and removed relative */}
                    <button onClick={toggleMobileSidebar} className="text-gray-400 hover:text-white z-[100] relative">
                        <Menu strokeWidth={1} size={30} />
                    </button>
                    {/* Optional: Add Investor Logo/Title */}
                </div>

                {/* Page Content */}
                <main className="flex-grow overflow-y-auto w-full">
                    {/* Render the page content */}
                    {children}
                </main>
            </div>
        </div>
    );
}
