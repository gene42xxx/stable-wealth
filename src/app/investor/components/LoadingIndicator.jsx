import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BarChart2, TrendingUp, Database } from 'lucide-react';

const LoadingIndicator = () => {
    // Ultra-modern animation variants
    const fadeInScale = {
        initial: { y: 20, opacity: 0, scale: 0.9 },
        animate: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    const rotate = {
        animate: {
            rotate: 360,
            transition: {
                duration: 15,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    const rotateReverse = {
        animate: {
            rotate: -360,
            transition: {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    const modernPulse = {
        animate: {
            scale: [1, 1.03, 1],
            opacity: [0.95, 1, 0.95],
            transition: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const progressDraw = {
        initial: { pathLength: 0, opacity: 0 },
        animate: {
            pathLength: 0.8,
            opacity: 1,
            transition: {
                pathLength: { duration: 2.5, ease: "easeInOut", delay: 0.5 },
                opacity: { duration: 0.3, delay: 0.3 }
            }
        }
    };

    const modernShimmer = {
        animate: {
            rotate: [0, 360],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    const satelliteAppear = {
        initial: { scale: 0, opacity: 0 },
        animate: (custom) => ({
            scale: 1,
            opacity: 1,
            transition: {
                delay: 0.8 + (custom * 0.1),
                duration: 0.4,
                ease: [0.68, -0.55, 0.265, 1.55]
            }
        })
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Ultra-subtle background grid */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            />

            <motion.div
                className="relative flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                {/* Ultra-modern multi-layer glow */}
                <div className="absolute inset-0 bg-blue-500/[0.03] rounded-full blur-3xl scale-[2.5]" />
                <div className="absolute inset-0 bg-indigo-500/[0.05] rounded-full blur-2xl scale-[1.8]" />
                <div className="absolute inset-0 bg-cyan-500/[0.04] rounded-full blur-xl scale-[1.3]" />

                {/* Main container - more compact */}
                <div className="relative w-80 h-80 flex items-center justify-center">

                    {/* Outermost ring - closer */}
                    <motion.div
                        className="absolute w-full h-full"
                        variants={rotate}
                        animate="animate"
                    >
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="ultraOuterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                                    <stop offset="25%" stopColor="#3b82f6" stopOpacity="0.6" />
                                    <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
                                    <stop offset="75%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="50" cy="50" r="46"
                                fill="none"
                                stroke="url(#ultraOuterGradient)"
                                strokeWidth="0.3"
                                strokeDasharray="4 6"
                            />
                        </svg>
                    </motion.div>

                    {/* Middle ring - much closer */}
                    <motion.div
                        className="absolute w-4/5 h-4/5"
                        variants={rotateReverse}
                        animate="animate"
                    >
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="ultraMiddleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#1e40af" stopOpacity="0.1" />
                                    <stop offset="20%" stopColor="#3b82f6" stopOpacity="0.3" />
                                    <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.5" />
                                    <stop offset="60%" stopColor="#6366f1" stopOpacity="0.7" />
                                    <stop offset="80%" stopColor="#8b5cf6" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1" />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="50" cy="50" r="44"
                                fill="none"
                                stroke="url(#ultraMiddleGradient)"
                                strokeWidth="0.8"
                            />
                        </svg>
                    </motion.div>

                    {/* Progress ring - much closer to center */}
                    <div className="absolute w-3/4 h-3/4">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="ultraProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#0ea5e9" />
                                    <stop offset="50%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#6366f1" />
                                </linearGradient>
                            </defs>
                            {/* Background track */}
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth="1.5"
                                opacity="0.15"
                            />
                            {/* Progress arc */}
                            <motion.circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="url(#ultraProgressGradient)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeDasharray="251"
                                variants={progressDraw}
                                initial="initial"
                                animate="animate"
                            />
                        </svg>

                        {/* Ultra-modern shimmer */}
                        <motion.div
                            className="absolute inset-0 -rotate-90"
                            variants={modernShimmer}
                            animate="animate"
                        >
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="ultraShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
                                        <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.4" />
                                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
                                        <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="url(#ultraShimmer)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeDasharray="22 229"
                                />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Center content - ultra-refined */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Main center element */}
                        <motion.div
                            className="relative mb-6"
                            variants={fadeInScale}
                            initial="initial"
                            animate="animate"
                        >
                            <motion.div
                                className="w-20 h-20 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden border border-white/5"
                                variants={modernPulse}
                                animate="animate"
                                style={{
                                    background: `linear-gradient(135deg, 
                                        rgba(14, 165, 233, 0.9) 0%, 
                                        rgba(59, 130, 246, 0.95) 50%, 
                                        rgba(99, 102, 241, 0.9) 100%
                                    )`,
                                    backdropFilter: 'blur(20px)'
                                }}
                            >
                                <BarChart2 size={32} className="text-white relative z-10" />

                                {/* Ultra-subtle inner highlight */}
                                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
                            </motion.div>

                            {/* Ultra-modern satellites - much closer */}
                            {[Shield, Database, TrendingUp, BarChart2].map((IconComponent, index) => {
                                const angle = (index * 90) * (Math.PI / 180);
                                const radius = 35; // Reduced from 50
                                const colors = [
                                    'from-emerald-400/90 to-teal-500/90',
                                    'from-blue-400/90 to-cyan-500/90',
                                    'from-indigo-400/90 to-purple-500/90',
                                    'from-violet-400/90 to-purple-500/90'
                                ];

                                return (
                                    <motion.div
                                        key={index}
                                        className={`absolute w-6 h-6 bg-gradient-to-br ${colors[index]} rounded-full flex items-center justify-center shadow-lg border border-white/10`}
                                        style={{
                                            left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                                            top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                                            transform: 'translate(-50%, -50%)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        custom={index}
                                        variants={satelliteAppear}
                                        initial="initial"
                                        animate="animate"
                                    >
                                        <IconComponent size={12} className="text-white" />
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* Ultra-clean text content */}
                        <motion.div
                            className="text-center"
                            variants={fadeInScale}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-2xl font-light text-gray-50 mb-2 tracking-wide">
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent font-medium">
                                    stable wealth
                                </span>
                             </h2>
                            <p className="text-sm text-gray-400 mb-5 font-light">Initializing market data</p>

                            {/* Ultra-modern loading dots */}
                            <div className="flex items-center justify-center gap-1.5 mb-5">
                                {[0, 1, 2].map((index) => (
                                    <motion.div
                                        key={index}
                                        className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                                        animate={{
                                            opacity: [0.3, 1, 0.3],
                                            scale: [0.8, 1.2, 0.8],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: index * 0.2,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Ultra-minimal security indicator */}
                            <motion.div
                                className="flex items-center justify-center gap-2 text-sm text-gray-400 font-light"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                            >
                                <span>Secure connection</span>
                                <motion.div
                                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                    animate={{
                                        opacity: [0.4, 1, 0.4],
                                        scale: [0.8, 1.1, 0.8],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingIndicator;