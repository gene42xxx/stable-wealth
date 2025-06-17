// ./app/team/page.jsx (Example file path using Next.js App Router)
'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// --- Animation Variants ---
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1]
        }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.15,
        }
    }
};

const cardVariant = {
    hidden: { opacity: 0, scale: 0.96, y: 25 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.65,
            ease: [0.16, 1, 0.3, 1]
        }
    }
};

const titleGradientAnimation = {
    animate: {
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        transition: {
            duration: 15,
            ease: 'linear',
            repeat: Infinity,
        },
    },
};

// --- Mock Team Data ---
const teamMembers = [
    {
        name: "Liam Johnson",
        title: "Founder & CEO",
        bio: "Visionary leader with 15+ years in fintech and algorithmic trading. Passionate about democratizing access to sophisticated investment tools.",
        imageSrc: "/about/team/liam-johnson.png",
    },
    {
        name: "Emma Williams",
        title: "Chief Technology Officer",
        bio: "Expert blockchain architect and cybersecurity specialist. Ensures the platform's security and technological edge.",
        imageSrc: "/about/team/emma-williams.png",
    },
    {
        name: "Noah Brown",
        title: "Head of Quantitative Research",
        bio: "PhD in Computational Finance. Develops and backtests the AI-driven investment strategies powering StableWealth.",
        imageSrc: "/about/team/noah-brown.png",
    },
    {
        name: "Ava Martinez",
        title: "Head of DeFi Strategy",
        bio: "Deep expertise in yield farming, liquidity protocols, and cross-chain interactions. Identifies optimal yield opportunities.",
        imageSrc: "/about/team/ava-martinez.png",
    },
    {
        name: "Ethan Davis",
        title: "Lead Security Engineer",
        bio: "Ethical hacker and smart contract auditing expert focused on maintaining institutional-grade security.",
        imageSrc: "/about/team/ethan-davis.png",
    },
    {
        name: "Mia Garcia",
        title: "Head of Product",
        bio: "Drives product vision and user experience, ensuring the platform remains intuitive and powerful.",
        imageSrc: "/about/team/mia-garcia.png",
    },
];

// --- Animation Hook Component ---
const AnimateInView = ({ children, delay = 0 }) => {
    const controls = useAnimation();
    const ref = useRef(null);
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
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                        delay
                    }
                }
            }}
        >
            {children}
        </motion.div>
    );
};

// --- Team Member Card Component ---
const TeamMemberCard = ({ name, title, bio, imageSrc }) => {
    return (
        <motion.div
            variants={cardVariant}
            className="group overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800/40 to-gray-900/60 backdrop-blur-md border border-gray-700/30"
            whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 300 }
            }}
        >
            {/* Glowing background effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-blue-600/20 blur-xl rounded-2xl"></div>
            </div>

            <div className="relative p-6 h-full flex flex-col z-10">
                {/* Image container with subtle animation */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md rounded-xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl"></div>
                    <div className="relative h-full w-full rounded-xl overflow-hidden">
                        {/* Using a placeholder image for demonstration since the actual paths may not exist */}
                        <Image
                            src={imageSrc}
                            alt={`Photo of ${name}`}
                            width={400}
                            height={300}
                            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 filter saturate-[1.15]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
                    </div>
                </div>

                {/* Content with subtle hover effects */}
                <div>
                    <h3 className="text-xl font-display font-semibold text-white mb-1 tracking-tight group-hover:text-indigo-300 transition-colors duration-300">{name}</h3>
                    <p className="text-sm font-accent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">{title}</p>
                    <p className="text-sm font-accent text-gray-400 leading-relaxed flex-grow opacity-80 group-hover:opacity-100 transition-opacity duration-300">{bio}</p>
                </div>
            </div>
        </motion.div>
    );
};

// --- Particle Background Component ---
const ParticleBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/40 rounded-full blur-sm"></div>
            <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-violet-600/40 rounded-full blur-sm"></div>
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-600/40 rounded-full blur-sm opacity-70"></div>
        </div>
    );
};

// --- Main Team Page Component ---
export default function TeamPage() {
    return (
        <div className="bg-[#05071A] text-gray-200 font-accent overflow-hidden">
            <ParticleBackground />

            {/* --- Page Hero Section --- */}
            <motion.section
                className="relative pt-44 pb-32 md:pt-52 md:pb-40 text-center overflow-hidden border-b border-gray-800/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <AnimateInView>
                        <motion.div
                            animate="animate"
                            variants={titleGradientAnimation}
                            className="inline-block text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-500 bg-clip-text text-transparent bg-size-200"
                        >
                            Meet the Innovators
                        </motion.div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mt-2 mb-6">
                            Behind StableWealth
                        </h2>
                    </AnimateInView>

                    <AnimateInView delay={0.2}>
                        <p className="text-lg md:text-xl font-accent text-gray-400 max-w-2xl mx-auto mt-6">
                            Our team combines deep expertise in quantitative finance, blockchain technology, AI, and cybersecurity to build the future of digital wealth management.
                        </p>
                    </AnimateInView>

                    <AnimateInView delay={0.4}>
                        <div className="mt-10 flex justify-center">
                            <div className="inline-flex p-[1px] rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600">
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-8 py-3 rounded-lg bg-gray-900 text-white font-accent text-base"
                                >
                                    Our Philosophy
                                </motion.button>
                            </div>
                        </div>
                    </AnimateInView>
                </div>
            </motion.section>

            {/* --- Leadership Section --- */}
            <section className="py-24 md:py-32 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/5 via-transparent to-transparent opacity-70"></div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <AnimateInView>
                        <h2 className="text-3xl md:text-4xl font-display font-semibold text-white text-center mb-16">
                            <span className="relative inline-block">
                                Core Leadership
                                <motion.span
                                    className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "100%" }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                    viewport={{ once: true }}
                                />
                            </span>
                        </h2>
                    </AnimateInView>

                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        variants={staggerContainer}
                    >
                        {teamMembers.map((member) => (
                            <TeamMemberCard key={member.name} {...member} />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- Join Us Section --- */}
            <section className="py-24 md:py-32 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-gray-900/50 to-gray-900/0"></div>

                {/* Animated background elements */}
                <div className="absolute -left-32 top-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -right-32 bottom-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <AnimateInView>
                        <h2 className="text-3xl md:text-4xl font-display font-semibold text-white mb-6">Join Our Mission</h2>
                        <p className="text-lg font-accent text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
                            We're always looking for passionate and talented individuals to help us build the future of finance. Explore opportunities to make an impact.
                        </p>
                    </AnimateInView>

                    <AnimateInView delay={0.2}>
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-lg blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <motion.div
                                whileHover={{
                                    scale: 1.03,
                                    boxShadow: "0 0 30px rgba(99, 102, 241, 0.6)"
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="relative"
                            >
                                <Link href="/" className="inline-block px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-accent shadow-xl shadow-indigo-900/30 text-base">
                                    View Open Positions
                                </Link>
                            </motion.div>
                        </div>
                    </AnimateInView>
                </div>
            </section>
        </div>
    );
}