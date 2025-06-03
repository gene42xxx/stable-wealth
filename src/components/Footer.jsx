"use client"
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Send, Layers, Globe, ShieldCheck } from 'lucide-react';
import { useState } from 'react'; // Import useState

export default function Footer() {
    const [email, setEmail] = useState(''); // Set state for email

    const footerLinks = {
        Company: [
            { name: 'About Us', href: '/about/our-story' },
            { name: 'Our Team', href: '/about/team' },
            { name: 'Security', href: '/about/security' }
        ],
        Investments: [
            { name: 'Investment Plans', href: '/plans' },
            { name: 'Performance', href: '/performance' },
            { name: 'How It Works', href: '/how-it-works' },
        ],
        Resources: [
            { name: 'FAQ', href: '/#faq' },
         
        ],
        Legal: [
            { name: 'Terms of Service', href: '/' },
            { name: 'Privacy Policy', href: '/' },
            { name: 'Compliance', href: '/' },
            { name: 'Cookies', href: '/' }
        ]
    };

    const featureHighlights = [
        {
            icon: Layers,
            title: 'Diversified Strategies',
            description: 'Intelligent portfolio diversification across multiple asset classes.'
        },
        {
            icon: Globe,
            title: 'Global Investment',
            description: 'Access to international markets and emerging opportunities.'
        },
        {
            icon: ShieldCheck,
            title: 'Risk Protection',
            description: 'Advanced risk management techniques to safeguard your investments.'
        }
    ];

    return (
        <div className="bg-gradient-to-br from-gray-900 to-primary-900 text-white py-16">
            <div className="container w-full px-6 lg:px-[8rem]">
                {/* Top Section with Feature Highlights */}
                <div className="grid md:grid-cols-3 gap-8 mb-12 border-b border-white/10 pb-12">
                    {featureHighlights.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="flex items-start space-x-4 group"
                        >
                            <feature.icon
                                className="text-primary-500 group-hover:text-accent-400 transition-colors duration-300"
                                size={40}
                                strokeWidth={1.5}
                            />
                            <div>
                                <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-300 text-sm">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Links Grid */}
                <div className="grid md:grid-cols-5 gap-8 mb-12">
                    {/* Logo and Description */}
                    <div className="md:col-span-2">
                        <div className="flex items-center mb-4">
                            <img src="/logo.png" alt="StableWealth" className="h-16 mr-3" />
                        </div>
                        <p className="text-gray-300 mb-6">
                            Empowering investors with intelligent, data-driven investment strategies
                            and comprehensive financial solutions.
                        </p>

                        {/* Newsletter Signup */}
                        <div className="bg-white/10 rounded-lg p-4">
                            <h4 className="text-lg font-display font-semibold mb-3">Stay Updated</h4>
                            <div className="flex">
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    value={email}
                                    suppressHydrationWarning
                                    onChange={(e) => setEmail(e.target.value)} // Update email state
                                    className="flex-grow bg-transparent border border-white/20 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button className="bg-primary-600 text-white px-4 rounded-r-xl hover:bg-accent-400 transition-colors">
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-lg font-semibold font-display mb-4 border-b border-white/20 pb-2">
                                {category}
                            </h4>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-300 hover:text-white flex items-center group transition-colors"
                                        >
                                            <ChevronRight
                                                size={16}
                                                className="mr-2 text-primary-500 opacity-0 group-hover:opacity-100 transition-all"
                                            />
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-6 h-full w-full flex items-center justify-center">
                    <p className="text-gray-400 text-sm text-center">
                        © {new Date().getFullYear()} StableWealth. All Rights Reserved.
                        Regulated and Licensed Financial Investment Platform.
                    </p>
                </div>
            </div>
        </div>
    );
}