'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const DesktopCryptoDashboard = () => {
    const [isClient, setIsClient] = useState(false);
    const [activeTimeframe, setActiveTimeframe] = useState('1D');
    const containerRef = useRef(null);

    useEffect(() => {
        setIsClient(true); // Ensure this only runs on client side
    }, []);

    // Crypto data
    const cryptoData = [
        { symbol: 'BTC', name: 'Bitcoin', price: '$63,245.78', change: '+2.4%', changeValue: 2.4, volume: '$1.2B' },
        { symbol: 'ETH', name: 'Ethereum', price: '$3,412.50', change: '+1.2%', changeValue: 1.2, volume: '$850M' },
        { symbol: 'SOL', name: 'Solana', price: '$142.90', change: '-0.8%', changeValue: -0.8, volume: '$320M' },
        { symbol: 'USDT', name: 'Tether', price: '$1.00', change: '+0.01%', changeValue: 0.01, volume: '$42.8B' }
    ];

    // Timeframes for the chart
    const timeframes = ['1H', '4H', '12H', '1D', '1W'];

    return (
        <motion.div
            className="lg:col-span-6 hidden lg:block relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
            ref={containerRef}
        >
            <div className="relative  h-[400px] md:h-[500px]">
                {/* Glassmorphic Card */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-full bg-neutral-900/30 backdrop-blur-lg rounded-2xl border border-neutral-800/50 shadow-xl overflow-hidden"
                    initial={{ rotate: -1 }}
                    animate={{ rotate: 1 }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut"
                    }}
                >
                    {/* Dashboard Header */}
                    <div className="p-4 md:p-6 relative border-b border-neutral-800/30">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <div>
                                <div className="flex items-center mb-1">
                                    {isClient && (
                                        <span className="w-3 h-3 rounded-full bg-primary-500 mr-2 animate-pulse"></span>
                                    )}
                                    <h3 className="text-lg md:text-xl font-semibold text-white">Market Overview</h3>
                                    <span className="ml-3 px-2 py-1 bg-primary-900/30 text-primary-300 text-xs rounded-full">LIVE</span>
                                </div>
                                <p className="text-xs md:text-sm text-neutral-400">Real-time cryptocurrency analytics</p>
                            </div>
                            <div className="flex space-x-2 self-end md:self-auto">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 rounded-lg bg-primary-900/30 hover:bg-primary-800/50 transition-all flex items-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-700/50 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>

                        {/* Animated Status Bar */}
                        {isClient && (
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-primary-500 to-transparent"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror" }}
                            />
                        )}

                        {/* Timeframe Selector */}
                        <div className="flex space-x-1 mt-3 overflow-x-auto pb-1">
                            {timeframes.map((timeframe) => (
                                <motion.button
                                    key={timeframe}
                                    className={`text-xs px-2 py-1 rounded whitespace-nowrap ${activeTimeframe === timeframe
                                            ? 'bg-primary-500/20 text-primary-300'
                                            : 'text-neutral-400 hover:text-white'
                                        }`}
                                    whileHover={{ scale: activeTimeframe !== timeframe ? 1.05 : 1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveTimeframe(timeframe)}
                                >
                                    {timeframe}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Price Chart */}
                    <div className="relative h-40 md:h-48 mt-2 px-4 md:px-6">
                        {isClient && (
                            <div className="absolute inset-0">
                                <svg
                                    viewBox="0 0 400 180"
                                    className="w-full h-full"
                                    preserveAspectRatio="none"
                                >
                                    {/* Grid Lines */}
                                    <line x1="0" y1="30" x2="400" y2="30" stroke="#312363" strokeWidth="0.5" strokeDasharray="2,2" />
                                    <line x1="0" y1="90" x2="400" y2="90" stroke="#312363" strokeWidth="0.5" strokeDasharray="2,2" />
                                    <line x1="0" y1="150" x2="400" y2="150" stroke="#312363" strokeWidth="0.5" strokeDasharray="2,2" />

                                    {/* Animated Trend Line */}
                                    <motion.path
                                        d="M0,150 L50,120 L100,135 L150,100 L200,130 L250,90 L300,110 L350,70 L400,100"
                                        stroke="url(#chartGradient)"
                                        strokeWidth="2"
                                        fill="none"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{
                                            pathLength: 1,
                                            opacity: 1,
                                            d: [
                                                "M0,150 L50,120 L100,135 L150,100 L200,130 L250,90 L300,110 L350,70 L400,100",
                                                "M0,150 L50,130 L100,110 L150,130 L200,100 L250,120 L300,90 L350,110 L400,80",
                                                "M0,150 L50,120 L100,135 L150,100 L200,130 L250,90 L300,110 L350,70 L400,100"
                                            ]
                                        }}
                                        transition={{
                                            pathLength: { duration: 1.5, ease: "easeInOut" },
                                            d: { duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                                        }}
                                    />

                                    <defs>
                                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#7a59f7" />
                                            <stop offset="50%" stopColor="#cf33ff" />
                                            <stop offset="100%" stopColor="#254bfa" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        )}

                        {/* Current Price Indicator */}
                        {isClient && (
                            <motion.div
                                className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 bg-primary-900/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white flex items-center"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.5 }}
                            >
                                <span className="w-2 h-2 rounded-full bg-accent-500 mr-1"></span>
                                $63,245.78
                            </motion.div>
                        )}

                        <div className="absolute bottom-0 left-4 md:left-6 right-4 md:right-6 flex justify-between text-xs text-neutral-500">
                            {['1D', '1W', '1M', '1Y', 'ALL'].map((period) => (
                                <motion.span
                                    key={period}
                                    whileHover={{ color: '#ffffff' }}
                                    className="cursor-pointer text-[10px] md:text-xs"
                                >
                                    {period}
                                </motion.span>
                            ))}
                        </div>
                    </div>

                    {/* Market Stats */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4 px-4 md:px-6 mt-3 md:mt-4">
                        <motion.div
                            className="bg-neutral-900/40 p-3 md:p-4 rounded-xl border border-primary-900/30 relative overflow-hidden"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <p className="text-xs text-primary-400">Market Cap</p>
                            <p className="text-lg md:text-2xl font-medium text-white mt-1">$1.28T</p>
                            <div className="flex items-center mt-1 md:mt-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-accent-500 ml-1">+3.2% (24h)</span>
                            </div>
                        </motion.div>

                        <motion.div
                            className="bg-neutral-900/40 p-3 md:p-4 rounded-xl border border-secondary-900/30 relative overflow-hidden"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <p className="text-xs text-secondary-400">Volume (24h)</p>
                            <p className="text-lg md:text-2xl font-medium text-white mt-1">$68.4B</p>
                            <div className="flex items-center justify-between mt-1 md:mt-2">
                                <p className="text-xs text-neutral-400">USDT: 72%</p>
                                <div className="w-12 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-green-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: '72%' }}
                                        transition={{ delay: 0.8, duration: 20 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Top Assets */}
                    <div className="mt-4 md:mt-6 px-4 md:px-6 pb-4 md:pb-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 md:mb-3 gap-2">
                            <h4 className="text-sm font-medium text-white flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Top Performers
                            </h4>
                            <div className="flex items-center">
                                <select className="bg-neutral-900/50 border border-neutral-800/50 text-xs text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    <option>Market Cap</option>
                                    <option>Volume</option>
                                    <option>Performance</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {cryptoData.map((item, index) => (
                                <motion.div
                                    key={item.symbol}
                                    className="grid grid-cols-12 items-center p-2 md:p-3 bg-neutral-900/20 rounded-lg hover:bg-neutral-800/30 transition-colors cursor-pointer"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + index * 0.15 }}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div className="col-span-5 flex items-center space-x-2 md:space-x-3">
                                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${item.symbol === 'USDT' ? 'bg-green-900/20' :
                                                index % 2 === 0 ? 'bg-primary-900/20' : 'bg-accent-900/20'
                                            }`}>
                                            <span className="text-xs font-medium text-white">{item.symbol}</span>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                                            <p className="text-xs text-neutral-400 truncate">{item.volume} vol</p>
                                        </div>
                                    </div>
                                    <div className="col-span-3 text-right">
                                        <p className="text-sm font-medium text-white truncate">{item.price}</p>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <p className={`text-xs ${item.change.startsWith('+') ? 'text-accent-500' : 'text-red-400'
                                            }`}>
                                            {item.change}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="w-full h-6 relative">
                                            <svg viewBox="0 0 60 20" className="w-full h-full">
                                                <path
                                                    d={item.symbol === 'USDT' ?
                                                        "M0,10 L15,10 L30,10 L45,10 L60,10" :
                                                        "M0,15 L15,12 L30,8 L45,13 L60,10"}
                                                    stroke={item.change.startsWith('+') ? "#cf33ff" : "#ff3366"}
                                                    strokeWidth="1.5"
                                                    fill="none"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* View All Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full mt-3 py-2 text-xs text-primary-400 rounded-lg bg-primary-900/10 border border-primary-800/30 hover:bg-primary-800/20 transition-all"
                        >
                            View All Assets →
                        </motion.button>
                    </div>
                </motion.div>

                {/* Floating Elements - Client-side only */}
                {isClient && (
                    <>
                        <motion.div
                            className="absolute -top-10 -right-10 w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 opacity-10 blur-xl"
                            animate={{
                                y: [0, -15, 0],
                                x: [0, 10, 0],
                                opacity: [0.1, 0.15, 0.1]
                            }}
                            transition={{
                                duration: 12,
                                repeat: Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute -bottom-10 -left-10 w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 opacity-10 blur-xl"
                            animate={{
                                y: [0, 15, 0],
                                x: [0, -10, 0],
                                opacity: [0.1, 0.15, 0.1]
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut",
                                delay: 0.5
                            }}
                        />
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default DesktopCryptoDashboard;