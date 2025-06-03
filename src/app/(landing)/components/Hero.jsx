'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
// Added useMotionValue, useTransform, animate for AnimatedNumber potentially used in CryptoDashboard
// Added AnimatePresence for the Ticker
import { motion, useScroll, useTransform, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import CryptoDashboard from './CryptoDashboard';
import DesktopCryptoDashboard from './DesktopCryptoDashboard';
// Assume DesktopCryptoDashboard exists or remove if not used
// import DesktopCryptoDashboard from './DesktopCryptoDashboard';

// --- NEW: Simulated Activity Ticker Component ---
const ActivityTicker = () => {
    // Expanded list with ~30 more withdrawal messages in specified ranges
    const messages = [
        // --- Kept Variety Messages (approx. 6) ---
        "Security audit passed: Protocol V3.1",
        "Strategy 'StableYield' deployed 500k USDT",
        "AI Signal: USDT stable - optimal for strategy entry",
        "Yield harvest complete: +$5,320 USDT value accrued",
        "Platform infrastructure upgrade V4.0 complete",
        "Auto-compounding enabled for staking rewards",

        // --- Kept Existing High/Mid Value Withdrawals (approx. 5) ---
        "High-value withdrawal: 250,000 USDT to external wallet",
        "Outgoing USDT transfer: 1.2M USDT approved",
        "Withdrawal complete: 980,000 USDT to 0x...eCd1",
        "Withdrawal confirmed: 88,000 USDT",
        "Withdrawal processed: 180,000 USDT",

        // --- NEW $1k - $10k Withdrawals (15 messages) ---
        "Withdrawal processed: 1,500 USDT to 0x...1234",
        "Funds sent: 3,800 USDT",
        "Withdrawal successful: 7,250 USDT",
        "Outgoing transfer: 9,900 USDT approved",
        "Withdrawal request processed: 2,100 USDT",
        "Transfer complete: 5,600 USDT to verified address",
        "Withdrawal confirmed: 8,400 USDT",
        "Withdrawal finalized: 4,950 USDT",
        "Funds sent: 6,300 USDT to exchange wallet",
        "Withdrawal processed: 2,750 USDT",
        "Outgoing transfer: 7,800 USDT",
        "Withdrawal complete: 3,100 USDT to 0x...5678",
        "Withdrawal transaction successful: 9,200 USDT",
        "Funds sent: 1,150 USDT",
        "Withdrawal approved: 5,050 USDT",

        // --- NEW $20k - $50k Withdrawals (15 messages) ---
        "Withdrawal processed: 22,500 USDT to 0x...abcd",
        "Funds sent: 38,000 USDT",
        "Withdrawal successful: 47,250 USDT",
        "Outgoing transfer: 49,900 USDT approved",
        "Withdrawal request processed: 21,000 USDT",
        "Transfer complete: 35,600 USDT to verified address",
        "Withdrawal confirmed: 28,400 USDT",
        "Withdrawal finalized: 44,950 USDT",
        "Funds sent: 26,300 USDT to exchange wallet",
        "Withdrawal processed: 32,750 USDT",
        "Outgoing transfer: 27,800 USDT",
        "Withdrawal complete: 43,100 USDT to 0x...efgh",
        "Withdrawal transaction successful: 39,200 USDT",
        "Funds sent: 21,150 USDT",
        "Withdrawal approved: 45,050 USDT",

        // --- Added a few more slightly varied low/mid withdrawals ---
        "Withdrawal initiated: 4,500 USDT",
        "Transfer pending: 24,000 USDT",
        "Withdrawal request received: 8,800 USDT",
        "Outgoing funds confirmation: 31,500 USDT",
        "Withdrawal executed: 3,300 USDT",
        "Funds transferred: 41,000 USDT",
        "USDT Withdrawal: 6,700 sent to 0x...beef",

    ]; // Total 53 messages

    const [index, setIndex] = useState(0);
    const [isClientTicker, setIsClientTicker] = useState(false);

    useEffect(() => {
        setIsClientTicker(true);
    }, []);

    useEffect(() => {
        if (!isClientTicker) return;

        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % messages.length);
        }, 4500); // Change message every 4.5 seconds

        return () => clearInterval(timer);
    }, [messages.length, isClientTicker]);

    if (!isClientTicker) {
        return null;
    }

    return (
        // Responsive positioning and sizing (same as before)
        <div className={
            `fixed z-40 pointer-events-none ` +
            `bottom-2 left-2 max-w-[80vw] ` +
            `sm:bottom-4 sm:left-4 sm:max-w-xs ` +
            `md:bottom-6 md:left-6 md:max-w-sm ` +
            `lg:max-w-md`
        }>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index} // Animate when index changes
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-lg px-3 py-1.5 shadow-lg"
                >
                    <p className="text-xs text-gray-200 font-mono truncate">
                        <span className="text-indigo-400 mr-1.5">&gt;</span>
                        {messages[index]}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
// --- End of Activity Ticker Component ---

// --- AnimatedNumber Components (Assuming CryptoDashboard might use them, keep definitions if needed) ---
// Component to animate a number counting up
const AnimatedNumber = ({ value, className, prefix = "", suffix = "" }) => {
    const count = useMotionValue(0);
    const displayValue = useTransform(count, (latest) => {
        const rounded = Math.round(latest);
        return rounded.toLocaleString();
    });

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 1.5,
            delay: 0.2,
            ease: [0.17, 0.67, 0.83, 0.99],
        });
        return controls.stop;
    }, [value, count]);

    return (
        <span className={className}>
            {prefix}
            <motion.span>{displayValue}</motion.span>
            {suffix}
        </span>
    );
};
const formatApy = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const AnimatedApy = ({ value, className, suffix = "%" }) => {
    const count = useMotionValue(0);
    const displayValue = useTransform(count, latest => formatApy(latest));

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 1.5, delay: 0.2, ease: [0.17, 0.67, 0.83, 0.99]
        });
        return controls.stop;
    }, [value, count]);

    return <span className={className}><motion.span>{displayValue}</motion.span>{suffix}</span>;
};


const Hero = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setIsClient(true);

        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) - 0.5,
                y: (e.clientY / window.innerHeight) - 0.5
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        const featureTimer = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % 3);
        }, 5000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(featureTimer);
        };
    }, []);

    const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
    const headerOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.2]);

    const features = [
        { title: "Military-Grade Security", description: "Multi-signature wallets and cold storage solutions...", icon: "/icons/shield.svg" },
        { title: "Real-Time Analytics", description: "Advanced market data with AI-driven predictions...", icon: "/icons/chart.svg" },
        { title: "Diversified Portfolio", description: "Automated strategies across multiple chains...", icon: "/icons/portfolio.svg" }
    ];

    const cryptoData = [ /* ... data for CryptoDashboard ... */];

    // --- Using original static stats bar data ---
    const statsData = [
        { label: "TVL", value: "$2.8B+" },
        { label: "Global Users", value: "250K+" },
        { label: "Chains Supported", value: "18+" },
        { label: "APY Average", value: "17.3%" }
    ];

    return (
        <div className="relative w-full " ref={containerRef}>
            {/* Render Ticker conditionally on client */}
            {isClient && <ActivityTicker />}

            <motion.div className="relative py-[32rem] md:py-0 min-h-screen w-full overflow-hidden bg-[#080A1A]">
                {/* Background elements */}
                <div className="absolute inset-0 overflow-hidden opacity-10">
                    {isClient && (<motion.div className="absolute inset-0" animate={{ background: `radial-gradient(circle at ${50 + mousePosition.x * 30}% ${50 + mousePosition.y * 30}%, rgba(99, 112, 241, 0.65) 0%, transparent 100%)` }} transition={{ type: "spring", damping: 30, stiffness: 100 }} />)}
                    <div className="absolute w-full h-full bg-grid-pattern" />
                    <style jsx>{` .bg-grid-pattern { /* ... styles ... */ } `}</style>
                </div>
                <div className="absolute inset-0 overflow-hidden pointer-events-none"> {/* pointer-events-none */}
                    {isClient && Array(20).fill(0).map((_, i) => (<motion.div key={i} className={`absolute w-2 h-2 rounded-full ${i % 5 === 0 ? 'bg-orange-500' : i % 3 === 0 ? 'bg-blue-500' : 'bg-indigo-500'}`} initial={{ left: `${10 + (i * 5) % 80}%`, top: `${5 + (i * 7) % 90}%`, opacity: 0.2 + (i % 5) * 0.1 }} animate={{ y: [0, -30, 0], x: [0, (i % 2 === 0 ? 10 : -10), 0], scale: [1, 1.2, 1] }} transition={{ duration: 3 + (i % 5), repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: i * 0.1 }} />))}
                    {isClient && Array(8).fill(0).map((_, i) => (<motion.div key={`line-${i}`} className="absolute h-px bg-indigo-500/30" style={{ left: `${15 + (i * 10) % 70}%`, top: `${20 + (i * 8) % 60}%`, width: '60px', transformOrigin: 'left center', rotate: `${(i * 45) % 360}deg` }} animate={{ opacity: [0.1, 0.3, 0.1], scaleX: [1, 1.2, 1] }} transition={{ duration: 4 + (i % 3), repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} />))}
                </div>

                <div className="container mx-auto px-6 relative z-10 h-screen flex flex-col justify-center">
                    <motion.div
                        style={{ y: contentY, opacity: headerOpacity }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
                    >
                        {/* Left side content */}
                        <motion.div className="lg:col-span-6 space-y-8" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: "easeInOut" }} >
                            <motion.div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-900/30 text-indigo-200 border border-indigo-800/50 text-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}> <span className="w-2 h-2 font-accent rounded-full bg-green-400 mr-2 animate-pulse"></span> Live Network Status: Optimal </motion.div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-display md:text-6xl lg:text-7xl font-bold tracking-tight"> <span className="text-white">Crypto</span> <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-purple-600"> Wealth Engine </span> </h1>
                                <p className="text-lg font-accent md:text-xl text-gray-300 max-w-lg"> Institutional-grade digital asset investment platform with advanced DeFi protocols and cross-chain integration. </p>
                            </div>
                            <div className="mt-8"> {/* Features Section */}
                                <div className="flex space-x-2 mb-6"> {features.map((_, index) => (<button key={index} onClick={() => setActiveIndex(index)} className={`w-12 h-1 rounded-full transition-all ${index === activeIndex ? 'bg-indigo-500' : 'bg-gray-700'}`} />))} </div>
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-xl">
                                        <h3 className="text-lg md:text-xl  font-display font-semibold text-white mb-2"> {features[activeIndex].title} </h3>
                                        <p className="text-gray-300 text-sm md:text-base font-accent"> {features[activeIndex].description} </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            {/* Original Button Styling */}
                            <div className="flex flex-wrap gap-4 mt-8">
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-900/30"> Start Investing </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.03 }} 
                                    whileTap={{ scale: 0.98 }} 
                                    className="px-8 py-4 bg-slate-900/40 backdrop-blur-sm border border-slate-800 text-white rounded-xl font-medium"
                                >
                                    <span className="flex items-center">
                                        <span>Explore Protocol</span>
                                        <motion.svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            className="h-5 w-5 ml-2" 
                                            viewBox="0 0 20 20" 
                                            fill="currentColor"
                                            animate={{ x: [0, 5, 0] }} // Smooth moving right and back
                                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} // Animation settings
                                        >
                                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </motion.svg>
                                    </span>
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Right side - Crypto Dashboard */}
                        {isClient && (
                            <>
                                    <DesktopCryptoDashboard /> 
                                    <CryptoDashboard />
                            </>
                        )}
                        {!isClient && <div className="lg:col-span-6"> {/* Placeholder */} </div>}


                    </motion.div>

                    {/* Stats bar - Using original static display */}
                    <motion.div
                        className="relative mx-auto mt-[1rem] md:top-[8rem]"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                    >
                        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl py-2 px-6 max-w-5xl mx-auto">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {statsData.map((stat, index) => ( // Changed map source back to static statsData
                                    <div key={index} className="text-center">
                                        {/* Original static text display */}
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                        <p className="text-gray-400 text-sm">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Hero;