// ./app/about/page.jsx (Example file path using Next.js App Router - Fixed Timeline Alignment)
'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Zap, Lock, Lightbulb, Users, ChevronRight } from 'lucide-react'; // Adjusted imports
import Link from 'next/link';
import Image from 'next/image';

// --- Animation Variants ---
const fadeIn = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const timelineItemVariant = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const timelineDotVariant = {
    hidden: { scale: 0, opacity: 0 }, // Start smaller
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.2 } } // Springy entrance
}


// --- Main Our Story Page Component ---
export default function OurStoryPage() {
    // --- Particle Background Component ---
    const ParticleBackground = () => {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/40 rounded-full blur-3xl"></div>
                <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-violet-600/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-600/40 rounded-full blur-3xl opacity-70"></div>
            </div>
        );
    };


    const timelineRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: timelineRef,
        // Adjust offset: Start when top enters bottom, end when bottom leaves top
        offset: ["start end", "end start"]
    });
    // Smoother mapping for the line animation end
    const timelineScaleY = useTransform(scrollYProgress, [0.05, 0.9], [0, 1]); // Start later, end sooner

    const coreValues = [
        { title: "Security First", description: "Employing institutional-grade security measures to safeguard assets.", icon: Lock },
        { title: "Radical Transparency", description: "Operating with clarity and providing verifiable on-chain data.", icon: Zap },
        { title: "Relentless Innovation", description: "Constantly exploring and integrating cutting-edge DeFi protocols.", icon: Lightbulb },
    ];

    const milestones = [
        { year: "2022", title: "Genesis Block", description: "Frustrated by DeFi complexity and security risks, StableWealth was conceptualized." },
        { year: "2023 Q1", title: "Protocol v1 Launch", description: "Initial platform release focusing on secure, aggregated stablecoin yields." },
        { year: "2023 Q4", title: "AI Engine Integration", description: "Launched proprietary AI analytics for enhanced risk management and opportunity identification." },
        { year: "2024 Q2", title: "Cross-Chain Expansion", description: "Integrated key L2 solutions and alternative L1s, broadening investment horizons." },
        { year: "Today", title: "Empowering Investors", description: "Serving thousands globally, simplifying institutional-grade crypto wealth generation." },
    ];

    return (
        <div className="bg-[#080A1A] text-gray-200 font-accent overflow-x-hidden">
            <ParticleBackground />

            {/* --- Page Hero Section --- */}
            <motion.section className="relative py-[15rem] text-center overflow-hidden border-b border-gray-800/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} >
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-800 via-transparent to-transparent blur-2xl"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-4" variants={fadeIn} initial="hidden" animate="visible" >
                        <motion.span transition={{ delay: 0.1 }} variants={fadeIn} className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500"> Our Journey </motion.span>
                        <motion.span transition={{ delay: 0.2 }} variants={fadeIn} className="block text-white mt-2 font-accent">Building the Future of Digital Wealth</motion.span>
                    </motion.h1>
                    <motion.p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto" variants={fadeIn} initial="hidden" animate="visible" transition={{ delay: 0.3 }} > Discover the vision, values, and milestones behind StableWealth's mission to redefine crypto investment. </motion.p>
                </div>
            </motion.section>

            {/* --- Section 1: The Spark --- */}
            <section className="py-20 md:py-28 relative">
                <div className="absolute top-1/2 left-0 w-1/3 h-1/2 bg-gradient-to-br from-blue-900/10 via-transparent to-transparent opacity-30 blur-3xl -translate-y-1/2"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} >
                        <motion.div variants={fadeIn}>
                            <motion.div className="bg-gray-800/30 relative rounded-xl aspect-video border border-gray-700/50 mb-8 lg:mb-0 overflow-hidden shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }} >
                                <Image src="/about/our-story/1.jpg" alt="Abstract representation of DeFi Complexity" fill style={{ objectFit: "cover" }} className="rounded-xl" sizes="(max-width: 1024px) 100vw, 50vw" />
                            </motion.div>
                        </motion.div>
                        <motion.div variants={fadeIn} className="space-y-5">
                            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white">The Genesis</h2>
                            <p className="text-gray-300 leading-relaxed font-accent"> StableWealth was born from a simple observation: the incredible potential of decentralized finance was often locked behind layers of complexity and significant security risks... </p>
                            <p className="text-gray-300 leading-relaxed font-accent"> We saw the need for a platform that could abstract away this complexity... </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* --- Section 2: Vision & Mission --- */}
            <section className="py-20 md:py-28 bg-gradient-to-b from-[#111827]/0 via-[#111827]/50 to-[#111827]/0 relative">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-transparent to-transparent blur-3xl"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} >
                        <motion.div variants={fadeIn} className="space-y-6 lg:order-last">
                            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white">Our North Star</h2>
                            <div> <h3 className="text-xl md:text-2xl font-display text-indigo-400 mb-2">Vision</h3> <p className="text-gray-300 leading-relaxed text-lg border-l-2 border-indigo-500 pl-4 font-accent"> To be the most trusted and intelligent engine for secure digital asset wealth creation globally. </p> </div>
                            <div> <h3 className="text-xl md:text-2xl font-display text-blue-400 mb-2 mt-5">Mission</h3> <p className="text-gray-300 leading-relaxed text-lg border-l-2 border-blue-500 pl-4 font-accent"> To empower individuals and institutions to confidently navigate and capitalize on the DeFi landscape... </p> </div>
                        </motion.div>
                        <motion.div variants={fadeIn} className="lg:order-first">
                            <motion.div className="bg-gray-800/30 relative rounded-xl aspect-square lg:aspect-video border border-gray-700/50 overflow-hidden shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }} >
                                <Image src="/about/our-story/vision-growth.jpg" alt="Abstract representation of Vision and Growth" fill style={{ objectFit: "cover" }} className="rounded-xl" sizes="(max-width: 1024px) 100vw, 50vw" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* --- Section 3: Core Values --- */}
            <section className="py-20 md:py-28">
                <div className="container mx-auto px-6 text-center">
                    <motion.h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-12 md:mb-16" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} > Guided by Our Values </motion.h2>
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} >
                        {coreValues.map((value, index) => {
                            const Icon = value.icon;
                            return (<motion.div key={index} variants={fadeIn} whileHover={{ y: -8, scale: 1.03, boxShadow: "0 10px 30px rgba(79, 70, 229, 0.2)" }} transition={{ type: 'spring', stiffness: 300 }} className="bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-xl p-6 md:p-8 group cursor-default" > <motion.div transition={{ type: 'spring', stiffness: 400, damping: 15 }} className="mb-5 inline-block p-3 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg shadow-lg group-hover:scale-110" > <Icon className="w-6 h-6 text-white" /> </motion.div> <h3 className="text-xl font-display font-semibold text-white mb-3">{value.title}</h3> <p className="text-gray-400 text-sm leading-relaxed font-accent">{value.description}</p> </motion.div>);
                        })}
                    </motion.div>
                </div>
            </section>

            {/* --- Section 4: Milestones/Journey (Animated Timeline - FIXED ALIGNMENT) --- */}
            <section className="py-20 md:py-28 overflow-hidden">
                <div className="container mx-auto px-6">
                    <motion.h2 className="text-3xl md:text-4xl font-display font-semibold text-white text-center mb-16 md:mb-20" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} > Our Path So Far </motion.h2>

                    {/* Timeline Container */}
                    <div className="relative max-w-4xl mx-auto" ref={timelineRef}>

                        {/* Animated Vertical Line */}
                        {/* Positioned absolutely in the center for desktop, near left for mobile */}
                        <motion.div
                            className="absolute left-5 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-700 via-blue-700 to-purple-700 rounded-full md:-translate-x-[1px] origin-top"
                            style={{ scaleY: timelineScaleY }} // Animate scaleY based on scroll
                        />

                        {/* Milestones List */}
                        <div className="space-y-12 md:space-y-0"> {/* Remove vertical space on desktop */}
                            {milestones.map((milestone, index) => (
                                <motion.div
                                    key={index}
                                    className="relative mr-10 md:mr-0 md:grid md:grid-cols-2 md:gap-8 items-center py-4" // Use grid for desktop alignment
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.4 }} // Adjust trigger point
                                >
                                    {/* Dot - positioned absolutely relative to the main container's line */}
                                    <motion.div
                                        className={`absolute left-5 top-1 w-5 h-5 md:left-1/2 md:top-1/2 rounded-full bg-[#080A1A] border-2 border-indigo-500 transform -translate-x-[9px] md:-translate-y-1/2 z-10`} // Adjust centering transform
                                        variants={timelineDotVariant}
                                        initial="hidden" // Animate dot independently
                                        whileInView="visible"
                                        viewport={{ once: true, amount: 0.5 }}
                                    >
                                        {/* Optional: Inner smaller dot */}
                                        <div className="w-2 h-2 bg-indigo-300 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                                    </motion.div>

                                    {/* Content Card (Position adjusted with grid) */}
                                    <motion.div
                                        variants={timelineItemVariant}
                                        className={`w-full p-5 md:p-6 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg hover:border-indigo-500/70 transition-colors duration-300
                                                    ml-10 md:ml-0 // Add margin-left only on mobile
                                                    ${index % 2 === 0 ? 'md:col-start-1 md:text-right' : 'md:col-start-2 md:text-left'}` // Alternate sides on desktop
                                        }
                                    >
                                        <p className={`text-sm font-semibold text-indigo-400 mb-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>{milestone.year}</p>
                                        <h3 className={`text-lg font-display font-medium text-white mb-2 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>{milestone.title}</h3>
                                        <p className={`text-sm text-gray-400 font-accent ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>{milestone.description}</p>
                                    </motion.div>

                                    {/* Empty column for spacing on desktop */}
                                    <div className={`hidden md:block ${index % 2 === 0 ? 'col-start-2' : 'col-start-1 row-start-1'}`}></div>

                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Section 5: Technology/Approach --- */}
            <section className="py-20 md:py-28 relative">
                <div className="absolute top-1/2 right-0 w-1/3 h-2/3 bg-gradient-to-bl from-purple-900/10 via-transparent to-transparent opacity-30 blur-3xl -translate-y-1/2"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} >
                        <motion.div variants={fadeIn} className="space-y-5">
                            <h2 className="text-3xl md:text-4xl font-display font-semibold text-white">Intelligent & Secure by Design</h2>
                            <p className="text-gray-300 leading-relaxed font-accent"> Our platform leverages a multi-layered approach... </p>
                            <p className="text-gray-300 leading-relaxed font-accent"> Transparency is paramount... </p>
                            <div> <Link href="/how-it-works" className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center group"> Learn more about our tech <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" /> </Link> </div>
                        </motion.div>
                        <motion.div variants={fadeIn}>
                            <motion.div className="bg-gray-800/30 relative rounded-xl aspect-video border border-gray-700/50 overflow-hidden shadow-lg" whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}>
                                <Image src="/about/our-story/technology-security.jpg" alt="Technology and Security Abstract" fill style={{ objectFit: "cover" }} className="rounded-xl" sizes="(max-width: 1024px) 100vw, 50vw" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* --- Section 6: The Future --- */}
            <section className="py-20 md:py-28 bg-gradient-to-t from-[#111827]/30 to-[#111827]/80">
                <div className="container mx-auto px-6 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} >
                        <h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-6">Charting the Course Ahead</h2>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10 font-accent"> The world of digital assets is constantly evolving... </p>
                        <motion.div whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(99, 102, 241, 0.5)" }} whileTap={{ scale: 0.98 }} className="inline-block" transition={{ duration: 0.3 }}>
                            <Link href="/register" className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-900/30 text-base transition-all duration-300" > Join the Future of Wealth </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}