// ./app/investment/plans/page.jsx (COMPLETE CODE - V6 - Fixed Table Hydration - Verified Full)
'use client';

// --- Imports ---
import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence, useAnimation, useInView, useScroll, useTransform, animate } from 'framer-motion';
import {
    Shield, Table, BarChartHorizontalBig, Zap, HelpCircle, ChevronRight, Check, PlusCircle, ArrowRight, ChevronDown, Bot, Settings, BarChartBig, AlertTriangle, Mail, // Added required icons
    FileText, Users, ShieldCheck, ListChecks, BarChart3, Settings2, Newspaper // Added icons used in data objects
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Keep for logo/placeholders if needed later



// --- Animation Variants ---
const fadeIn = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};
const cardVariant = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};
const listItemVariant = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
};
// --- End Animation Variants ---


// --- START: Helper Component Definitions (Full Code Below) ---

// AnimateInView Hook Component
const AnimateInView = ({ children, delay = 0, className = "", variants: customVariants, amount = 0.2 }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: amount });
    useEffect(() => { if (inView) controls.start("visible"); }, [controls, inView]);
    return (
        <motion.div ref={ref} initial="hidden" animate={controls} variants={customVariants || fadeIn} transition={{ delay }} className={className} >
            {children}
        </motion.div>
    );
};



// Plan Card Component (Enhanced)
const PlanCard = memo(({ plan, isRecommended = false }) => {
    const Icon = plan.icon;
    const cardControls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.3 });

    useEffect(() => { if (inView) cardControls.start("visible"); }, [inView, cardControls]);

    return (
        <motion.div
            ref={ref}
            variants={cardVariant} // Entry animation controlled by parent stagger
            className={`relative group overflow-hidden rounded-2xl border transition-shadow duration-300 h-full flex flex-col backdrop-blur-lg
                ${isRecommended ? 'border-indigo-600/60 bg-gray-900/70 shadow-indigo-900/20 hover:shadow-indigo-700/40' : 'border-gray-700/50 bg-gray-900/50 hover:shadow-indigo-900/20'}
                ${plan.borderColor || ''} shadow-lg hover:shadow-xl`}
            whileHover={{ y: -8, scale: 1.01, rotateX: 1, rotateY: -0.5 }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
        >
            <motion.div className="absolute -inset-[2px] group-hover:opacity-100 opacity-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-[18px] blur-sm transition-opacity duration-400" aria-hidden="true" />
            {isRecommended && (<div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-bl-lg rounded-tr-xl z-20"> Recommended </div>)}
            <div className="relative p-6 md:p-8 flex flex-col flex-grow z-10 bg-gray-900/60 rounded-2xl">
                <div className="flex items-center mb-5">
                    <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }} className={`mr-4 p-2.5 rounded-lg bg-gradient-to-br ${plan.buttonGradient} shadow-md`}>
                        <Icon size={24} className="text-white" />
                    </motion.div>
                    <h3 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight">{plan.name}</h3>
                </div>
                <div className="mb-5">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${plan.riskColor} border`}>{plan.riskLevel} Risk</span>
                    <p className="text-sm text-gray-300 leading-relaxed mt-3">{plan.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6 text-sm">
                    <div className="font-medium text-gray-400">{plan.primaryMetricLabel}</div>
                    <div className="font-semibold text-white text-right tabular-nums">{plan.primaryMetricValue}</div>
                    <div className="font-medium text-gray-400">{plan.secondaryMetricLabel}</div>
                    <div className="font-semibold text-white text-right tabular-nums">{plan.secondaryMetricValue}</div>
                </div>
                <motion.div className="space-y-2 mb-8 flex-grow" variants={staggerContainer} initial="hidden" animate={cardControls} >
                    {plan.features.map((feature, i) => (
                        <motion.div key={i} variants={listItemVariant} className="flex items-center text-xs text-gray-400">
                            <Check size={14} className="text-teal-400 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                        </motion.div>
                    ))}
                </motion.div>
                <div className="mt-auto pt-5">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link href={`/auth/signin`} className={`flex w-full items-center justify-center py-3 px-6 text-center rounded-lg font-medium text-white text-sm shadow-md transition-all duration-300 bg-gradient-to-r ${plan.buttonGradient} hover:shadow-lg hover:shadow-indigo-700/40 group`} >
                            <span>Select {plan.name}</span>
                            <ArrowRight size={16} className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
});
PlanCard.displayName = "PlanCard";

// Comparison Table Component
const ComparisonTable = ({ plans }) => {
    if (!plans || plans.length === 0) return null;
    const maxFeatures = Math.max(0, ...plans.map(p => p.features?.length || 0));
    return (
        <AnimateInView className="my-16 md:my-24" variants={fadeIn}>
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-white text-center mb-8 md:mb-12"> Strategy Comparison </h2>
            <div className="overflow-x-auto bg-gray-900/30 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-lg pb-4">
                <table className="w-full min-w-[800px] text-sm">
                    <thead>
                        <tr className="border-b border-gray-700/80">
                            <th className="p-4 py-5 text-left font-semibold text-gray-300 w-[25%] sticky left-0 bg-gray-900/50 backdrop-blur-md">Strategy Aspect</th>
                            {plans.map(plan => (<th key={plan.id} className="p-4 py-5 text-center font-semibold text-white border-l border-gray-800/60 min-w-[150px]"> {plan.name} {plan.recommended && <span className="block text-[10px] font-medium text-indigo-400 normal-case tracking-normal">(Recommended)</span>} </th>))}
                        </tr>
                    </thead>
                    {/* Fixed Whitespace Issue Here */}
                    <tbody className="divide-y divide-gray-800/60">{/* Start tbody directly */}
                        <tr>
                            <td className="p-4 font-medium text-gray-400 sticky left-0 bg-gray-900/50 backdrop-blur-md">Risk Profile</td>
                            {plans.map(plan => (<td key={plan.id} className={`p-4 text-center border-l border-gray-800/60 ${plan.riskColor} font-semibold`}>{plan.riskLevel}</td>))}
                        </tr><tr>
                            <td className="p-4 font-medium text-gray-400 sticky left-0 bg-gray-900/50 backdrop-blur-md">{plans[0]?.primaryMetricLabel || "Performance Target"}</td>
                            {plans.map(plan => (<td key={plan.id} className="p-4 text-center border-l border-gray-800/60 text-white tabular-nums">{plan.primaryMetricValue}</td>))}
                        </tr><tr>
                            <td className="p-4 font-medium text-gray-400 sticky left-0 bg-gray-900/50 backdrop-blur-md">{plans[0]?.secondaryMetricLabel || "Min. Investment"}</td>
                            {plans.map(plan => (<td key={plan.id} className="p-4 text-center border-l border-gray-800/60 text-white tabular-nums">{plan.secondaryMetricValue}</td>))}
                        </tr><tr>
                            <td colSpan={plans.length + 1} className="p-3 pt-5 font-semibold text-gray-400 text-xs uppercase tracking-wider sticky left-0 bg-gray-900/50 backdrop-blur-md">Key Strategies / Features</td>
                        </tr>{/* Place map immediately */}
                        {maxFeatures > 0 && Array.from({ length: maxFeatures }).map((_, featureIndex) => (
                            <tr key={`feature-${featureIndex}`}>
                                <td className="p-4 pl-6 font-medium text-gray-400 text-xs sticky left-0 bg-gray-900/50 backdrop-blur-md">{plans[0]?.features?.[featureIndex] || `Feature ${featureIndex + 1}`}</td>
                                {plans.map(plan => (<td key={plan.id} className="p-4 text-center border-l border-gray-800/60">{plan.features && plan.features.length > featureIndex ? (<Check size={18} className="text-teal-400 inline-block" />) : (<span className="text-gray-600">-</span>)}</td>))}
                            </tr>
                        ))}{/* Place next tr immediately */}
                        <tr>
                            <td className="p-4 sticky left-0 bg-gray-900/50 backdrop-blur-md"></td>
                            {plans.map(plan => (<td key={plan.id} className="p-4 text-center border-l border-gray-800/60"><Link href={`/auth/signin`} className={`inline-block py-2 px-5 text-center rounded-md font-medium text-white text-xs transition-all duration-300 bg-gradient-to-r ${plan.buttonGradient} hover:shadow-md hover:scale-105`}> Select Plan </Link></td>))}
                        </tr>{/* End last tr */}
                    </tbody>{/* End tbody immediately */}
                </table>
            </div>
        </AnimateInView>
    );
};

// Accordion Component Definition
const Accordion = ({ title, children, initiallyOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    return (
        <motion.div layout='size' transition={{ layout: { duration: 0.3, ease: "easeInOut" } }} className="bg-gradient-to-b my-2 from-gray-800/40 to-gray-900/60 backdrop-blur-md border border-gray-700/30 rounded-xl overflow-hidden mb-4 last:mb-0" >
            <button className="w-full p-5 md:p-6 flex justify-between items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-t-xl" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} >
                <h3 className="text-base sm:text-lg font-display font-semibold text-white">{title}</h3>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} > <ChevronDown size={20} className={`transition-colors ${isOpen ? 'text-indigo-400' : 'text-gray-500'}`} /> </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (<motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.3, ease: "easeInOut" }, opacity: { duration: 0.2, delay: 0.1 } } }} exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } } }} className="overflow-hidden" > <div className="px-5 md:px-6 pb-5 md:pb-6 pt-1 text-sm sm:text-base text-gray-400 leading-relaxed"> {children} </div> </motion.div>)}
            </AnimatePresence>
        </motion.div>
    );
};
Accordion.displayName = "Accordion";

// --- END: Helper Component Definitions ---


// --- START: Main Page Component ---
export default function InvestmentPlansPage() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);

    // Updated Plan Data for Bots
    const plansData = [
        { id: "stable-grid", name: "Stable Grid", icon: Table, riskLevel: "Low-Medium", riskColor: "text-blue-300 bg-blue-900/30 border-blue-700/50", description: "Automated grid trading bots designed to profit from volatility within defined ranges, primarily on stable pairs or large-cap assets like BTC & ETH.", primaryMetricLabel: "Proj. Monthly Return:", primaryMetricValue: "0.8 - 1.5%", secondaryMetricLabel: "Min. Investment:", secondaryMetricValue: "$500", features: ["Automated Grid Setup", "BTC/USDT & ETH/USDT Pairs", "Volatility Filters Applied", "Auto-Compounding Option", "Ideal for Lower Volatility"], buttonGradient: "from-blue-600 to-indigo-600", borderColor: "hover:border-blue-500/60", },
        { id: "momentum-mix", name: "Momentum Mix", icon: BarChartHorizontalBig, riskLevel: "Medium", riskColor: "text-purple-300 bg-purple-900/30 border-purple-700/50", description: "A balanced portfolio of automated strategies, including trend-following and DCA bots across major assets, optimized by AI market analysis.", primaryMetricLabel: "Target Monthly Return:", primaryMetricValue: "1.5 - 3.5%", secondaryMetricLabel: "Min. Investment:", secondaryMetricValue: "$2,500", features: ["Mix of Grid/DCA/Trend Bots", "Major Caps + Select Altcoins", "AI Market Condition Filters", "Dynamic Portfolio Rebalancing", "Balanced Risk/Reward"], buttonGradient: "from-purple-600 to-indigo-600", borderColor: "hover:border-purple-500/60", recommended: true },
        { id: "alpha-bot-engine", name: "Alpha Bot Engine", icon: Zap, riskLevel: "High", riskColor: "text-fuchsia-400 bg-fuchsia-900/30 border-fuchsia-700/50", description: "Leverages higher-frequency strategies, potential cross-exchange arbitrage, and AI-driven signals on more volatile pairs for potentially higher returns.", primaryMetricLabel: "Target Monthly Return:", primaryMetricValue: "4%+", secondaryMetricLabel: "Min. Investment:", secondaryMetricValue: "$10,000", features: ["Arbitrage & HFT Elements", "AI Signal Trading Integration", "Volatile Pair Access", "Active Strategy Management", "Higher Risk / Return Potential"], buttonGradient: "from-fuchsia-600 to-purple-600", borderColor: "hover:border-fuchsia-500/60", }
    ];
    // FAQ Data
    const faqData = [
        { q: "How do the trading bots handle market crashes?", a: "Our bots incorporate multiple risk management protocols, including dynamic stop-losses, volatility filters, and AI-driven market condition analysis... protect capital based on pre-set parameters and plan risk levels." },
        { q: "Can I customize the parameters for my trading bot?", a: "Standard plans use optimized settings... customization is reserved for our 'Bespoke Solutions' tier..." },
        { q: "What exchanges does StableWealth operate on?", a: "We securely connect to multiple major centralized and decentralized exchanges..." },
        { q: "How is the AI used in the strategies?", a: "Our proprietary AI analyzes vast amounts of market data... within certain strategies like 'Momentum Mix' and 'DeFi Alpha'." },
    ];


    if (!isClient) { return <div className="bg-[#080A1A] min-h-screen"></div>; }
    const AnimatedBackground = () => {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10"> {/* Keep base container */}
                {/* Blob 1 */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-gradient-to-br from-indigo-900/40 to-purple-900/30 rounded-full " // Gradient added
                    animate={{
                        x: [-30, 10, -30], // Slow horizontal drift
                        y: [-10, 25, -10], // Slow vertical drift
                        scale: [1, 1.15, 1], // Gentle pulse
                        opacity: [0.4, 0.6, 0.4], // Opacity pulse
                        rotate: [0, 15, 0] // Subtle rotation
                    }}
                    transition={{
                        duration: 35, // Longer duration for slower effect
                        repeat: Infinity,
                        repeatType: 'mirror',
                        ease: "easeInOut"
                    }}
                />
                {/* Blob 2 */}
                <motion.div
                    className="absolute top-3/4 right-1/3 w-56 h-56 md:w-64 md:h-64 bg-gradient-to-tl from-purple-900/40 to-fuchsia-900/30 rounded-full  " // Different gradient & size
                    animate={{
                        x: [20, -15, 20],
                        y: [30, -5, 30],
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.75, 0.5],
                        rotate: [0, -10, 0]
                    }}
                    transition={{
                        duration: 40, // Different duration
                        repeat: Infinity,
                        repeatType: 'mirror',
                        ease: "easeInOut",
                        delay: 3 // Start slightly later
                    }}
                />
                {/* Blob 3 */}
                <motion.div
                    className="absolute bottom-1/4 left-1/3 w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-blue-900/50 to-teal-900/30 rounded-full  " // Another variation
                    animate={{
                        x: [-10, 25, -10],
                        y: [-20, 15, -20],
                        scale: [1, 1.05, 1],
                        opacity: [0.6, 0.8, 0.6],
                        rotate: [5, -5, 5]
                    }}
                    transition={{
                        duration: 30, // Different duration
                        repeat: Infinity,
                        repeatType: 'mirror',
                        ease: "easeInOut",
                        delay: 1.5 // Different delay
                    }}
                />
            </div>
        );
    };
    AnimatedBackground.displayName = "AnimatedBackground";

    return (
        <div className="bg-[#080A1A] text-gray-200 h-full font-accent overflow-x-hidden relative isolate">
            <AnimatedBackground />

            {/* --- Page Hero Section --- */}
            <motion.section className="relative pt-40 pb-20 md:pt-48 md:pb-28 text-center overflow-hidden border-b border-gray-800/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-4 text-white" variants={staggerContainer} initial="hidden" animate="visible" >
                        <motion.span variants={fadeIn} transition={{ delay: 0.1 }}>Automated Trading</motion.span>
                        <motion.span variants={fadeIn} transition={{ delay: 0.2 }} className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500 mt-1 md:mt-2">Strategies</motion.span>
                    </motion.h1>
                    <motion.p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mt-5" variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.3 }} > Explore our AI-enhanced automated trading plans, designed to navigate crypto markets and optimize performance based on your risk profile. </motion.p>
                </div>
            </motion.section>

            {/* --- Plans Grid Section --- */}
            <section className="py-16 md:py-24 relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {plansData && plansData.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"   >
                            {plansData.map((plan) => (<PlanCard key={plan.id} plan={plan} isRecommended={plan.recommended} />))}
                            <motion.div variants={cardVariant} className="group relative overflow-hidden rounded-2xl border border-dashed border-gray-700/80 bg-gray-900/20 flex flex-col items-center justify-center text-center p-8 min-h-[400px] md:min-h-[500px] hover:border-indigo-500/70 hover:bg-gray-800/40 transition-all duration-300" whileHover={{ y: -8, scale: 1.01 }} transition={{ type: "spring", stiffness: 250, damping: 15 }} > <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/50"><Settings size={28} className="w-8 h-8 text-gray-400 group-hover:text-indigo-400 transition-colors" /></div> <h3 className="text-xl font-display font-semibold text-white mb-3">Bespoke Solutions</h3> <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-grow">Custom bot strategies, dedicated support, and tailored risk parameters for institutional or high-net-worth clients.</p> <Link href="/contact?subject=CustomBotPlan" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 group-hover:underline inline-flex items-center"> Request Consultation <ArrowRight className="inline w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /> </Link> </motion.div>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Comparison Table Section --- */}
            {plansData && plansData.length > 0 && (
                <section className="py-16 md:py-24 bg-[#0d1123] border-y border-gray-800/50 relative z-10">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8"> <ComparisonTable plans={plansData} /> </div>
                </section>
            )}

            {/* --- How it Works Link --- */}
            <section className="py-16 text-center relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimateInView> <p className="text-gray-400 mb-4">Understand the technology behind the strategies.</p> <Link href="/how-it-works" className="text-lg font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center group"> See How Our Bots Operate <ChevronRight size={20} className="ml-1.5 group-hover:translate-x-1 transition-transform" /> </Link> </AnimateInView>
                </div>
            </section>

            {/* --- FAQ Section --- */}
            <section className="py-16 md:py-24 border-t border-gray-800/50 relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimateInView variants={fadeIn} className="max-w-3xl mx-auto text-center mb-12 md:mb-16"> <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-white mb-4">Bot Trading FAQs</h2> <p className="text-gray-400">Your questions about automated investing, answered.</p> </AnimateInView>
                    {faqData && faqData.length > 0 && (
                        <motion.div className="max-w-3xl my-2 mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} >
                            {faqData.map((faq, index) => (<motion.div key={index} variants={fadeIn}><Accordion title={faq.q} initiallyOpen={index < 1}>{faq.a}</Accordion></motion.div>))}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* --- Disclaimer --- */}
            <section className="py-12 border-t border-gray-800/50 relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8"> <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto"> Disclaimer: Automated trading involves significant risk... </p> </div>
            </section>

        </div>
    );
}
// --- END: Main Page Component ---