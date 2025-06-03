'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, FileText, Users, ShieldCheck, ListChecks, BarChart3, Settings2, Newspaper, HelpCircle, Mail, LogOut, UserCircle, Loader2, UserCog, CreditCard, Share2, Home, Info, Briefcase, HelpCircle as FaqIcon, Mail as ContactIcon, LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ListOrdered, Gift, Settings as SettingsIcon, Activity } from 'lucide-react'; // Added more specific icons
import Image from 'next/image';

// --- START: NewsTicker Component Definition (Refined Animation) ---
const NewsTicker = memo(() => {
    const newsItems = [
        "BTC eyes $75k as institutional inflows continue.",
        "Major DEX announces V4 upgrade focused on capital efficiency.",
        "USDT circulating supply reaches new all-time high.",
        "Layer-2 scaling solutions process record transaction volumes.",
        "DeFi yields stabilize after recent market volatility.",
        "Regulatory update: Stablecoin framework discussions progress.",
        "AI-driven portfolio manager 'Oracle X' outperforms benchmarks.",
        "Cross-chain bridge 'PortalLink' integrates Solana.",
        "NFT market shows signs of recovery with blue-chip sales.",
        "VC funding pours into Web3 gaming infrastructure projects.",
        "ETH gas fees drop significantly following Dencun upgrade.",
        "SOL transaction speeds see 15% improvement post-update.",
        "Fear & Greed Index enters 'Extreme Greed' territory.",
        "Experts debate potential 'altcoin season' start.",
        "US Fed holds interest rates steady; crypto market reacts mildly.",
        "New EU MiCA regulations phase-in begins.",
        "BlackRock Bitcoin ETF ($IBIT) crosses $20B AUM.",
        "MicroStrategy adds another 5,000 BTC to treasury.",
        "Aave V4 proposal focuses on risk parameter optimization.",
        "Uniswap interface adds support for Blast L2 network.",
        "Lido staking APR holds steady around 3.5%.",
        "Warning: Phishing scam targets MetaMask users.",
        "$5M exploit reported on smaller DeFi protocol 'YieldFarmX'.",
        "Arbitrum Nitro stack update enhances sequencer performance.",
        "Optimism announces next round of RetroPGF grants.",
        "Polygon zkEVM mainnet beta progresses smoothly.",
        "Cardano's Hydra head scaling solution shows promise in tests.",
        "USDC reserves fully backed, audit report released.",
        "Binance lists new AI-related token $AGENT.",
        "Coinbase reports surge in Q1 trading volume.",
        "NFT floor prices stabilize; utility focus increases.",
        "Decentraland hosts major virtual fashion week event.",
        "AI models deployed for on-chain anomaly detection.",
        "Crypto correlation with Nasdaq shows slight decrease.",
        "Global crypto user base estimated to exceed 500 million.",
        "Tokenization of Real World Assets (RWA) gains traction.",
        "Bitcoin halving event anticipation builds.",
        "LayerZero interoperability protocol expands chain support.",
        "Chainlink oracle network secures new data partnerships.",
        "Dogecoin ($DOGE) sees brief surge on social media trends.",
        "Ethereum Name Service (ENS) registrations climb.",
        "DeFi lending rates see slight uptick.",
        "New privacy-focused L1 blockchain 'Nocturne' launches testnet.",
        "Analysis: Whales accumulate BTC below $70k level.",
        "SEC delays decision on spot Ethereum ETF applications.",
        "Grayscale pushes for regulatory approval on options trading for ETFs.",
        "South Korea tightens crypto exchange regulations.",
        "Avalanche C-Chain processes peak daily transactions.",
        "AI Crypto Trading Bot 'Quant Algo' reports 25% monthly gain.",
        "CBDC pilot programs expand in Asia-Pacific region.",
        "Withdrawal processed: 1,500 USDT to 0x...1234", // Included some previous withdrawal examples for mix
        "Funds sent: 3,800 USDT",
        "Withdrawal successful: 7,250 USDT",
        "Outgoing transfer: 9,900 USDT approved",
        "Withdrawal request processed: 21,000 USDT",
        "Transfer complete: 35,600 USDT to verified address",
        "Withdrawal confirmed: 28,400 USDT",
    ]; 
    // Ensure duplication for smooth loop
    const marqueeItems = [...newsItems, ...newsItems];

    // Slightly slower speed (increase multiplier)
    const scrollDuration = newsItems.length * 4; // Approx 3.5 seconds per item

    const marqueeVariants = {
        animate: {
            x: ["0%", "-50%"], // Animate one full content width left
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: scrollDuration,
                    ease: "linear", // Constant speed is crucial for marquee
                },
            },
        },
    };

    const [isTickerClient, setIsTickerClient] = useState(false);
    useEffect(() => { setIsTickerClient(true); }, []);

    // Avoid rendering motion component server-side
    if (!isTickerClient) {
        return <div className="h-8 w-full bg-black/30 border-b border-indigo-900/30"></div>;
    }

    return (
        // Outer container crops the scrolling content
        <div className="h-8 w-full bg-black/80 backdrop-blur-sm overflow-hidden border-b border-indigo-900/40">
            {/* Inner container scrolls horizontally. Crucially uses style={{width: 'max-content'}} */}
            <motion.div
                className="flex items-center h-full" // Flex layout for horizontal items
                style={{ width: 'max-content' }} // Explicitly set width based on content
                variants={marqueeVariants}
                animate="animate"
            >
                {/* Render the duplicated items */}
                {marqueeItems.map((item, index) => (
                    <div
                        key={index} // Unique key for each mapped item
                        className="text-xs text-gray-200 font-accent tracking-wider whitespace-nowrap px-6 flex items-center flex-shrink-0" // Ensure no wrap, no shrink
                    >
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${index % 3 === 0 ? 'bg-indigo-500' : index % 3 === 1 ? 'bg-blue-500' : 'bg-purple-500'} opacity-70 flex-shrink-0`}></span>
                        <span className="flex-shrink-0">{item}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
});
NewsTicker.displayName = 'NewsTicker';
// --- End of NewsTicker ---


// --- Main Header Component ---
export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const dropdownTimeoutRef = useRef(null);
    const { data: session, status } = useSession(); // Get session status and data

    useEffect(() => {
        setIsClient(true); // Still needed for NewsTicker and initial render consistency
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Added missing function definition from previous step
    const handleDropdownToggle = (index) => {
        if (activeDropdown === index) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(index);
        }
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
    };

    // Dropdown hover handlers with delay
    const handleMouseEnter = (index) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setActiveDropdown(index);
    };
    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
    };
    const handleDropdownMouseEnter = () => { if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current); };
    useEffect(() => () => { if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current); }, []);

    // --- Navigation Definitions ---
    const publicNavItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'About', href: '#', icon: Info, dropdown: [{ name: 'Our Story', href: '/about/our-story', icon: FileText }, { name: 'Team', href: '/about/team', icon: Users }, { name: 'Security', href: '/about/security', icon: ShieldCheck }] },
        { name: 'Investments', href: '#', icon: Briefcase, dropdown: [{ name: 'Plans', href: '/investment/plans', icon: ListChecks }, { name: 'Performance', href: '/investment/performance', icon: BarChart3 }, { name: 'How It Works', href: '/investment/how-it-works', icon: Settings2 }] },
        { name: 'FAQ', href: '/#faq', icon: FaqIcon },
        { name: 'Contact', href: '/contact', icon: ContactIcon },
    ];

    const userNavItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Deposit', href: '/dashboard/deposit', icon: ArrowDownCircle }, // Assuming paths
        { name: 'Withdraw', href: '/dashboard/withdraw', icon: ArrowUpCircle }, // Assuming paths
        { name: 'Plans', href: '/investment/plans', icon: ListOrdered }, // Link to existing plans page
        { name: 'My Referrals', href: '/dashboard/referrals', icon: Gift }, // Assuming path
        { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon }, // Assuming path
    ];

    const adminNavItems = [
        { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Users', href: '/admin/users', icon: UserCog }, // Assuming path
        { name: 'Investment Plans', href: '/admin/subscriptions', icon: CreditCard }, // Assuming path
        { name: 'Referrals', href: '/admin/referrals', icon: Share2 }, // Assuming path
        { name: 'Activity Log', href: '/admin/activity', icon: Activity }, // Assuming path
        { name: 'Settings', href: '/admin/settings', icon: SettingsIcon }, // Assuming path
    ];
    // --- End Navigation Definitions ---


    // Determine which nav items to display
    let currentNavItems = publicNavItems; // Default to public
    let isAdmin = false;
    let isUser = false;

    if (status === 'authenticated') {
        if (['admin', 'super-admin'].includes(session.user?.role)) {
            currentNavItems = adminNavItems;
            isAdmin = true;
        } else {
            currentNavItems = userNavItems;
            isUser = true;
        }
    }

    // Styling variables based on state
    const headerBg = scrolled || isMenuOpen ? 'bg-white shadow-lg' : 'bg-transparent';
    const textColor = scrolled || isMenuOpen ? 'text-gray-800' : 'text-gray-100';
    const logoColor = scrolled || isMenuOpen ? 'text-gray-900' : 'text-white';
    const menuButtonColor = scrolled || isMenuOpen ? 'text-gray-800' : 'text-white';


    return (
        <header className={`fixed w-full font-display z-50 transition-colors duration-300 ${headerBg}`}>
            {/* Render NewsTicker only on client */}
            { isClient && <NewsTicker />}

            <div className="container px-6 ">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <Image src="/logo.png" alt="StableWealth" width={160} height={40} className="h-12 md:h-14 w-auto transition-all duration-300" priority />
                        </Link>
                    </div>

                    {/* Desktop Navigation - Role Based */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        {currentNavItems.map((item, index) => (
                            <div key={item.name} className="relative" onMouseLeave={item.dropdown ? handleMouseLeave : undefined}>
                                {item.dropdown ? (
                                    // Dropdown Menu Item
                                    <div className="relative" onMouseEnter={() => handleMouseEnter(index)}>
                                        <button
                                            className={`flex items-center px-4 py-2 ${textColor} hover:text-indigo-500 transition-colors duration-200 font-medium group`}
                                            onClick={() => handleDropdownToggle(index)}
                                            aria-haspopup="true"
                                            aria-expanded={activeDropdown === index}
                                        >
                                            {item.icon && React.createElement(item.icon, { size: 16, className: `mr-2 ${textColor} group-hover:text-indigo-500 transition-colors duration-200`})}
                                            <span className={`relative ${textColor}`}>
                                                {item.name}
                                                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 ${activeDropdown === index ? 'w-full' : 'group-hover:w-full'}`}></span>
                                            </span>
                                            <ChevronDown size={16} strokeWidth={2.5} className={`ml-1.5 transition-all duration-300 ${activeDropdown === index ? 'text-indigo-500 rotate-180' : `${textColor} group-hover:text-indigo-500`}`} />
                                        </button>
                                        <AnimatePresence>
                                            {(activeDropdown === index) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 5, scale: 0.98, transition: { duration: 0.1 } }}
                                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                    className="absolute left-0 mt-2 w-64 rounded-xl overflow-hidden z-50 backdrop-blur-md"
                                                    onMouseEnter={handleDropdownMouseEnter}
                                                    onMouseLeave={handleMouseLeave}
                                                    style={{ boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)' }}
                                                >
                                                    <div className="bg-gray-950/70 backdrop-blur-lg border border-gray-700/50 rounded-xl overflow-hidden">
                                                        <div className="py-2">
                                                            {item.dropdown.map((dropdownItem, dropdownIndex) => {
                                                                const Icon = dropdownItem.icon;
                                                                return (
                                                                    <motion.div key={dropdownItem.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: dropdownIndex * 0.04 }} className="px-2">
                                                                        <Link href={dropdownItem.href} className="flex items-center px-3 py-2.5 text-sm text-gray-300 hover:bg-indigo-600/20 rounded-md transition-all duration-150 group relative" onClick={() => setActiveDropdown(null)}>
                                                                            {Icon && <Icon size={16} className="mr-3 text-indigo-400/80 group-hover:text-indigo-400 transition-colors flex-shrink-0" />}
                                                                            <span className="relative z-10 font-medium group-hover:text-white">{dropdownItem.name}</span>
                                                                        </Link>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <Link href={item.href} className={`flex items-center px-4 py-2 ${textColor} hover:text-indigo-500 transition duration-200 font-medium group relative`} >
                                        {item.icon && React.createElement(item.icon, { size: 16, className: `mr-2 ${textColor} group-hover:text-indigo-500 transition-colors duration-200` })}
                                        <span className="relative"> {item.name} <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full"></span> </span>
                                    </Link>
                                )}
                            </div>
                        ))}

                        {/* Admin Dropdown - Conditionally Rendered */}
                        {session && ['admin', 'super-admin'].includes(session.user?.role) && (
                             <div className="relative" onMouseLeave={handleMouseLeave}>
                                <div className="relative" onMouseEnter={() => handleMouseEnter('admin')} >
                                    <button className={`flex items-center px-4 py-2 ${textColor} hover:text-purple-500 transition-colors duration-200 font-medium group`} onClick={() => handleDropdownToggle('admin')} aria-haspopup="true" aria-expanded={activeDropdown === 'admin'} >
                                        <span className={`relative ${textColor}`}> Admin <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 ${activeDropdown === 'admin' ? 'w-full' : 'group-hover:w-full'}`}></span> </span>
                                        <ChevronDown size={16} strokeWidth={2.5} className={`ml-1.5 transition-all duration-300 ${activeDropdown === 'admin' ? 'text-purple-500 rotate-180' : `${textColor} group-hover:text-purple-500`}`} />
                                    </button>
                                    <AnimatePresence>
                                        {(activeDropdown === 'admin') && (
                                            <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.98, transition: { duration: 0.1 } }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="absolute left-0 mt-2 w-64 rounded-xl overflow-hidden z-50 backdrop-blur-md" onMouseEnter={handleDropdownMouseEnter} onMouseLeave={handleMouseLeave} style={{ boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)' }} >
                                                <div className="bg-gray-950/70 backdrop-blur-lg border border-gray-700/50 rounded-xl overflow-hidden">
                                                    <div className="py-2">
                                                        {adminNavItems.map((adminItem, adminIndex) => { const Icon = adminItem.icon; return (<motion.div key={adminItem.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: adminIndex * 0.04 }} className="px-2" > <Link href={adminItem.href} className="flex items-center px-3 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 rounded-md transition-all duration-150 group relative" onClick={() => setActiveDropdown(null)} > {Icon && <Icon size={16} className="mr-3 text-purple-400/80 group-hover:text-purple-400 transition-colors flex-shrink-0" />} <span className="relative z-10 font-medium group-hover:text-white">{adminItem.name}</span> </Link> </motion.div>); })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* Auth Buttons / User Info */}
                    <div className="hidden lg:flex items-center space-x-3">
                        {status === 'loading' ? (
                            <div className={`flex items-center px-5 py-2 rounded-md font-medium ${scrolled || isMenuOpen ? 'text-gray-500' : 'text-gray-400'} text-sm`}>
                                <Loader2 size={18} className="animate-spin mr-2" /> Loading...
                            </div>
                        ) : session ? (
                            <>
                                <span className={`text-sm font-medium ${scrolled || isMenuOpen ? 'text-gray-600' : 'text-gray-300'} hidden md:inline-block truncate max-w-[150px]`} title={session.user.email}>
                                    {session.user.email}
                                </span>
                                <Link href="/dashboard" className={`flex items-center px-4 py-2 rounded-md font-medium ${scrolled || isMenuOpen ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'} transition-all duration-200 text-sm`} title="Dashboard">
                                    <UserCircle size={18} className="mr-1 md:mr-0" /> <span className="md:hidden ml-1">Dashboard</span>
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })} // Sign out and redirect to home
                                    className={`flex items-center px-4 py-2 rounded-md font-medium ${scrolled || isMenuOpen ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10'} transition-all duration-200 text-sm`}
                                    title="Sign Out"
                                >
                                    <LogOut size={16} className="mr-1 md:mr-0" /> <span className="md:hidden ml-1">Sign Out</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/signin" className={`px-5 py-2 rounded-md font-medium ${scrolled || isMenuOpen ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'} transition-all duration-200 text-sm`} > Login </Link>
                                <Link href="/auth/signup" className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 hover:scale-105 transition-all duration-200 shadow-md text-sm" > Get Started </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center">
                        <button onClick={toggleMenu} className={`${menuButtonColor} p-2 focus:outline-none transition-colors duration-300`} aria-label="Toggle menu" >
                            <motion.div initial={false} animate={{ rotate: isMenuOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                                {isMenuOpen ? <X size={24} style={{ transform: 'rotate(-45deg)' }} /> : <Menu size={28} />}
                            </motion.div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div className="lg:hidden bg-white absolute w-full shadow-xl" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ top: '100%' }} >
                        <div className="container font-accent mx-auto px-4 py-3 text-gray-800">
                            <nav className="flex flex-col divide-y divide-gray-200">
                                {currentNavItems.map((item, index) => ( // Changed navItems to currentNavItems
                                    <div key={item.name} className="py-2">
                                        {item.dropdown ? (
                                            <div>
                                                <button onClick={() => handleDropdownToggle(index)} className="flex items-center justify-between w-full py-2 font-medium text-gray-800" >
                                                    <span className="flex items-center"> {item.icon && React.createElement(item.icon, { size: 18, className: `mr-3 text-gray-600` })} {item.name} </span>
                                                    <ChevronDown size={16} strokeWidth={2} className={`transform transition-transform duration-200 ${activeDropdown === index ? 'rotate-180 text-primary-600' : ''}`} />
                                                </button>
                                                <AnimatePresence>
                                                    {activeDropdown === index && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="ml-4 mt-1 space-y-0 border-l border-primary-500/50 pl-4" >
                                                            {item.dropdown.map((dropdownItem) => { const Icon = dropdownItem.icon; return (<Link key={dropdownItem.name} href={dropdownItem.href} className="flex items-center py-2 text-gray-600 hover:text-primary-600 transition duration-200" onClick={() => setIsMenuOpen(false)} > {Icon && <Icon size={16} className="mr-2.5 text-gray-500" />} {dropdownItem.name} </Link>); })}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <Link href={item.href} className="flex items-center py-2 font-medium text-gray-800 hover:text-primary-600 transition duration-200" onClick={() => setIsMenuOpen(false)} >
                                                {item.icon && React.createElement(item.icon, { size: 18, className: `mr-3 text-gray-600` })} {item.name}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                                {/* Mobile Auth Section */}
                                <div className="py-4">
                                    {status === 'loading' ? (
                                        <div className="flex items-center justify-center px-4 py-3 text-gray-500">
                                            <Loader2 size={18} className="animate-spin mr-2" /> Loading...
                                        </div>
                                    ) : session ? (
                                        <div className="flex flex-col space-y-3">
                                             <span className="px-4 py-2 text-sm text-gray-600 text-center truncate" title={session.user.email}>
                                                {session.user.email}
                                            </span>
                                            <Link href="/dashboard" className="flex items-center justify-center px-4 py-3 rounded-md border border-gray-300 text-center text-gray-700 hover:bg-gray-100 transition duration-200" onClick={() => setIsMenuOpen(false)} >
                                                <UserCircle size={18} className="mr-2" /> Dashboard
                                            </Link>
                                            <button
                                                onClick={() => { signOut({ callbackUrl: '/' }); setIsMenuOpen(false); }}
                                                className="flex items-center justify-center px-4 py-3 rounded-md bg-red-50 text-center text-red-600 font-medium hover:bg-red-100 transition duration-200"
                                            >
                                                <LogOut size={16} className="mr-2" /> Sign Out
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col space-y-3">
                                            <Link href="/auth/signin" className="px-4 py-3 rounded-md border border-gray-300 text-center text-gray-700 hover:bg-gray-100 transition duration-200" onClick={() => setIsMenuOpen(false)} > Login </Link>
                                            <Link href="/auth/signup" className="px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-center text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition duration-200" onClick={() => setIsMenuOpen(false)} > Get Started </Link>
                                        </div>
                                    )}
                                </div>
                            </nav>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
