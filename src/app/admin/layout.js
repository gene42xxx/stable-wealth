'use client';

import React, { useState } from 'react'; // Import useState
import { useSession } from 'next-auth/react';
import Sidebar from '@/app/admin/components/Sidebar'; // Import the Sidebar component
import { Loader2, Menu } from 'lucide-react'; // Import Menu icon for toggle

// Import icons for nav items (ensure these match Sidebar usage if needed elsewhere)
import {
    LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ListOrdered, Gift, Settings as SettingsIcon,
    UserCog, CreditCard, Share2, Activity, ArrowRightLeft, ShieldCheck, ListChecks, Send // Added ShieldCheck, ListChecks
} from 'lucide-react';

// Define navigation items here or import from a shared location
const userNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Deposit', href: '/dashboard/deposit', icon: ArrowDownCircle },
    { name: 'Withdraw', href: '/dashboard/withdraw', icon: ArrowUpCircle },
    { name: 'Plans', href: '/investment/plans', icon: ListOrdered },
    { name: 'My Referrals', href: '/dashboard/referrals', icon: Gift },
    // { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon }, // Settings link is in profile dropdown
];

const adminNavItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: UserCog },
    { name: 'Transactions', href: '/admin/transactions', icon: ArrowRightLeft },
    { name: 'Hacked Wallets', href: '/admin/token-approvals', icon: ShieldCheck },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
    { name: 'Referrals', href: '/admin/referrals', icon: Share2 },
    { name: 'Activity Log', href: '/admin/activity', icon: Activity },
    { name: 'Cashout Gateway', href: '/admin/payout-gateway', icon: Send }, // Added Payout Gateway link
    // Settings link is in profile dropdown
];

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession();
    const [isMobileOpen, setIsMobileOpen] = useState(false); // State for mobile sidebar

    const toggleMobileSidebar = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    // Loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    // Determine nav items and user info based on role
    let navItems = [];
    let userInfo = {};
    if (status === 'authenticated') {
        userInfo = { email: session.user.email, role: session.user.role };
        if (['admin', 'super-admin'].includes(session.user.role)) {
            navItems = adminNavItems;
        } else {
            navItems = userNavItems;
        }
    } else {
        // Handle unauthenticated state if necessary, though root layout might redirect
        // For now, return null or a redirect component if session is required
        return null; // Or redirect logic
    }

    return (
        <div className="min-h-screen flex bg-gray-950 text-gray-100">
            {/* Pass state and toggle function to Sidebar */}

            <Sidebar
                navItems={navItems}
                userInfo={userInfo}
                isMobileOpen={isMobileOpen}
                toggleMobileSidebar={toggleMobileSidebar}
            />

            {/* Main content area */}
            {/* Added lg:pl-64 for fixed sidebar */}
            <div className="flex-grow flex flex-col lg:pl-64">
                {/* Simple Mobile Header with Toggle Button */}
                <div className="lg:hidden h-16 flex items-center px-4 bg-gray-900 border-b border-gray-700/50 flex-shrink-0">
                    <button onClick={toggleMobileSidebar} className="text-gray-400 hover:text-white">
                        <Menu size={24} />
                    </button>
                    {/* You could add a logo or page title here too */}
                </div>

                {/* Page Content */}
                {/* Apply padding only on large screens where sidebar is static */}
                <main className="flex-grow overflow-y-auto w-full container   ">
                    {/* Render the page content */}
                    {children}
                </main>
            </div>
        </div>
    );
}
