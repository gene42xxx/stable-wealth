// ./app/investment/how-it-works/page.jsx (Example file path)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
// Import relevant icons
import { UserPlus, LogIn, Banknote, Settings, Bot, AreaChart, ShieldCheck, Zap, BarChartBig, ChevronRight, LifeBuoy, ArrowRight, ListChecks, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// --- Animation Variants (Consistent with other pages) ---
const fadeIn = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } } // Slightly slower stagger
};
const cardVariant = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

// --- Helper Components ---

// AnimateInView Hook Component
const AnimateInView = ({ children, delay = 0, className = "", variants: customVariants, amount = 0.2 }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: amount });
    useEffect(() => { if (inView) controls.start("visible"); }, [controls, inView]);
    return (<motion.div ref={ref} initial="hidden" animate={controls} variants={customVariants || fadeIn} transition={{ delay }} className={className} > {children} </motion.div>);
};

// Animated Background Component (Assuming definition exists - kept simple here)
const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-indigo-900/10 via-transparent to-transparent opacity-40 " animate={{ x: [-100, 100, -100] }} transition={{ duration: 30, repeat: Infinity, ease: "linear", repeatType: 'mirror' }}></motion.div>
        <motion.div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-tl from-purple-900/10 via-transparent to-transparent opacity-40 " animate={{ x: [100, -100, 100] }} transition={{ duration: 35, repeat: Infinity, ease: "linear", repeatType: 'mirror' }}></motion.div>
    </div>
);

// Process Step Component
const ProcessStep = ({ number, icon: Icon, title, description, isLast = false }) => {
    return (
        <motion.div
            variants={fadeIn} // Use fadeIn variant from parent stagger
            className="relative flex items-start pb-10 md:pb-16"
        >
            {/* Connecting Line (except for last item) */}
            {!isLast && (
                <div className="absolute left-6 top-12 -bottom-4 w-px bg-gradient-to-b from-indigo-500/30 via-blue-500/30 to-purple-500/30" aria-hidden="true"></div>
            )}
            {/* Numbered Circle */}
            <motion.div
                className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/50 flex items-center justify-center mr-5 md:mr-6 relative z-10"
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
                <Icon className="w-5 h-5 text-indigo-300" />
                {/* <span className="font-display font-semibold text-indigo-300">{number}</span> */}
            </motion.div>
            {/* Text Content */}
            <div className="flex-grow">
                <h3 className="text-lg md:text-xl font-display font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
};

// Technology Pillar Card
const TechPillarCard = ({ icon: Icon, title, description }) => {
    return (
        <motion.div
            variants={cardVariant} // Reuse card variant for consistency
            className="bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 text-center h-full flex flex-col items-center hover:bg-gray-800/60 transition-colors duration-200"
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <div className="p-3 mb-4 rounded-lg bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 inline-block">
                <Icon className="w-7 h-7 text-indigo-300" />
            </div>
            <h4 className="text-lg font-display font-semibold text-white mb-2">{title}</h4>
            <p className="text-xs text-gray-400 leading-normal flex-grow">{description}</p>
        </motion.div>
    );
};


// --- Main How It Works Page Component ---
export default function HowItWorksPage() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);

    const processSteps = [
        { icon: UserPlus, title: "1. Secure Sign-Up & Verification", description: "Create your account using our secure onboarding process. We adhere to strict KYC/AML standards to ensure platform integrity and compliance." },
        { icon: Banknote, title: "2. Fund Your Account", description: "Deposit USDT easily via supported networks (e.g., ERC20, TRC20, BEP20). Your funds are held in segregated, insured custodian accounts or deployed directly into audited smart contracts." },
        { icon: ListChecks, title: "3. Select Your Strategy", description: "Choose an investment plan (Stable Grid, Momentum Mix, Alpha Bot Engine) that aligns with your risk tolerance and financial goals. Explore detailed performance metrics for each." },
        { icon: Bot, title: "4. Activate Automation", description: "Once funded and a plan selected, our sophisticated trading bots, powered by proprietary algorithms and AI insights (where applicable), begin executing trades automatically according to the chosen strategy." },
        { icon: AreaChart, title: "5. Monitor Performance 24/7", description: "Track your portfolio's growth, view detailed performance analytics, and monitor bot activity through your personalized, real-time dashboard." },
        { icon: CheckCircle, title: "6. Withdraw Anytime", description: "Access your capital and profits with our straightforward withdrawal process. Funds are securely transferred back to your designated wallet." },
    ];

    const techPillars = [
        { icon: Settings, title: "Automated Execution", description: "High-speed, low-latency trade execution across multiple exchanges using secure API connections." },
        { icon: Zap, title: "AI & Data Analysis", description: "Proprietary AI models analyze market data, sentiment, and on-chain metrics to inform strategy adjustments and risk management (Alpha & Momentum plans)." },
        { icon: ShieldCheck, title: "Risk Management Engine", description: "Integrated protocols monitor volatility, manage drawdowns, and execute stop-losses based on predefined plan parameters." },
        { icon: BarChartBig, title: "Performance Tracking", description: "Real-time calculation and transparent display of key performance indicators (KPIs) and portfolio value." },
    ];


    // Server Placeholder
    if (!isClient) { return <div className="bg-[#080A1A] min-h-screen"></div>; }

    return (
        <div className="bg-[#080A1A] text-gray-200 font-accent overflow-x-hidden relative isolate">
            <AnimatedBackground />

            {/* --- Page Hero Section --- */}
            <motion.section className="relative pt-40 pb-20 md:pt-48 md:pb-28 text-center overflow-hidden border-b border-gray-800/50" initial="hidden" animate="visible" variants={staggerContainer} >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-4 text-white" >
                        Intelligent Investing, <br className="hidden sm:block" />
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500 mt-1 md:mt-2">Simplified</span>
                    </motion.h1>
                    <motion.p variants={fadeIn} transition={{ delay: 0.1 }} className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mt-5" >
                        Understand the seamless process behind StableWealth's automated strategies – from funding to performance tracking.
                    </motion.p>
                </div>
            </motion.section>

            {/* --- Step-by-Step Process Section --- */}
            <section className="py-16 md:py-24 relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimateInView className="max-w-3xl mx-auto">
                        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
                            {processSteps.map((step, index) => (
                                <ProcessStep
                                    key={index}
                                    number={index + 1}
                                    icon={step.icon}
                                    title={step.title}
                                    description={step.description}
                                    isLast={index === processSteps.length - 1}
                                />
                            ))}
                        </motion.div>
                    </AnimateInView>
                </div>
            </section>

            {/* --- Underlying Technology Section --- */}
            <section className="py-16 md:py-24 bg-[#0d1123] border-y border-gray-800/50 relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimateInView variants={fadeIn} className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-white mb-4">Powered by Advanced Technology</h2>
                        <p className="text-gray-400 text-sm md:text-base">Our platform integrates sophisticated components to deliver secure and optimized performance across the DeFi landscape.</p>
                    </AnimateInView>
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
                        variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                    >
                        {techPillars.map((pillar) => (
                            <TechPillarCard key={pillar.title} {...pillar} />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- Security Reiteration --- */}
            <section className="py-16 md:py-24 text-center relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimateInView>
                        <div className="inline-flex p-3 bg-gradient-to-br from-teal-600/20 to-cyan-600/20 rounded-lg border border-teal-500/30 mb-4">
                            <ShieldCheck size={28} className="text-teal-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-4">Security is Foundational</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto mb-6 text-sm md:text-base leading-relaxed"> From multi-signature wallets and cold storage to continuous monitoring and smart contract audits, your asset security is integrated into every step of our process. </p>
                        <Link href="/security" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center group">
                            Explore Our Security Measures <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </AnimateInView>
                </div>
            </section>

            {/* --- Support & CTA --- */}
            <section className="py-16 md:py-24 border-t border-gray-800/50 relative z-10 bg-gradient-to-t from-[#111827]/0 via-[#111827]/40 to-[#111827]/0">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <AnimateInView>
                        <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-4">Ready to Start?</h2>
                        <p className="text-gray-400 max-w-xl mx-auto mb-8"> Have questions? Our support team is here to help you understand the process and choose the right strategy. </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <Link href="/investment/plans" className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-900/30 text-base transition-all duration-300 hover:shadow-purple-500/40" >
                                    Choose Your Plan
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <Link href="/contact" className="inline-flex items-center px-6 py-2.5 bg-gray-800/60 border border-gray-700/80 text-gray-300 rounded-lg hover:bg-gray-700/80 hover:text-white transition-all text-sm font-medium" >
                                    <LifeBuoy size={16} className="mr-2" /> Contact Support
                                </Link>
                            </motion.div>
                        </div>
                    </AnimateInView>
                </div>
            </section>
        </div>
    );
}
// --- END: Main Page Component ---