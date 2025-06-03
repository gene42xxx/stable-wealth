'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, DollarSign, Clock, BarChart4, HelpCircle, Lock, MessageCircle } from 'lucide-react';

const FAQSection = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(0);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const faqCategories = [
        {
            category: "Investment Security",
            icon: <Shield className="text-primary-600" size={20} />,
            items: [
                {
                    question: "How does Stable Wealth ensure the security of my USDT investments?",
                    answer: "Stable Wealth employs institutional-grade security protocols including cold storage solutions, multi-signature authorization, and partnerships with regulated custodians like Fireblocks. Our risk management system operates 24/7 with automated circuit breakers to prevent anomalies. We maintain a 100% reserve policy with regular third-party audits published quarterly. Additionally, all client assets are segregated from operational funds, and we hold comprehensive insurance coverage against cybersecurity incidents."
                },
                {
                    question: "What risk management protocols does Stable Wealth implement?",
                    answer: "Our multi-layered risk management framework includes position diversification across uncorrelated markets, smart contract audits by leading security firms, real-time monitoring systems with AI-powered anomaly detection, and predetermined risk thresholds with automatic position adjustments. We maintain significant liquidity reserves of at least 40% and conduct stress testing under various market conditions. Our risk committee includes former financial regulators and institutional risk management experts who review all protocols quarterly."
                }
            ]
        },
        {
            category: "Returns & Performance",
            icon: <BarChart4 className="text-primary-600" size={20} />,
            items: [
                {
                    question: "What returns can I expect from my USDT investment with Stable Wealth?",
                    answer: "Stable Wealth's USDT investment vehicles deliver annualized yields between 8-12% depending on your selected strategy and prevailing market conditions. Our Conservative Portfolio historically averages 8.4% with minimal volatility, while our Balanced Portfolio targets 10.2% by incorporating moderate yield farming strategies. For qualified investors, our Premium Portfolio has achieved consistent 12.3% returns through strategic DeFi positioning. All performance data is transparent and accessible within your dashboard, with returns distributed monthly or compounded based on your preference."
                },
                {
                    question: "How are these stable returns generated in volatile crypto markets?",
                    answer: "Stable Wealth generates consistent returns through a strategic combination of stablecoin-to-stablecoin liquidity provision, overcollateralized lending on established platforms, arbitrage opportunities across decentralized exchanges, delta-neutral strategies through balanced long-short positions, and treasury bond yield farming via tokenized securities. This diversification across multiple low-correlation revenue streams enables us to maintain stability regardless of broader market volatility. Our algorithms continuously rebalance allocations to optimize for consistent returns while maintaining strict risk parameters."
                }
            ]
        },
        {
            category: "Account Management",
            icon: <DollarSign className="text-primary-600" size={20} />,
            items: [
                {
                    question: "Is there a minimum investment amount required to join Stable Wealth?",
                    answer: "Stable Wealth offers tiered investment options starting at 500 USDT for our Essentials account, providing access to our core investment strategies and basic analytics. Our Advanced tier begins at 5,000 USDT and includes enhanced yield opportunities, priority withdrawal processing, and personalized portfolio consultation. For sophisticated investors, our Elite tier starts at 25,000 USDT and features exclusive high-yield opportunities, dedicated investment advisors, and customized portfolio construction. All tiers benefit from our enterprise-grade security infrastructure and transparent reporting."
                },
                {
                    question: "How can I withdraw my USDT investments and earnings?",
                    answer: "Withdrawals can be initiated at any time through our secure client portal. Essential tier withdrawals are processed within 72 hours with no fees for scheduled monthly withdrawals (2.5% fee for unscheduled withdrawals). Advanced tier clients enjoy 24-hour processing and three fee-free unscheduled withdrawals quarterly. Elite members receive priority same-day processing when requested before 2 PM UTC and unlimited fee-free withdrawals. All withdrawals undergo our security verification protocol, and funds are transferred directly to your registered wallet address or exchange account."
                }
            ]
        },
        {
            category: "Strategy & Diversification",
            icon: <Clock className="text-primary-600" size={20} />,
            items: [
                {
                    question: "What USDT investment strategies does Stable Wealth offer?",
                    answer: "Stable Wealth provides a spectrum of USDT investment strategies tailored to different risk preferences. Our Conservative allocation (60% lending, 30% liquidity provision, 10% yield farming) emphasizes capital preservation. The Balanced portfolio (40% lending, 40% liquidity provision, 20% strategic positions) offers moderate growth potential. Our Growth allocation (30% lending, 30% liquidity provision, 40% optimized yield farming) maximizes returns while maintaining reasonable risk parameters. Each strategy employs proprietary algorithms for continuous optimization, and clients can customize their allocation or opt for our AI-powered Smart Portfolio that adapts to market conditions automatically."
                },
                {
                    question: "How does Stable Wealth's approach differ from traditional finance?",
                    answer: "Stable Wealth bridges traditional financial expertise with DeFi innovation. Unlike conventional investments requiring intermediaries, our platform provides direct access to sophisticated USDT strategies previously available only to institutional investors. We eliminate the overhead costs of traditional finance while offering superior transparency—all positions and yield sources are verifiable on-chain. Moreover, our investments operate continuously (24/7/365) rather than being restricted to market hours, allowing for real-time optimization and higher capital efficiency. Finally, our programmable smart contracts automate execution, reducing human error and ensuring consistent implementation of investment strategies."
                }
            ]
        }
    ];

    return (
        <section id='faq' className="py-24 bg-gradient-to-b from-white to-slate-50">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <div className="inline-block mb-4 px-4 py-1 bg-primary-50 text-primary-600 rounded-full font-medium text-sm">
                        Knowledge Center
                    </div>
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-neutral-900 mb-5 tracking-tight leading-tight">
                        Frequently Asked <span className="text-primary-600">Questions</span>
                    </h2>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-light font-accent">
                        Everything you need to know about securing your financial future with Stable Wealth's USDT investments
                    </p>
                </div>

                {/* Mobile-friendly Category tabs */}
                <div className="mb-10">
                    {/* Desktop tabs */}
                    <div className="hidden md:flex justify-center">
                        <div className="inline-flex bg-slate-100 p-1 rounded-xl shadow-sm">
                            {faqCategories.map((category, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedCategory(index)}
                                    className={`flex items-center px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${selectedCategory === index
                                            ? 'bg-white text-primary-600 shadow-sm'
                                            : 'text-slate-600 hover:text-primary-500'
                                        }`}
                                >
                                    <span className="mr-2">{category.icon}</span>
                                    {category.category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile-optimized tabs */}
                    <div className="md:hidden">
                        <div className="relative">
                            {/* Gradient indicators for scroll */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                            {/* Scrollable tab container */}
                            <div className="flex overflow-x-auto py-2 no-scrollbar">
                                <div className="inline-flex bg-slate-200 p-1 rounded-xl shadow-sm mx-auto">
                                    {faqCategories.map((category, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedCategory(index)}
                                            className={`flex items-center px-4 py-2 rounded-lg text-sm whitespace-nowrap font-medium transition-all duration-300 min-w-max mx-1 ${selectedCategory === index
                                                    ? 'bg-white text-primary-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-primary-500'
                                                }`}
                                        >
                                            <span className="mr-2">{category.icon}</span>
                                            {category.category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FAQ items */}
                <div className="mt-8 space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedCategory}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl shadow border border-slate-100 overflow-hidden"
                        >
                            <div className="p-4 md:p-6">
                                {faqCategories[selectedCategory].items.map((item, itemIndex) => {
                                    const index = `${selectedCategory}-${itemIndex}`;
                                    const isActive = activeIndex === index;

                                    return (
                                        <div
                                            key={itemIndex}
                                            className="mb-3 last:mb-0"
                                        >
                                            <button
                                                onClick={() => toggleFAQ(index)}
                                                className={`flex justify-between items-center w-full p-4 md:p-5 rounded-xl text-left focus:outline-none transition-all duration-300 ${isActive
                                                        ? 'bg-primary-50 '
                                                        : 'hover:bg-slate-50'
                                                    }`}
                                                aria-expanded={isActive}
                                            >
                                                <h4 className="font-medium text-base md:text-lg font-display text-neutral-800 pr-4 md:pr-6">
                                                    {item.question}
                                                </h4>
                                                <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 ${isActive
                                                        ? 'bg-primary-500 text-white rotate-180'
                                                        : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    <ChevronDown size={16} />
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-4 md:p-5 pt-2">
                                                            <div className="h-px w-full bg-slate-100 mb-4"></div>
                                                            <p className="text-sm md:text-base text-neutral-600 leading-relaxed font-accent">
                                                                {item.answer}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Help section */}
                <div className="mt-16">
                    <div className="relative p-6 md:p-8 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-xl">
                        {/* Abstract shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-16 -mr-16"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
                        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-white opacity-5 rounded-full"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                            <div className="mb-6 md:mb-0 md:mr-8 max-w-xl">
                                <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-10 rounded-full mb-5">
                                    <HelpCircle size={16} className="mr-2" />
                                    <span className="text-sm font-medium">24/7 Support</span>
                                </div>
                                <h3 className="text-2xl font-display md:text-3xl font-bold mb-3 text-white">
                                    Still have questions?
                                </h3>
                                <p className="text-white font-accent text-opacity-90 leading-relaxed mb-0">
                                    Our dedicated investment specialists are ready to provide personalized guidance for your USDT investment strategy and answer any specific questions you may have.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button className="bg-white  font-accent bg-opacity-10 hover:bg-opacity-20 text-white border border-white border-opacity-20 font-medium py-3 px-6 rounded-xl transition-all duration-300 backdrop-blur-sm flex items-center justify-center">
                                    <Lock size={18} className="mr-2" />
                                    Schedule Consultation
                                </button>
                                <button className="bg-white font-accent  text-primary-600 font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center">
                                    <MessageCircle size={18} className="mr-2" />
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;