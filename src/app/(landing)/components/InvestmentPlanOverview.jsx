"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ArrowRight, Zap, Sparkles, TrendingUp, ShieldCheck, Users } from "lucide-react"
import Link from "next/link"
import { motion, useAnimation, AnimatePresence } from "framer-motion"

export default function InvestmentPlansOverview() {
    const [activePlan, setActivePlan] = useState("growth")
    const [isInView, setIsInView] = useState(false)
    const sectionRef = useRef(null)
    const controls = useAnimation()

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    controls.start("visible")
                    observer.disconnect()
                }
            },
            { threshold: 0.1 },
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.disconnect()
            }
        }
    }, [controls])

    const plans = [
        {
            id: "starter",
            name: "Starter",
            description: "Precision-driven entry-level trading",
            price: "$100",
            returnRate: "5-8%",
            featured: false,
            icon: TrendingUp,
            features: [
                { text: "AI trading signals", included: true },
                { text: "5 crypto assets", included: true },
                { text: "Weekly reports", included: true },
                { text: "Basic support", included: true },
                { text: "Risk management", included: false },
                { text: "Priority withdrawals", included: false },
            ],
            color: "primary",
            gradient: "from-primary-500 to-primary-700",
        },
        {
            id: "growth",
            name: "Growth",
            description: "Sophisticated trading strategies",
            price: "$500",
            returnRate: "8-12%",
            featured: true,
            icon: ShieldCheck,
            features: [
                { text: "AI trading signals", included: true },
                { text: "15 crypto assets", included: true },
                { text: "Daily insights", included: true },
                { text: "Priority support", included: true },
                { text: "Advanced risk management", included: true },
                { text: "Standard withdrawals", included: false },
            ],
            color: "secondary",
            gradient: "from-secondary-500 to-secondary-700",
        },
        {
            id: "premium",
            name: "Premium",
            description: "Elite investment ecosystem",
            price: "$1,000",
            returnRate: "12-18%",
            featured: false,
            icon: Users,
            features: [
                { text: "AI trading signals", included: true },
                { text: "Full crypto portfolio", included: true },
                { text: "Real-time dashboard", included: true },
                { text: "24/7 dedicated support", included: true },
                { text: "Advanced risk management", included: true },
                { text: "Priority withdrawals", included: true },
            ],
            color: "accent",
            gradient: "from-accent-500 to-accent-700",
        },
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12
            }
        }
    }

    const featureVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: i => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: "easeInOut"
            }
        })
    }

    const backgroundVariants = {
        hidden: { scale: 0.95, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: "easeInOut"
            }
        }
    }

    return (
        <motion.section
            ref={sectionRef}
            className="py-12 sm:py-16 md:py-24 relative overflow-hidden bg-neutral-50 dark:bg-neutral-900"
            initial="hidden"
            animate={controls}
            variants={containerVariants}
        >
            {/* Sophisticated Background Texture */}
            <motion.div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)',
                    backgroundSize: '15px 15px'
                }}
                variants={backgroundVariants}
            ></motion.div>

            {/* Subtle Gradient Overlay */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-secondary-50/10 to-accent-50/10 dark:from-primary-900/10 dark:via-secondary-900/5 dark:to-accent-900/5 opacity-100"
                variants={backgroundVariants}
            ></motion.div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <motion.div
                    variants={itemVariants}
                    className="text-center mb-10 sm:mb-16"
                >
                    <motion.div
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-1 sm:py-1.5 mb-4 sm:mb-6 rounded-full bg-white dark:bg-neutral-800 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-md"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
                        </span>
                        AI-Powered Trading
                    </motion.div>

                    <motion.h2
                        className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 dark:from-primary-400 dark:via-secondary-400 dark:to-accent-400"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.7, ease: "easeInOut" }}
                    >
                        Investment Ecosystem
                    </motion.h2>

                    <motion.p
                        className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto font-accent"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.7, ease: "easeInOut" }}
                    >
                        Precision-engineered investment strategies powered by advanced AI and machine learning
                    </motion.p>
                </motion.div>

                {/* Plan Selector */}
                <motion.div
                    variants={itemVariants}
                    className="flex justify-center mb-8 sm:mb-12 overflow-x-auto px-2 py-1"
                >
                    <motion.div
                        className="inline-flex p-1 rounded-xl sm:rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5, ease: "easeInOut" }}
                    >
                        {plans.map((plan, index) => (
                            <motion.button
                                key={plan.id}
                                onClick={() => setActivePlan(plan.id)}
                                className={`relative px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-base md:text-lg font-medium transition-all duration-300 group ${activePlan === plan.id
                                    ? `bg-gradient-to-br ${plan.gradient} text-white shadow-xl`
                                    : "text-black mx-1 sm:mx-2 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    }`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + (index * 0.1), duration: 0.5 }}
                                whileHover={{ scale: activePlan !== plan.id ? 1.05 : 1 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex flex-col mx-1 sm:mx-2 items-center">
                                    {plan.name}
                                    {plan.featured && (
                                        <motion.span
                                            className={`text-[10px] sm:text-xs bg-secondary-500/30 font-medium p-0.5 sm:p-1 px-1.5 sm:px-2 rounded-full ${activePlan === plan.id ? 'text-white' : 'text-white'} mt-1`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1.2, duration: 0.3 }}
                                        >
                                            Recommended
                                        </motion.span>
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Active Plan Details */}
                <motion.div
                    variants={itemVariants}
                    className="max-w-4xl mx-auto"
                >
                    <AnimatePresence mode="wait">
                        {plans.map(
                            (plan) =>
                                activePlan === plan.id && (
                                    <motion.div
                                        key={plan.id}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {/* Plan Details Card */}
                                        <motion.div
                                            className="bg-white dark:bg-neutral-800/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200/60 dark:border-neutral-700/60 relative overflow-hidden"
                                            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {plan.featured && (
                                                <motion.div
                                                    className="absolute top-4 sm:top-6 right-4 sm:right-6"
                                                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                                    transition={{ delay: 0.3, duration: 0.5 }}
                                                >
                                                    <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400">
                                                        Recommended
                                                    </span>
                                                </motion.div>
                                            )}

                                            <motion.div
                                                className="flex items-center mb-4 sm:mb-6"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2, duration: 0.5 }}
                                            >
                                                <motion.div
                                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white mr-3 sm:mr-4 shadow-md"
                                                    whileHover={{ rotate: 5, scale: 1.05 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <plan.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                                                </motion.div>
                                                <div>
                                                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
                                                        {plan.name}
                                                    </h3>
                                                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-accent">
                                                        {plan.description}
                                                    </p>
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                className="flex items-baseline mb-6 sm:mb-8"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3, duration: 0.5 }}
                                            >
                                                <span className="text-3xl sm:text-4xl font-display font-bold text-primary-600 dark:text-primary-400">
                                                    {plan.price}
                                                </span>
                                                <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 ml-2 font-accent">
                                                    minimum investment
                                                </span>
                                            </motion.div>

                                            <motion.div
                                                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-6 sm:mb-8 text-sm"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.4, duration: 0.5 }}
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                                <span className="font-medium">{plan.returnRate} monthly returns</span>
                                            </motion.div>

                                            <Link href={`/plans/${plan.id}`}>
                                                <motion.button
                                                    className="w-full py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:opacity-90 transition-all duration-300 shadow-xl rounded-lg sm:rounded-xl flex items-center justify-center group"
                                                    whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                                                    whileTap={{ scale: 0.98 }}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.5, duration: 0.5 }}
                                                >
                                                    <span className="font-accent">Explore {plan.name} Plan</span>
                                                    <motion.div
                                                        animate={{ x: [0, 5, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                                                    >
                                                        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                                    </motion.div>
                                                </motion.button>
                                            </Link>
                                        </motion.div>

                                        {/* Features List */}
                                        <motion.div
                                            className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3, duration: 0.5 }}
                                            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                                        >
                                            <motion.h4
                                                className="text-base sm:text-lg font-display font-bold mb-4 sm:mb-6 text-neutral-900 dark:text-white"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4, duration: 0.5 }}
                                            >
                                                Key Features
                                            </motion.h4>

                                            <motion.div
                                                className="space-y-3 sm:space-y-4"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                {plan.features.map((feature, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        custom={idx}
                                                        variants={featureVariants}
                                                        className={`flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 ${feature.included
                                                            ? "hover:bg-primary-100 dark:hover:bg-primary-800"
                                                            : "opacity-50"
                                                            }`}
                                                        whileHover={feature.included ? { x: 5 } : {}}
                                                    >
                                                        <motion.div
                                                            className={`flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full ${feature.included
                                                                ? "bg-primary-300 text-white"
                                                                : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                                                                }`}
                                                            whileHover={feature.included ? { scale: 1.2, rotate: 5 } : {}}
                                                        >
                                                            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                        </motion.div>
                                                        <span
                                                            className={
                                                                feature.included
                                                                    ? "text-sm sm:text-base text-gray-800 dark:text-gray-200 font-accent"
                                                                    : "text-sm sm:text-base text-gray-500 dark:text-gray-500 line-through font-accent"
                                                            }
                                                        >
                                                            {feature.text}
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                ),
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Enterprise Solutions */}
                <motion.div
                    variants={itemVariants}
                    className="mt-12 sm:mt-16 md:mt-20 max-w-4xl mx-auto"
                >
                    <motion.div
                        className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xl relative overflow-hidden"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.7, ease: "easeInOut" }}
                        whileHover={{
                            y: -5,
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            transition: { duration: 0.3 }
                        }}
                    >
                        <motion.div
                            className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-[0.15]"
                            style={{
                                backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)',
                                backgroundSize: '10px 10px'
                            }}
                            animate={{
                                backgroundPosition: ['0px 0px', '10px 10px'],
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        ></motion.div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                            <motion.div
                                className="flex-shrink-0"
                                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                whileHover={{ rotate: 5, scale: 1.1 }}
                            >
                                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-lg">
                                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                                </div>
                            </motion.div>

                            <div className="flex-grow text-center md:text-left">
                                <motion.h3
                                    className="text-lg sm:text-xl md:text-2xl font-display font-bold mb-2 sm:mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.1, duration: 0.5 }}
                                >
                                    Institutional Solutions
                                </motion.h3>

                                <motion.p
                                    className="text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6 max-w-xl font-accent"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2, duration: 0.5 }}
                                >
                                    Bespoke investment strategies crafted for institutional investors, family offices, and high-net-worth individuals with comprehensive risk management and strategic advisory services.
                                </motion.p>

                                <Link href="/enterprise">
                                    <motion.button
                                        className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 text-primary-600 dark:text-primary-400 hover:opacity-90 transition-all duration-300 shadow-md flex items-center group text-sm sm:text-base"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.3, duration: 0.5 }}
                                        whileHover={{ scale: 1.05, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="font-accent">Request Consultation</span>
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                                        >
                                            <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </motion.div>
                                    </motion.button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.section>
    )
}