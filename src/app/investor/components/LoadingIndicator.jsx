import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BarChart2, TrendingUp, Database } from 'lucide-react';

const LoadingIndicator = () => {
    // Animation variants
    const fadeInUp = {
        initial: { y: 10, opacity: 0 },
        animate: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" }
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
                duration: 15, // Changed to match rotation speed for symmetry
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    const pulse = {
        animate: {
            scale: [1, 1.02, 1],
            opacity: [0.92, 1, 0.92],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const drawCircle = {
        initial: { pathLength: 0 },
        animate: {
            pathLength: 1,
            transition: {
                duration: 2,
                ease: "easeInOut",
                delay: 0.5
            }
        }
    };

    const shimmer = {
        animate: {
            rotate: [0, 360],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "linear"
            }
        }
    };

    // Satellite dot animation for consistent appearance
    const satelliteDotVariants = {
        initial: { scale: 0, opacity: 0 },
        animate: (custom) => ({
            scale: 1,
            opacity: 1,
            transition: { delay: 0.6 + (custom * 0.2), duration: 0.3 }
        })
    };

    return (
        // Full screen container for absolute centering
        <div className="h-full w-full flex items-center justify-center bg-gray-900/95">
            {/* Main circular component container */}
            <motion.div
                className="relative flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                {/* Outer glow effect */}
                <div className="absolute inset-0 bg-blue-900/20 rounded-full blur-2xl" />

                {/* Main circular area */}
                <motion.div className="relative flex flex-col items-center justify-center">
                    {/* Outer decorative rings */}
                    <div className="relative w-80 h-80">
                        {/* Outermost ring with dashes */}
                        <motion.div
                            className="absolute inset-0 w-full h-full"
                            variants={rotate}
                            animate="animate"
                        >
                            <svg width="100%" height="100%" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="outerRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="50%" stopColor="#6366F1" />
                                        <stop offset="100%" stopColor="#4F46E5" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    cx="50" cy="50" r="49"
                                    fill="none"
                                    stroke="url(#outerRingGradient)"
                                    strokeWidth="0.5"
                                    strokeDasharray="1 2"
                                />
                            </svg>
                        </motion.div>

                        {/* Second ring with subtle gradient */}
                        <motion.div
                            className="absolute inset-0 w-full h-full"
                            style={{ margin: '15px' }}
                            variants={rotateReverse}
                            animate="animate"
                        >
                            <svg width="100%" height="100%" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="secondRingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.1" />
                                        <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.1" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    cx="50" cy="50" r="49"
                                    fill="none"
                                    stroke="url(#secondRingGradient)"
                                    strokeWidth="1"
                                />
                            </svg>
                        </motion.div>

                        {/* Third ring with progress indicator */}
                        <div className="absolute inset-0 w-full h-full" style={{ margin: '30px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle
                                    cx="50" cy="50" r="48"
                                    fill="none"
                                    stroke="#1e293b"
                                    strokeWidth="2"
                                />

                                {/* Progress circle */}
                                <motion.circle
                                    cx="50" cy="50" r="48"
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeDasharray="302"
                                    strokeDashoffset="100"
                                    variants={drawCircle}
                                    initial="initial"
                                    animate="animate"
                                />
                            </svg>

                            {/* Shimmer effect on the progress ring */}
                            <motion.div
                                className="absolute inset-0 w-full h-full"
                                variants={shimmer}
                                animate="animate"
                            >
                                <svg width="100%" height="100%" viewBox="0 0 100 100">
                                    <defs>
                                        <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
                                            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <circle
                                        cx="50" cy="50" r="48"
                                        fill="none"
                                        stroke="url(#shimmerGradient)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray="50 252"
                                    />
                                </svg>
                            </motion.div>
                        </div>

                        {/* Inner content area - perfectly centered */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {/* Main center circle with chart icon */}
                            <motion.div
                                className="relative mb-4"
                                variants={fadeInUp}
                                initial="initial"
                                animate="animate"
                            >
                                <motion.div
                                    className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-lg flex items-center justify-center"
                                    variants={pulse}
                                    animate="animate"
                                >
                                    <BarChart2 size={38} className="text-white" />
                                </motion.div>

                                {/* Satellite dots positioned evenly at angles */}
                                <motion.div
                                    className="absolute w-5 h-5 bg-green-400 rounded-full flex items-center justify-center shadow-lg"
                                    style={{
                                        top: '-6px',
                                        right: '-6px'
                                    }}
                                    custom={0}
                                    variants={satelliteDotVariants}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <Shield size={10} className="text-gray-900" />
                                </motion.div>

                                <motion.div
                                    className="absolute w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center shadow-lg"
                                    style={{
                                        bottom: '-6px',
                                        left: '-6px'
                                    }}
                                    custom={1}
                                    variants={satelliteDotVariants}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <Database size={10} className="text-gray-900" />
                                </motion.div>

                                <motion.div
                                    className="absolute w-5 h-5 bg-indigo-400 rounded-full flex items-center justify-center shadow-lg"
                                    style={{
                                        bottom: '-6px',
                                        right: '-6px'
                                    }}
                                    custom={2}
                                    variants={satelliteDotVariants}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <TrendingUp size={10} className="text-gray-900" />
                                </motion.div>

                                {/* Added fourth satellite for perfect symmetry */}
                                <motion.div
                                    className="absolute w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center shadow-lg"
                                    style={{
                                        top: '-6px',
                                        left: '-6px'
                                    }}
                                    custom={3}
                                    variants={satelliteDotVariants}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <Shield size={10} className="text-gray-900" />
                                </motion.div>
                            </motion.div>

                            {/* Text indicators - perfectly centered */}
                            <motion.div
                                className="text-center"
                                variants={fadeInUp}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-lg font-medium text-gray-50 mb-1">
                                    <span className="text-lg font-medium bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">stable wealth</span>
                                    <span className="ml-1">Investment Portal</span>
                                </h2>
                                <p className="text-xs text-gray-400 mb-3">Initializing market data</p>

                                {/* Status indicator - evenly spaced dots */}
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                    <motion.div
                                        className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                                        animate={{
                                            opacity: [0.4, 1, 0.4],
                                            scale: [0.8, 1.2, 0.8],
                                        }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                                    />
                                    <motion.div
                                        className="w-1.5 h-1.5 bg-indigo-500 rounded-full"
                                        animate={{
                                            opacity: [0.4, 1, 0.4],
                                            scale: [0.8, 1.2, 0.8],
                                        }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                                    />
                                    <motion.div
                                        className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                                        animate={{
                                            opacity: [0.4, 1, 0.4],
                                            scale: [0.8, 1.2, 0.8],
                                        }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
                                    />
                                </div>

                                {/* Security indicator */}
                                <motion.div
                                    className="text-xs text-gray-400 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2 }}
                                >
                                    <span className="mr-1">Secure connection</span>
                                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LoadingIndicator;