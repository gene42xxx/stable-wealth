import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BarChart2, TrendingUp, Database } from 'lucide-react';

const LoadingIndicator = () => {
    // Simplified animation variants for better performance
    const fadeInScale = {
        initial: { opacity: 0, scale: 0.95 },
        animate: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const simpleRotate = {
        animate: {
            rotate: 360,
            transition: {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    const progressDraw = {
        initial: { pathLength: 0 },
        animate: {
            pathLength: 0.75,
            transition: {
                duration: 2,
                ease: "easeOut",
                delay: 0.3
            }
        }
    };

    const satelliteAppear = {
        initial: { scale: 0, opacity: 0 },
        animate: (custom) => ({
            scale: 1,
            opacity: 1,
            transition: {
                delay: 0.6 + (custom * 0.1),
                duration: 0.3,
                ease: "easeOut"
            }
        })
    };

    // Simplified pulse that uses transform instead of multiple properties
    const centerPulse = {
        animate: {
            scale: [1, 1.02, 1],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Simplified background - static instead of animated */}
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                }}
            />

            <motion.div
                className="relative flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Single background glow instead of multiple layers */}
                <div className="absolute inset-0 bg-blue-500/[0.04] rounded-full blur-2xl scale-[2]" />

                {/* Main container */}
                <div className="relative w-80 h-80 flex items-center justify-center">

                    {/* Single outer ring - simplified */}
                    <motion.div
                        className="absolute w-full h-full"
                        variants={simpleRotate}
                        animate="animate"
                    >
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="46"
                                fill="none"
                                stroke="rgba(59, 130, 246, 0.2)"
                                strokeWidth="0.5"
                                strokeDasharray="6 8"
                            />
                        </svg>
                    </motion.div>

                    {/* Progress ring - no shimmer effect */}
                    <div className="absolute w-3/4 h-3/4">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background track */}
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="rgba(30, 41, 59, 0.3)"
                                strokeWidth="1"
                            />
                            {/* Progress arc - single color instead of gradient */}
                            <motion.circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray="251"
                                variants={progressDraw}
                                initial="initial"
                                animate="animate"
                            />
                        </svg>
                    </div>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Main center element - simplified */}
                        <motion.div
                            className="relative mb-6"
                            variants={fadeInScale}
                            initial="initial"
                            animate="animate"
                        >
                            <motion.div
                                className="w-20 h-20 rounded-full flex items-center justify-center relative border border-white/10"
                                variants={centerPulse}
                                animate="animate"
                                style={{
                                    background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                                }}
                            >
                                <BarChart2 size={32} className="text-white" />
                            </motion.div>

                            {/* Simplified satellites - no complex positioning */}
                            {[Shield, Database, TrendingUp].map((IconComponent, index) => {
                                const positions = [
                                    { left: '15px', top: '15px' },
                                    { right: '15px', top: '15px' },
                                    { left: '50%', bottom: '15px', transform: 'translateX(-50%)' }
                                ];
                                const colors = [
                                    '#10b981',
                                    '#06b6d4', 
                                    '#8b5cf6'
                                ];

                                return (
                                    <motion.div
                                        key={index}
                                        className="absolute w-6 h-6 rounded-full flex items-center justify-center border border-white/20"
                                        style={{
                                            ...positions[index],
                                            backgroundColor: colors[index],
                                            boxShadow: `0 2px 8px ${colors[index]}40`
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

                        {/* Simplified text content */}
                        <motion.div
                            className="text-center"
                            variants={fadeInScale}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-2xl font-light text-gray-50 mb-2 tracking-wide">
                                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent font-medium">
                                    stable wealth
                                </span>
                            </h2>
                            <p className="text-sm text-gray-400 mb-5 font-light">Initializing market data</p>

                            {/* Simplified loading dots */}
                            <div className="flex items-center justify-center gap-2 mb-5">
                                {[0, 1, 2].map((index) => (
                                    <motion.div
                                        key={index}
                                        className="w-2 h-2 rounded-full bg-blue-400"
                                        animate={{
                                            opacity: [0.3, 1, 0.3],
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

                            {/* Static security indicator */}
                            <motion.div
                                className="flex items-center justify-center gap-2 text-sm text-gray-400 font-light"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                            >
                                <span>Secure connection</span>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-80" />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingIndicator;