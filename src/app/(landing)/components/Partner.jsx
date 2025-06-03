// app/page.js
"use client";
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

export default function Partner() {
    const [isLoaded, setIsLoaded] = useState(false);
    const dashboardRef = useRef(null);
    const partnersRef = useRef(null);
    const isDashboardInView = useInView(dashboardRef, { once: true, amount: 0.3 });
    const isPartnersInView = useInView(partnersRef, { once: true, amount: 0.2 });

    // Scroll-based animations
    const { scrollYProgress } = useScroll();
    const dashboardScale = useTransform(scrollYProgress, [0, 0.95], [1, 0.80]);
    const dashboardOpacity = useTransform(scrollYProgress, [0, 0.1, 0.2], [1, 1, 0.8]);

    // Staggered animation for the dotted lines
    const lineVariants = {
        hidden: { height: 0, opacity: 0 },
        visible: i => ({
            height: '100%',
            opacity: 0.3,
            transition: {
                delay: i * 0.15,
                duration: 1.2,
                ease: "easeInOut"
            }
        })
    };

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className="min-h-screen bg-neutral-900 text-white pb-10  md:p-8">
            <main className="max-w-7xl mx-auto">
                {/* Dashboard Section with Parallax Effect */}
                <motion.section
                    ref={dashboardRef}
                    initial={{ opacity: 0, y: 50 }}
                    animate={isDashboardInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    style={{ scale: dashboardScale, opacity: dashboardOpacity }}
                    className="mb-16">
                    <div
                        className="relative w-full h-fit rounded-xl overflow-hidden  "
                       
                        >
                        {/* Dashboard Content */}
                        <div className="relative h-full w-full flex items-center">
                            {/* Animated Vertical dotted lines */}
                            <div className="absolute h-full w-full flex justify-between pointer-events-none">
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        variants={lineVariants}
                                        initial="hidden"
                                        animate={isDashboardInView ? "visible" : "hidden"}
                                        className="h-full border-r border-dotted border-gray-400 mx-auto"
                                    ></motion.div>
                                ))}
                            </div>

                            {/* Dashboard content with subtle hover effect */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="relative hidden lg:block w-full h-full "
                            >
                                <div className="relative w-full h-[15rem] md:h-[30rem]">
                                    <Image
                                        src="/partners/stat.png"
                                        alt="Trading Dashboard"
                                        fill
                                        className=" aspect-auto object-cover object-left-top"
                                        priority
                                        quality={90}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent pointer-events-none" />
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* Partners Section with Staggered Animation */}
                <motion.section
                    ref={partnersRef}
                    initial={{ opacity: 0 }}
                    animate={isPartnersInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mb-12 relative">
                    {/* Animated vertical dotted lines */}
                    <div className="absolute h-full w-full flex justify-between pointer-events-none">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={lineVariants}
                                initial="hidden"
                                animate={isPartnersInView ? "visible" : "hidden"}
                                className="h-full border-r border-dotted border-gray-400 mx-auto"
                            ></motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {partners.map((partner, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={isPartnersInView ? { opacity: 1, y: 0 } : {}}
                                transition={{
                                    delay: 0.2 + index * 0.1,
                                    duration: 0.5,
                                    ease: "easeInOut"
                                }}
                                whileHover={{
                                    scale: 1.05,
                                    transition: { duration: 0.2 }
                                }}
                                className="flex justify-center">
                                <motion.div
                                    className="p-6 rounded-lg w-full max-w-xs flex items-center justify-center h-24"
                                    whileHover={{
                                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                                    }}
                                    transition={{ duration: 0.3 }}>
                                    <motion.div
                                        initial={{ filter: "grayscale(100%)" }}
            
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Image
                                            src={partner.logo}
                                            alt={partner.name}
                                            width={120}
                                            height={60}
                                            className="object-contain"
                                        />
                                    </motion.div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Floating Particle Animation */}
                {isLoaded && <ParticleBackground />}
            </main>
        </div>
    );
}

// Particle background component for ambient animation
function ParticleBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-primary-200/50"
                    initial={{
                        width: 10,
                        height: 10,
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        opacity: Math.random() * 0.3
                    }}
                    animate={{
                        x: [
                            Math.random() * window.innerWidth,
                            Math.random() * window.innerWidth
                        ],
                        y: [
                            Math.random() * window.innerHeight,
                            Math.random() * window.innerHeight
                        ],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{
                        duration: Math.random() * 30 + 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}

// Array of partner data
const partners = [
    {
        name: 'Binance',
        logo: '/logos/binance.svg'
    },
    {
        name: 'Coinbase',
        logo: '/logos/coinbase.svg'
    },
    {
        name: 'Kraken',
        logo: '/logos/kraken.svg'
    },
    {
        name: 'FTX',
        logo: '/logos/ftx.svg'
    },
    {
        name: 'Blockchain',
        logo: '/logos/blockchain.svg'
    },
    {
        name: 'BitFinex',
        logo: '/logos/bitfinex.svg'
    },
    {
        name: 'Huobi',
        logo: '/logos/huobi.svg'
    },
    {
        name: 'UniSwap',
        logo: '/logos/uniswap.svg'
    }
];