// ./app/investment/performance/page.jsx (COMPLETE CODE - V12 - More Sophisticated Chart)
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence, useAnimation, useInView, animate, useMotionValue, useTransform } from 'framer-motion';
// Icons remain the same
import { BarChart3, Zap, Shield, ArrowRight, Table, TrendingUp, Percent, Target, Scale, CalendarDays, CheckCircle, FileText, ExternalLink, BarChartHorizontalBig, Wallet, Activity, TrendingDown, ArrowUpRight, ArrowDownRight, Layers, Info } from 'lucide-react';
import Link from 'next/link';

// --- Animation Variants --- (Keep V10 variants)
const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };
const cardVariant = { hidden: { opacity: 0, scale: 0.97, y: 30 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } } };

// --- Helper Components ---
const AnimateInView = ({ children, delay = 0, className = "", variants: customVariants, amount = 0.2 }) => { /* ... Keep V11 ... */
    const controls = useAnimation(); const ref = useRef(null); const inView = useInView(ref, { once: true, amount: amount }); useEffect(() => { if (inView) controls.start("visible"); }, [controls, inView]); return (<motion.div ref={ref} initial="hidden" animate={controls} variants={customVariants || fadeIn} transition={{ delay }} className={className}>{children}</motion.div>);
};
AnimateInView.displayName = "AnimateInView";

const AnimatedBackground = () => { /* ... Keep V11 ... */
    return (<div className="absolute inset-0 overflow-hidden pointer-events-none -z-10"><motion.div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-900/5 to-purple-900/5 rounded-full " animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} /><motion.div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-900/30 to-teal-900/20 rounded-full blur-[100px]" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }} /></div>);
};
AnimatedBackground.displayName = "AnimatedBackground";

const AnimatedNumber = memo(({ value, className, prefix = "", suffix = "", decimals = 0, highlightPositive = false }) => { /* ... Keep V11 ... */
    const count = useMotionValue(0); const controls = useAnimation(); const ref = useRef(null); const inView = useInView(ref, { once: true, amount: 0.5 }); const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0; const displayValue = useTransform(count, latest => { const formatted = latest.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); return highlightPositive && latest > 0 ? `+${formatted}` : formatted; }); useEffect(() => { if (inView) { const animControls = animate(count, numValue, { duration: 1.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }); return animControls.stop; } }, [inView, count, numValue]); const textColorClass = highlightPositive ? (numValue > 0 ? 'text-teal-400' : numValue < 0 ? 'text-red-400' : 'text-white') : 'text-white'; return (<span ref={ref} className={`${className} ${textColorClass} tabular-nums`}>{prefix}<motion.span>{displayValue}</motion.span>{suffix}</span>);
});
AnimatedNumber.displayName = "AnimatedNumber";


// Placeholder Chart Component (V12 - MORE SOPHISTICATED VISUALS)
const PlaceholderChart = memo(({ positive = true, id, events = [], timeRange = '1Y' }) => {
    const pathData = positive ? "M0 80 Q 50 20, 100 40 T 200 30 Q 250 10, 300 50 T 400 40" : "M0 20 Q 50 80, 100 60 T 200 70 Q 250 90, 300 50 T 400 60";
    const gradientId = `chartGrad-${id}`;
    const areaGradientId = `chartAreaGrad-${id}`;
    const lineGlowFilterId = `lineGlow-${id}`;
    const gridPatternId = `gridPattern-${id}`;
    const stopColor1 = positive ? "#2DD4BF" : "#F87171"; // Teal-400 / Red-400
    const stopColor2 = positive ? "#38BDF8" : "#F472B6"; // Sky-400 / Pink-400

    // Placeholder Axis Labels based on Time Range
    const getXAxisLabels = (range) => {
        const now = new Date(); // Note: Using client-side date
        const currentYear = now.getFullYear();
        const currentMonth = now.toLocaleString('default', { month: 'short' });
        switch (range) {
            case '1M': return [`Start`, `${currentMonth} ${Math.floor(now.getDate() / 2)}`, `Now`];
            case '3M': return [`-3M`, `-1.5M`, `Now`];
            case '6M': return [`-6M`, `-3M`, `Now`];
            case '1Y': return [`${currentMonth} '${currentYear - 1}`, `-6M`, `Now`];
            case 'ALL': return [`Start`, `Mid`, `Now`];
            default: return ['Start', 'Mid', 'End'];
        }
    };
    const xAxisLabels = getXAxisLabels(timeRange);
    const yAxisLabels = positive ? ["10M", "5M", "0"] : ["0", "5M", "10M"]; // Simplified Y labels

    // Rough Y position estimate (same as V11)
    const estimateY = (x) => { /* ... keep V11 estimateY ... */ if (positive) { if (x < 100) return 80 - (x / 100) * 40; if (x < 200) return 40 - ((x - 100) / 100) * 10; if (x < 300) return 30 + ((x - 200) / 100) * 20; return 50 - ((x - 300) / 100) * 10; } else { if (x < 100) return 20 + (x / 100) * 40; if (x < 200) return 60 + ((x - 100) / 100) * 10; if (x < 300) return 70 - ((x - 200) / 100) * 20; return 50 + ((x - 300) / 100) * 10; } };

    return (
        <div className="relative w-full h-full overflow-hidden group"> {/* Add group for potential hover effects */}
            {/* Shimmer Overlay */}
            <motion.div className="absolute inset-0 z-20 pointer-events-none" initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 1.0, delay: 1.5, ease: "linear" }}>
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </motion.div>

            {/* SVG Container */}
            <svg viewBox="0 0 430 115" className="absolute inset-0 w-full h-full" preserveAspectRatio="none"> {/* Adjusted viewBox */}
                {/* DEFINITIONS */}
                <defs>
                    {/* Gradients */}
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%"> <stop offset="0%" stopColor={stopColor1} /> <stop offset="100%" stopColor={stopColor2} /> </linearGradient>
                    <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%"> <stop offset="0%" stopColor={stopColor1} stopOpacity="0.20" /> <stop offset="100%" stopColor={stopColor2} stopOpacity="0.01" /> </linearGradient>
                    {/* Line Glow Filter */}
                    <filter id={lineGlowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    {/* Grid Pattern */}
                    <pattern id={gridPatternId} width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(100, 116, 139, 0.07)" strokeWidth="0.5" />
                    </pattern>
                </defs>

                {/* Y-AXIS */}
                <g className="text-[9px] fill-gray-500 font-medium" transform="translate(0, 5)">
                    {/* Y-Axis Labels & Ticks */}
                    {[10, 50, 90].map((yPos, i) => (
                        <g key={`y-axis-${i}`}>
                            <text x="20" y={yPos} dy=".3em" textAnchor="end">{yAxisLabels[i]}</text>
                            <line x1="25" y1={yPos} x2="30" y2={yPos} stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
                        </g>
                    ))}
                    {/* Y-Axis Line */}
                    <line x1="30" y1="0" x2="30" y2="100" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
                </g>

                {/* X-AXIS */}
                <g className="text-[9px] fill-gray-500 font-medium" transform="translate(30, 105)">
                    {/* X-Axis Labels & Ticks */}
                    {[0, 200, 400].map((xPos, i) => (
                        <g key={`x-axis-${i}`}>
                            <text x={xPos} y="10" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>{xAxisLabels[i]}</text>
                            <line x1={xPos} y1="0" x2={xPos} y2="-5" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
                        </g>
                    ))}
                    {/* X-Axis Line */}
                    <line x1="0" y1="0" x2="400" y2="0" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
                </g>

                {/* CHART AREA */}
                <g transform="translate(30, 5)">
                    {/* Background Grid Pattern */}
                    <rect x="0" y="0" width="400" height="100" fill={`url(#${gridPatternId})`} opacity="0.5" />

                    {/* Main Chart Line and Area */}
                    <motion.path d={pathData} fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.5" strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6, ease: [0.25, 1, 0.5, 1], delay: 0.3 }}
                        filter={`url(#${lineGlowFilterId})`} // Apply glow filter
                    />
                    <motion.path d={`${pathData} L 400 100 L 0 100 Z`} fill={`url(#${areaGradientId})`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.5, ease: "easeInOut" }}
                    />

                    {/* Event Markers */}
                    {events.map((event, index) => { /* ... keep V11 event marker rendering ... */
                        const eventY = estimateY(event.x); return (<g key={index} className="cursor-pointer group" transform={`translate(${event.x}, ${eventY})`}> <motion.circle r="4" fill={stopColor1} stroke="rgba(6, 8, 24, 0.7)" strokeWidth="1.5" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.0 + index * 0.2, duration: 0.4, ease: "backOut" }} /> <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" transform="translate(8, -8)"> <rect x="-3" y="-12" width={event.label.length * 5 + 16} height="18" rx="3" fill="rgba(10, 12, 31, 0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" /> <text x="5" y="0" dy="-0.1em" fontSize="8" fill="#E0E0E0">{event.label}</text> </g> </g>);
                    })}
                </g>
            </svg>
        </div>
    );
});
PlaceholderChart.displayName = "PlaceholderChart";

// Simple Legend Component
const ChartLegend = memo(({ data }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-3">
            {data.map((item, index) => (
                <div key={index} className="flex items-center text-xs">
                    <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-400">{item.label}</span>
                </div>
            ))}
        </div>
    );
});
ChartLegend.displayName = "ChartLegend";


// Performance Card Component (Keep V10 refined definition)
const PerformanceCard = memo(({ plan }) => { /* ... Keep V10 ... */ const Icon = plan.icon; const actualApyValue = parseFloat(String(plan.actualAPY).replace(/[^0-9.-]/g, '')) || 0; const isPositivePerformance = actualApyValue >= 0; return (<motion.div variants={cardVariant} className="relative group overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-gray-900/60 to-black/40 backdrop-blur-lg shadow-lg flex flex-col h-full transition-all duration-300 ease-out" whileHover={{ y: -5, scale: 1.01, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)" }} transition={{ type: "spring", stiffness: 400, damping: 25 }} > <div className="absolute -inset-px opacity-0 group-hover:opacity-80 transition-opacity duration-300 rounded-xl pointer-events-none bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div> <div className="relative p-6 flex flex-col flex-grow z-10"> <div className="flex items-center justify-between mb-5"> <div className="flex items-center space-x-3"> <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.buttonGradient} opacity-90 shadow-inner shadow-black/20`}> <Icon size={20} className="text-white" /> </div> <h3 className="text-lg font-display font-medium text-gray-100">{plan.name}</h3> </div> <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${plan.riskColor} bg-white/5 border border-current/50`}>{plan.riskLevel} Risk</span> </div> <div className="mb-6 h-28 bg-black/20 rounded-lg border border-white/5 overflow-hidden relative ring-1 ring-inset ring-white/10 shadow-inner"> <PlaceholderChart positive={isPositivePerformance} id={plan.id} /> </div> <div className="space-y-3.5 text-sm mb-6"> <div className="flex items-center justify-between"> <span className="text-gray-400 flex items-center text-xs uppercase tracking-wider"><Percent size={13} className="mr-1.5 opacity-60" />Return (1Y Est)</span> <AnimatedNumber value={plan.actualAPY || plan.targetAPY || 0} suffix="%" decimals={1} highlightPositive={true} className="font-semibold text-base" /> </div> <div className="flex items-center justify-between"> <span className="text-gray-400 flex items-center text-xs uppercase tracking-wider"><TrendingDown size={13} className="mr-1.5 opacity-60" />Max Drawdown</span> <span className="font-medium text-gray-200 tabular-nums">{plan.maxDrawdown || '< 15%'}</span> </div> <div className="flex items-center justify-between"> <span className="text-gray-400 flex items-center text-xs uppercase tracking-wider"><Scale size={13} className="mr-1.5 opacity-60" />Sharpe Ratio</span> <span className="font-medium text-gray-200 tabular-nums">{plan.sharpeRatio || '> 1.2'}</span> </div> </div> <div className="mt-auto pt-4 border-t border-white/10"> <Link href={`/investment/plans#plan-${plan.id}`} aria-label={`View details for ${plan.name} plan`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium inline-flex items-center group transition-colors duration-200 group"> View Plan Details <span className="ml-1.5 transition-transform duration-300 ease-out group-hover:translate-x-1"> <ArrowRight size={14} /> </span> </Link> </div> </div> </motion.div>); });
PerformanceCard.displayName = "PerformanceCard";


// --- Main Page Component ---
export default function PerformancePage() {
    const [isClient, setIsClient] = useState(false);
    const [timeRange, setTimeRange] = useState('1Y');
    const [chartView, setChartView] = useState('TVL');
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [tooltipData, setTooltipData] = useState({ x: 0, y: 0, value: null, date: null });
    const chartContainerRef = useRef(null);

    useEffect(() => { setIsClient(true); }, []);

    // --- Placeholder Data & Formatting --- (Keep V11 data)
    const plansPerformanceData = [ /* ... Keep V11 ... */ { id: "stable-yield", name: "Stable Yield", icon: Shield, riskLevel: "Low", riskColor: "text-blue-300", buttonGradient: "from-blue-700/80 to-indigo-800/80", actualAPY: "7.8", maxDrawdown: "< 5%", sharpeRatio: "1.8" }, { id: "balanced-growth", name: "Balanced Growth", icon: BarChartHorizontalBig, riskLevel: "Medium", riskColor: "text-purple-300", buttonGradient: "from-purple-700/80 to-indigo-800/80", recommended: true, actualAPY: "16.2", maxDrawdown: "< 18%", sharpeRatio: "1.5" }, { id: "alpha-bot-engine", name: "Alpha Bot Engine", icon: Zap, riskLevel: "High", riskColor: "text-fuchsia-300", buttonGradient: "from-fuchsia-700/80 to-purple-800/80", actualAPY: "31.5", maxDrawdown: "< 25%", sharpeRatio: "1.3" }];
    const overallStats = { tvl: 528.8 * 1e6, avgReturn1Y: 17.3, activeStrategies: 205 };
    const formatTvl = (value) => { /* ... Keep V11 ... */ if (value >= 1e9) return { value: value / 1e9, suffix: 'B+' }; if (value >= 1e6) return { value: value / 1e6, suffix: 'M+' }; if (value >= 1e3) return { value: value / 1e3, suffix: 'K+' }; return { value: value, suffix: '' }; };
    const tvlFormatted = formatTvl(overallStats.tvl);
    const chartMetrics = { /* ... Keep V11 ... */ '1M': { value: 2.85 * 1e6, change: 1.8, positive: true }, '3M': { value: 2.8 * 1e6, change: 5.5, positive: true }, '6M': { value: 2.7 * 1e6, change: 10.2, positive: true }, '1Y': { value: 2.5 * 1e6, change: 17.3, positive: true }, 'ALL': { value: 2.0 * 1e6, change: 40.0, positive: true } };
    const currentChartMetric = chartMetrics[timeRange] || chartMetrics['1Y'];
    const currentChartValueFormatted = formatTvl(currentChartMetric.value * (1 + currentChartMetric.change / 100));
    const chartEvents = [{ x: 150, label: "Strategy Update" }, { x: 320, label: "Market Volatility Spike" }];
    // Legend Data
    const legendData = [
        { label: chartView, color: currentChartMetric.positive ? "#2DD4BF" : "#F87171" }
        // Add more items here if simulating multiple lines later
    ];

    // --- Tooltip Logic --- (Keep V11 logic)
    const handleMouseMove = (event) => { /* ... Keep V11 handleMouseMove ... */ if (!chartContainerRef.current) return; const rect = chartContainerRef.current.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top; const clampedX = Math.min(Math.max(x, 30), rect.width - 30); const clampedY = Math.min(Math.max(y, 10), rect.height - 30); const date = new Date(Date.now() - (1 - x / rect.width) * 31536000000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); const value = formatTvl(currentChartMetric.value * (1 + (x / rect.width - 0.5) * currentChartMetric.change / 50)); setTooltipData({ x: clampedX, y: clampedY, value: `${value.value.toFixed(1)}${value.suffix}`, date }); };

    if (!isClient) { return <div className="bg-[#060818] min-h-screen"></div>; }

    return (
        <div className="bg-[#060818] py-[2rem] text-gray-300 font-sans leading-normal overflow-x-hidden relative isolate">
            <div className="fixed inset-0 bg-[url('/subtle-noise.png')] opacity-[0.03] pointer-events-none z-[-1]"></div>
            <AnimatedBackground />

            {/* --- Hero Section --- (Keep V11 refined section) */}
            <motion.section /* ... Keep V11 ... */ className="relative pt-40 pb-24 md:pt-48 md:pb-32 text-center overflow-hidden border-b border-white/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: "easeInOut" }} > <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"> <motion.h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display font-semibold tracking-tighter mb-5 text-gray-100" variants={staggerContainer} initial="hidden" animate="visible" > <motion.span variants={fadeIn} className="inline-block mr-2 md:mr-3">Platform</motion.span> <motion.span variants={fadeIn} transition={{ delay: 0.1 }} className="inline-block">Performance</motion.span> <motion.span variants={fadeIn} transition={{ delay: 0.2 }} className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-400 mt-1 md:mt-2 brightness-105"> Data-Driven Results </motion.span> </motion.h1> <motion.p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto mt-6 leading-relaxed" variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.3 }} > Explore historical performance metrics and gain insights into our strategies through transparent, data-driven reporting. </motion.p> <motion.div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ delay: 0.4 }} > {[{ icon: Wallet, label: "Total Value Locked", value: tvlFormatted.value, prefix: "$", suffix: tvlFormatted.suffix, decimals: 1, color: "text-indigo-400", hoverBorder: "hover:border-indigo-500/30" }, { icon: TrendingUp, label: "Avg. Platform Return (1Y)", value: overallStats.avgReturn1Y, suffix: "%", decimals: 1, highlight: true, color: "text-teal-400", hoverBorder: "hover:border-teal-500/30" }, { icon: Activity, label: "Active Strategies", value: overallStats.activeStrategies, color: "text-purple-400", hoverBorder: "hover:border-purple-500/30" }].map((stat, index) => (<motion.div key={stat.label} variants={fadeIn} className={`group bg-gradient-to-br from-gray-900/30 via-black/20 to-transparent backdrop-blur-sm rounded-xl p-5 border border-white/10 ${stat.hoverBorder} transition-colors duration-300 flex items-center space-x-4 min-h-[90px] ${index === 2 ? 'sm:col-span-3 lg:col-span-1' : ''}`} > <stat.icon size={26} className={`${stat.color} flex-shrink-0 opacity-90`} /> <div> <p className="text-xs text-gray-500 mb-0.5 uppercase tracking-wider">{stat.label}</p> <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} highlightPositive={stat.highlight} className="text-xl md:text-2xl font-semibold text-gray-100" /> </div> </motion.div>))} </motion.div> </div> </motion.section>

         

            {/* --- Plans Performance Section --- (Keep V11 refined Card) */}
            <section className="py-16 md:py-24 relative z-10 bg-gradient-to-b from-[#0A0C1F] to-[#060818] border-y border-white/10"> <div className="container mx-auto px-4 sm:px-6 lg:px-8"> <AnimateInView className="text-center mb-12 md:mb-16 max-w-2xl mx-auto"> <h2 className="text-2xl md:text-3xl font-display font-medium text-gray-100 mb-3 tracking-tight"> Strategy Performance Details </h2> <p className="text-base text-gray-400 leading-relaxed"> View key performance indicators for each distinct investment strategy. </p> </AnimateInView> {plansPerformanceData && plansPerformanceData.length > 0 && (<motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} > {plansPerformanceData.map((plan) => (<PerformanceCard key={plan.id} plan={plan} />))} </motion.div>)} </div> </section>

            {/* --- Transparency Section --- (Keep V11 refined section) */}
            <section className="py-16 md:py-24 relative z-10"> <div className="container mx-auto px-4 sm:px-6 lg:px-8"> <AnimateInView className="max-w-4xl mx-auto md:grid md:grid-cols-12 md:gap-12 md:items-center"> <div className="md:col-span-5 text-center md:text-left mb-8 md:mb-0"> <div className="inline-flex p-3 bg-gradient-to-br from-teal-800/40 to-sky-800/30 rounded-full border border-teal-400/20 mb-5 shadow-lg ring-1 ring-inset ring-teal-400/20"> <CheckCircle size={28} className="text-teal-300" /> </div> <h2 className="text-2xl md:text-3xl font-display font-medium text-gray-100 tracking-tight"> Our Commitment to Transparency </h2> </div> <div className="md:col-span-7 text-center md:text-left"> <p className="text-base text-gray-400 leading-relaxed mb-8"> We uphold transparency through rigorous data tracking, third-party smart contract audits, and clear communication about our strategies and operational security. Explore our documentation below. </p> <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4"> <Link href="/security" className="group inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-indigo-200 bg-gradient-to-r from-indigo-600/80 to-blue-700/80 hover:from-indigo-600 hover:to-blue-700 border border-indigo-500/50 rounded-lg shadow-sm transition-all duration-300 ease-out hover:shadow-indigo-500/30 hover:scale-[1.02]"> Security Practices <span className="ml-1.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5"> <ArrowRight size={14} /> </span> </Link> <Link href="/audits" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg shadow-sm transition-colors duration-300 ease-out hover:border-white/20 hover:scale-[1.02]"> View Audit Reports <ExternalLink size={14} className="ml-1.5 opacity-70" /> </Link> </div> </div> </AnimateInView> </div> </section>

            {/* --- Disclaimer --- (Keep V11 section) */}
            <section className="py-12 md:py-16 border-t border-white/10 relative z-10"> <div className="container mx-auto px-4 sm:px-6 lg:px-8"> <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed"> <span className="font-semibold text-gray-400">Disclaimer:</span> Past performance is not indicative of future results... [rest of disclaimer] </p> </div> </section>

            {/* Keyframes for shimmer */}
            <style jsx global>{` /* ...Keep V11 styles... */ @keyframes shimmer { 100% { transform: translateX(100%); } } .animate-shimmer { animation: shimmer 2s infinite linear; } `}</style>
        </div>
    );
}