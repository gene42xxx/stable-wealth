// ./app/security/page.jsx (Example file path using Next.js App Router - FULL CODE)
'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, useAnimation, useInView, AnimatePresence, useScroll, useTransform, animate } from 'framer-motion'; // Added useAnimation, useInView, animate
import {
    Shield, Lock, Server, Database, Key, FileCheck, CheckCircle, Users, AlertTriangle, ShieldCheck, ChevronDown, Eye, EyeOff, Mail, Info // Added Info
} from 'lucide-react';
import Link from 'next/link';
// Removed Image import as no images are used in this version (only placeholders implied)

// --- START: Animation Hook Component ---
// Encapsulates the logic for triggering animation when an element scrolls into view
const AnimateInView = ({ children, delay = 0, className = "", variants }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    // Trigger when 20% of the element is in view, only once
    const inView = useInView(ref, { once: true, amount: 0.2 });

    useEffect(() => {
        if (inView) {
            controls.start("visible");
        }
    }, [controls, inView]);

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={variants || {
                hidden: { opacity: 0, y: 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1], // Expo Out
                        delay
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
// --- END: Animation Hook Component ---

// --- START: Animation Variants ---
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const fadeInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const fadeInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12, // Adjusted stagger time
            delayChildren: 0.15,
        }
    }
};

const cardVariant = {
    hidden: { opacity: 0, scale: 0.96, y: 25 }, // Slightly adjusted values
    visible: {
        opacity: 1, scale: 1, y: 0,
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } // Slightly faster
    }
};
// --- END: Animation Variants ---


// --- START: Helper Component Definitions (Full Code) ---

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

const SecurityFeatureCard = memo(({ icon: Icon, title, description }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <motion.div
            variants={cardVariant} // Use card variant for entry
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800/40 to-gray-900/60 backdrop-blur-md border border-gray-700/30 h-full"
            whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <motion.div className="absolute inset-0 transition-opacity duration-500" animate={{ opacity: isHovered ? 1 : 0 }} >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 blur-xl rounded-2xl"></div>
            </motion.div>
            <div className="relative p-6 md:p-8 h-full flex flex-col z-10">
                <motion.div className="mb-5 p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 inline-flex border border-indigo-500/20" animate={{ scale: isHovered ? 1.1 : 1 }} transition={{ duration: 0.3 }} >
                    <Icon size={28} className="text-indigo-400" />
                </motion.div>
                <h3 className="text-xl font-display font-semibold text-white mb-3 tracking-tight group-hover:text-indigo-300 transition-colors duration-300">{title}</h3>
                <p className="text-sm font-accent text-gray-400 leading-relaxed flex-grow opacity-80 group-hover:opacity-100 transition-opacity duration-300">{description}</p>
            </div>
        </motion.div>
    );
});
SecurityFeatureCard.displayName = 'SecurityFeatureCard';

const Accordion = memo(({ title, children, initiallyOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    return (
        <motion.div layout transition={{ layout: { duration: 0.3, ease: "easeInOut" } }} className="bg-gradient-to-b from-gray-800/40 to-gray-900/60 backdrop-blur-md border border-gray-700/30 rounded-xl overflow-hidden mb-4 last:mb-0" >
            <button className="w-full p-5 md:p-6 flex justify-between items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-t-xl" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} >
                <h3 className="text-base sm:text-lg font-display font-semibold text-white">{title}</h3>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} >
                    <ChevronDown size={20} className={`transition-colors ${isOpen ? 'text-indigo-400' : 'text-gray-500'}`} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.3, ease: "easeInOut" }, opacity: { duration: 0.2, delay: 0.1 } } }} exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } } }} className="overflow-hidden" >
                        <div className="px-5 md:px-6 pb-5 md:pb-6 pt-1 text-sm sm:text-base font-accent text-gray-400 leading-relaxed"> {children} </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});
Accordion.displayName = "Accordion";

const SecurityProcessStep = memo(({ number, title, description }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        // Use AnimateInView for entry animation
        <AnimateInView variants={cardVariant} className="relative">
            <motion.div
                className="flex gap-5"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div className="relative flex-shrink-0">
                    <motion.div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg z-10 relative" animate={{ scale: isHovered ? 1.1 : 1, boxShadow: isHovered ? "0 0 20px rgba(99, 102, 241, 0.5)" : "none" }} transition={{ duration: 0.3 }} >
                        {number}
                    </motion.div>
                    {/* Static line, relies on parent for connection appearance */}
                    {number < 5 && (<div className="absolute w-px h-[calc(100%+2rem)] top-12 left-1/2 transform -translate-x-1/2 bg-gradient-to-b from-indigo-500/50 via-purple-500/30 to-transparent z-0"></div>)}
                </div>
                <div className="pt-2 pb-10 flex-grow">
                    <h3 className="text-xl font-display font-semibold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm font-accent leading-relaxed">{description}</p>
                </div>
            </motion.div>
        </AnimateInView>
    );
});
SecurityProcessStep.displayName = "SecurityProcessStep";

const SecurityRating = memo(({ title, value, max = 5 }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    useEffect(() => {
        if (isInView) {
            controls.start({
                width: `${(value / max) * 100}%`,
                transition: { duration: 1, ease: "easeInOut", delay: 0.3 }
            });
        } else {
            controls.start({ width: 0 }); // Reset if needed when out of view
        }
    }, [isInView, controls, value, max]);

    return (
        <div className="py-4 border-b border-gray-800/50 last:border-none" ref={ref}>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-gray-300 font-medium text-sm font-accent">{title}</h4>
                <span className="text-indigo-400 font-medium text-sm">{value}/{max}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={controls}
                />
            </div>
        </div>
    );
});
SecurityRating.displayName = 'SecurityRating';

const Badge = memo(({ children, className }) => {
    return (
        <motion.div className={`inline-flex items-center gap-2 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-full py-2 px-4 border border-indigo-700/30 ${className}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} >
            {children}
        </motion.div>
    );
});
Badge.displayName = 'Badge';

// Using Framer Motion animate function for smoother counting
const AnimatedStat = memo(({ value, label, duration = 1.5 }) => {
    const count = useMotionValue(0);
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.5 });

    // Extract number and suffix/prefix
    const numValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.]/g, ''));
    const suffix = typeof value === 'string' ? (value.match(/[a-zA-Z%+-]+$/)?.[0] || '') : '';
    const prefix = typeof value === 'string' ? (value.match(/^[^0-9]+/)?.[0] || '') : '';

    // Determine decimals based on input value
    const decimals = suffix === '%' ? 1 : 0;

    const displayValue = useTransform(count, (latest) => {
        return latest.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    });

    useEffect(() => {
        if (inView) {
            const animControls = animate(count, numValue || 0, {
                duration: duration,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1], // Expo Out
            });
            return animControls.stop;
        }
    }, [inView, count, numValue, duration]);

    return (
        <div className="text-center" ref={ref}>
            <motion.div className="text-4xl font-semibold text-indigo-400 mb-2 tabular-nums" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} >
                {prefix}
                <motion.span>{displayValue}</motion.span>
                {suffix}
            </motion.div>
            <p className="text-sm font-accent text-gray-400">{label}</p>
        </div>
    );
});
AnimatedStat.displayName = 'AnimatedStat';

const FloatingIcons = () => {
    // Simplified structure
    const icons = [
        { icon: Shield, size: 30, color: "text-indigo-500/50", top: '15%', left: '10%', duration: 20, x: [0, 20, -10, 0], y: [0, 30, 10, 0] },
        { icon: Lock, size: 24, color: "text-blue-500/50", top: '25%', right: '15%', duration: 25, x: [0, -30, 15, 0], y: [0, -20, 30, 0] },
        { icon: Key, size: 28, color: "text-purple-500/50", bottom: '30%', left: '20%', duration: 30, x: [0, 25, -15, 0], y: [0, 20, -30, 0] },
        { icon: Database, size: 22, color: "text-indigo-500/50", bottom: '20%', right: '25%', duration: 22, x: [0, -15, 30, 0], y: [0, -25, 15, 0] },
    ];
    return (
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
            {icons.map((item, index) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={index}
                        className={`absolute ${item.color}`}
                        style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
                        animate={{ x: item.x, y: item.y, opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
                        transition={{ duration: item.duration, repeat: Infinity, ease: "easeInOut", repeatType: 'mirror' }}
                    >
                        <Icon size={item.size} strokeWidth={1} />
                    </motion.div>
                );
            })}
        </div>
    );
};

// Basic Parallax Section implementation
const ParallaxSection = ({ children, strength = 50, className = "" }) => { // Reduced default strength
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    // Apply inverse Y translation for subtle effect
    const y = useTransform(scrollYProgress, [0, 1], [strength / 2, -strength / 2]);

    return (
        <div ref={ref} className={`relative ${className}`}> {/* Don't add overflow-hidden here */}
            <motion.div style={{ y }} >{children}</motion.div>
        </div>
    );
};
// --- END: Helper Component Definitions ---


// --- START: Main Security Page Component ---
export default function SecurityPage() {
    const [isMobile, setIsMobile] = useState(false);
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    useEffect(() => {
        if (!isClient) return;
        const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [isClient]);

    const faqData = [
        { q: "How are my private keys managed?", a: "Private keys are generated and stored offline in geographically distributed, air-gapped hardware security modules (HSMs). Access requires multi-party computation (MPC) and multi-signature approvals, ensuring no single person or system can compromise keys." },
        { q: "What happens if StableWealth is compromised?", a: "Our architecture minimizes attack vectors. User assets are largely held in audited smart contracts and segregated cold storage. We maintain robust incident response plans and insurance coverage for certain scenarios. See our detailed Security Policy for more." },
        { q: "Are the smart contracts audited?", a: "Yes, all core smart contracts undergo multiple rigorous audits by leading independent security firms before deployment and after significant upgrades. Audit reports are publicly available." },
        { q: "How do you protect against DeFi exploits?", a: "We continuously monitor integrated protocols, employ automated risk management tools, maintain protocol diversification, and utilize smart contract insurance where applicable. Our strategies are designed with safeguards against common exploit vectors." },
        { q: "What data do you collect and how is it protected?", a: "We collect minimal necessary data for KYC/AML compliance and platform operation. All sensitive data is encrypted both in transit (TLS 1.3+) and at rest (AES-256). Please see our Privacy Policy for full details." },
    ];

    // Server Placeholder
    if (!isClient) {
        return (
            <div className="bg-[#05071A] min-h-screen flex items-center justify-center">
                <div className="loader"></div>
                <p className="text-gray-400">Loading Security Information...</p>
            </div>
        );
    }

    // Client Render
    return (
        <div className="bg-[#05071A] text-gray-200 font-accent pt-[8rem] overflow-hidden relative isolate">
            <AnimatedBackground />
            <FloatingIcons />

            {/* --- Hero Section --- */}
            <motion.section className="relative  pt-20 sm:pt-36 md:pt-40 pb-20 sm:pb-24 md:pb-32 text-center overflow-hidden border-b border-gray-800/30" initial="hidden" animate="visible" variants={staggerContainer} >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent -z-10"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <AnimateInView> <Badge className="mb-6 sm:mb-8"> <ShieldCheck size={16} className="text-indigo-400" /> <span className="text-sm font-accent font-medium text-indigo-300">Institutional-Grade Security</span> </Badge> </AnimateInView>
                    <AnimateInView  variants={fadeIn}> <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-4 sm:mb-6 text-white"> Securing Your Digital <br className="hidden md:block" /> <motion.span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent inline-block" animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}> Wealth & Future </motion.span> </h1> </AnimateInView>
                    <AnimateInView > <p className="text-base sm:text-lg md:text-xl font-accent text-gray-400 max-w-2xl mx-auto mt-4 sm:mt-6 px-4"> Our comprehensive security infrastructure combines cutting-edge technology, rigorous processes, and constant vigilance to protect your assets at every level. </p> </AnimateInView>
                    <AnimateInView > <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-5 px-4"> <div className="inline-flex p-[1px] rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"> <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg bg-gray-950 text-white font-medium text-base hover:bg-gray-900 transition-colors"> Security Whitepaper </motion.button> </div> <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg text-indigo-300 border border-indigo-800/50 font-medium text-base bg-indigo-900/20 hover:bg-indigo-900/40 transition-colors" > Audit Reports </motion.button> </div> </AnimateInView>
                    <motion.div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block" animate={{ y: [0, 12, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} > <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 15L3 8L4.4 6.55L10 12.15L15.6 6.55L17 8L10 15Z" fill="#818CF8" /></svg> </motion.div>
                </div>
            </motion.section>

            {/* --- Key Security Features Section --- */}
            <section className="py-16 sm:py-20 md:py-24 lg:py-32 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/5 via-transparent to-transparent opacity-70 -z-10"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <AnimateInView variants={fadeIn}> <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-white text-center mb-4"> <span className="relative inline-block"> Enterprise-Grade Protection <motion.span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500" initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ duration: 0.8, delay: 0.3 }} viewport={{ once: true }} /> </span> </h2> </AnimateInView>
                    <AnimateInView > <p className="text-center font-accent text-gray-400 max-w-3xl mx-auto mb-12 sm:mb-16 px-4"> StableWealth employs multiple layers of security... </p> </AnimateInView>
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} >
                        <SecurityFeatureCard icon={Lock} title="End-to-End Encryption" description="All data is encrypted in transit (TLS 1.3+) and at rest (AES-256)..." />
                        <SecurityFeatureCard icon={Key} title="Multi-Factor & MPC Wallets" description="Combining multi-factor authentication with Multi-Party Computation (MPC)..." />
                        <SecurityFeatureCard icon={ShieldCheck} title="Smart Contract Audits" description="All core contracts undergo multiple, rigorous audits..." />
                        <SecurityFeatureCard icon={Server} title="Segregated Cold Storage" description="Majority of assets secured in geographically distributed, air-gapped cold storage..." />
                        <SecurityFeatureCard icon={FileCheck} title="Compliance & Verification" description="Adherence to relevant financial regulations, regular independent audits..." />
                        <SecurityFeatureCard icon={Database} title="Continuous Monitoring & Prevention" description="Advanced systems detect and mitigate suspicious activities..." />
                    </motion.div>
                </div>
            </section>

            {/* --- Security Process Section --- */}
            {/* Wrapped in ParallaxSection */}
            <ParallaxSection strength={isMobile ? 50 : 100} className="py-16 sm:py-20 md:py-24 lg:py-32 text-center relative overflow-visible bg-gray-900/30">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent -z-10"></div>
                <div className="container mx-auto px-4 sm:px-6 relative z-10">
                    <AnimateInView variants={fadeIn}> <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-white mb-4"> Our Security Process </h2> </AnimateInView>
                    <AnimateInView > <p className="font-accent text-gray-400 max-w-3xl mx-auto mb-12 sm:mb-16 px-4"> Security isn't just a feature; it's a continuous process... </p> </AnimateInView>
                    <div className="max-w-3xl mx-auto px-4 sm:px-0">
                        <motion.div className="flex flex-col" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} >
                            {[{ number: 1, title: "Threat Modeling", description: "Comprehensive risk assessment..." }, { number: 2, title: "Secure Implementation", description: "Defense-in-depth principles..." }, { number: 3, title: "Rigorous Testing", description: "Internal testing, fuzzing, external penetration testing..." }, { number: 4, title: "Third-Party Audits", description: "Multiple independent security firms conduct thorough code audits..." }, { number: 5, title: "Continuous Monitoring", description: "Automated systems and personnel monitor threats 24/7." }].map(step => (<SecurityProcessStep key={step.number} {...step} />))}
                        </motion.div>
                    </div>
                </div>
            </ParallaxSection>

            {/* --- Security Stats & Certifications Section --- */}
            <section className="py-16 sm:py-20 md:py-24 lg:py-32 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/5 via-transparent to-transparent opacity-70 -z-10"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <AnimateInView className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
                        {/* Security Ratings */}
                        <motion.div variants={fadeInLeft}>
                            <h3 className="text-xl sm:text-2xl font-display font-semibold text-white mb-6 border-b border-gray-700/50 pb-3">Independent Security Metrics</h3>
                            <div className="space-y-3">
                                <SecurityRating title="Platform Security Rating (CER.live)" value={4.8} max={5} />
                                <SecurityRating title="Smart Contract Audit Score (Avg)" value={96} max={100} />
                                <SecurityRating title="Infrastructure Uptime (Quarterly)" value={99.99} max={100} />
                                <SecurityRating title="Insurance Coverage Ratio" value={4.5} max={5} />
                            </div>
                        </motion.div>
                        {/* Certifications & Compliance */}
                        <motion.div variants={fadeInRight}>
                            <h3 className="text-xl sm:text-2xl font-display font-semibold text-white mb-6 border-b border-gray-700/50 pb-3">Certifications & Compliance</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {['SOC 2 Type II', 'ISO 27001', 'GDPR Compliant', 'CCSS Level 3', 'Crypto Verify', 'Chainalysis KYT'].map((cert, i) => (
                                    <AnimateInView delay={i * 0.05} key={cert}>
                                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4 text-center aspect-square flex flex-col items-center justify-center hover:bg-gray-700/50 transition-colors">
                                            <FileCheck size={32} className="text-indigo-400 mb-2" />
                                            <span className="text-xs text-gray-300 font-medium">{cert}</span>
                                        </div>
                                    </AnimateInView>
                                ))}
                            </div>
                        </motion.div>
                    </AnimateInView>
                </div>
            </section>

            {/* --- FAQ Section --- */}
            <section className="py-16 sm:py-20 md:py-24 lg:py-32 bg-gray-900/30 border-t border-gray-800/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimateInView variants={fadeIn} className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-white mb-4">Security Questions?</h2>
                        <p className="font-accent text-gray-400"> Your trust is our priority. Find answers to common security concerns below.</p>
                    </AnimateInView>
                    <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} >
                        {faqData.map((faq, index) => (
                            <motion.div className='my-2' key={index} variants={fadeIn}>
                                <Accordion  title={faq.q} initiallyOpen={index === 0}> {/* Open first FAQ by default */}
                                    <p className="font-accent">{faq.a}</p>
                                </Accordion>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- Contact/Support Section --- */}
            <section className="py-16 sm:py-20 md:py-24 text-center">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimateInView variants={fadeIn}>
                        <h2 className="text-xl sm:text-2xl font-display font-semibold text-white mb-4">Have More Questions?</h2>
                        <p className="font-accent text-gray-400 max-w-xl mx-auto mb-6">Our dedicated security team and support staff are available to address any further inquiries you may have regarding the safety of your assets.</p>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                            <Link href="/contact?subject=SecurityInquiry" className="inline-flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm shadow-md">
                                <Mail size={16} className="mr-2" /> Contact Security Support
                            </Link>
                        </motion.div>
                    </AnimateInView>
                </div>
            </section>

        </div>
    );
}
