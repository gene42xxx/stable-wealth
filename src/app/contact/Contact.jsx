'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ArrowRight, CheckCircle, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

// --- Animation Variants ---
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const fadeInLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const fadeInRight = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

// --- Helper: AnimateInView ---
const AnimateInView = ({ children, delay = 0, className = "", variants = fadeIn, amount = 0.2 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: amount });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// --- Main Contact Page Component ---
export default function ContactPage() {
    const [isClient, setIsClient] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // null | 'success' | 'error'
    const [activeField, setActiveField] = useState(null);

    useEffect(() => { setIsClient(true); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFocus = (field) => {
        setActiveField(field);
    };

    const handleBlur = () => {
        setActiveField(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setSubmitStatus(null);

        // Placeholder for actual form submission logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        const success = Math.random() > 0.2;

        if (success) {
            setSubmitStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setSubmitStatus(null), 5000);
        } else {
            setSubmitStatus('error');
            setTimeout(() => setSubmitStatus(null), 5000);
        }

        setIsSubmitting(false);
    };

    // Server Placeholder
    if (!isClient) {
        return <div className="bg-[#080A1A] min-h-screen"></div>;
    }

    return (
        <div className="bg-gradient-to-b from-[#080A1A] to-[#0F1125] text-gray-200 pt-10 font-accent overflow-x-hidden relative isolate min-h-screen">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                {/* Radial gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(25,27,52,0.5),transparent_70%)]"></div>

                {/* Animated gradients */}
                <div
                    className="absolute top-[5%] -right-[15%] w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] bg-gradient-to-bl from-purple-900/20 via-transparent to-transparent rounded-full blur-3xl opacity-40"

                ></div>

                <div
                    className="absolute bottom-[10%] -left-[15%] w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] bg-gradient-to-tr from-blue-900/20 via-transparent to-transparent rounded-full opacity-40 blur-3xl"

                ></div>

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxZTIxM2EiIGQ9Ik0wIDBINjBWNjBIMHoiLz48cGF0aCBkPSJNNjAgMzBDNjAgMTMuNDMxIDQ2LjU2OSAwIDMwIDBTMCAxMy40MzEgMCAzMHMxMy40MzEgMzAgMzAgMzAgMzAtMTMuNDMxIDMwLTMweiIgc3Ryb2tlPSIjMTgxYjJkIiBzdHJva2Utd2lkdGg9Ii41Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
            </div>

            {/* --- Page Hero Section --- */}
            <motion.section
                className="relative pt-40 pb-20 md:pt-48 md:pb-28 text-center overflow-hidden border-b border-gray-800/30"
                initial="hidden" animate="visible" variants={staggerContainer}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div variants={fadeIn} className="inline-block mb-4">
                        <div className="px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
                            Contact Us
                        </div>
                    </motion.div>

                    <motion.h1
                        variants={fadeIn}
                        className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-white"
                    >
                        Get In Touch
                    </motion.h1>

                    <motion.p
                        variants={fadeIn}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mt-6"
                    >
                        Have questions about our services? We're here to help you navigate with confidence.
                    </motion.p>
                </div>
            </motion.section>

            {/* --- Main Content Section --- */}
            <section className="py-16 md:py-24 relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
                        {/* Left Column: Contact Info */}
                        <motion.div
                            className="lg:col-span-5"
                            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}
                        >
                            <AnimateInView variants={fadeInLeft}>
                                <h2 className="text-2xl md:text-3xl font-display font-semibold text-white mb-6">
                                    Contact Information
                                </h2>
                                <p className="text-gray-400 mb-8 leading-relaxed">
                                    Find our contact details below or use the form to send us a message directly. We aim to respond within 24 business hours.
                                </p>
                            </AnimateInView>

                            <AnimateInView delay={0.1} variants={fadeInLeft} className="space-y-6">
                                {/* Email */}
                                <motion.div
                                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-indigo-900/10 transition-colors duration-300 border border-transparent hover:border-indigo-500/20"
                                    whileHover={{ x: 5 }}
                                >
                                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
                                        <Mail size={20} className="text-indigo-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white text-base mb-1">Email</h4>
                                        <a
                                            href="mailto:support@stablewealth.com"
                                            className="text-gray-300 hover:text-white text-sm transition-colors group flex items-center"
                                        >
                                            support@stablewealth.com
                                            <ArrowRight size={14} className="ml-1.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </a>
                                    </div>
                                </motion.div>

                            

                                {/* Address */}
                                <motion.div
                                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-purple-900/10 transition-colors duration-300 border border-transparent hover:border-purple-500/20"
                                    whileHover={{ x: 5 }}
                                >
                                    <div className="flex-shrink-0 w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/5">
                                        <MapPin size={20} className="text-purple-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white text-base mb-1">US Office Location</h4>
                                        <p className="text-gray-300 text-sm">
                                            676 Woodland Square Loop SE<br />
                                            Suite 302W <br />
                                            Lacey, WA 98503
                                        </p>
                                    </div>
                                </motion.div>          

                                {/* Address */}
                                <motion.div
                                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-purple-900/10 transition-colors duration-300 border border-transparent hover:border-purple-500/20"
                                    whileHover={{ x: 5 }}
                                >
                                    <div className="flex-shrink-0 w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/5">
                                        <MapPin size={20} className="text-purple-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white text-base mb-1">UK Office Location</h4>
                                        <p className="text-gray-300 text-sm">
                                            International House<br />
                                            6 South Molton Street<br />
                                            London <br />
                                            W1K 5QF
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimateInView>

                            {/* FAQ Link */}
                            <AnimateInView delay={0.2} variants={fadeInLeft} className="mt-12 pt-8 border-t border-gray-800/40">
                                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 hover:border-gray-700/50 transition-colors duration-300 shadow-lg">
                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                                        <HelpCircle size={20} className="mr-2 text-indigo-400" /> Frequently Asked Questions
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Have a common question? Check our FAQ section for quick answers to popular inquiries.
                                    </p>
                                    <Link
                                        href="/faq"
                                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center group bg-indigo-500/10 px-4 py-2 rounded-lg hover:bg-indigo-500/20"
                                    >
                                        Visit FAQ Page
                                        <ArrowRight size={14} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </AnimateInView>
                        </motion.div>

                        {/* Right Column: Contact Form */}
                        <motion.div
                            className="lg:col-span-7 bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl"
                            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInRight}
                        >
                            {/* Form Header */}
                            <div className="relative h-16 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 flex items-center px-8">
                                <h2 className="text-xl font-display font-semibold text-white">Send Us a Message</h2>
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent"></div>
                            </div>

                            {/* Form Body */}
                            <div className="p-6 md:p-8 lg:p-10">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name Field */}
                                    <div className="relative">
                                        <label
                                            htmlFor="name"
                                            className={`block text-sm font-medium mb-1.5 transition-colors duration-200 ${activeField === 'name' ? 'text-indigo-300' : 'text-gray-300'}`}
                                        >
                                            Full Name
                                        </label>
                                        <div className={`relative border ${activeField === 'name' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-gray-700'} rounded-lg transition-all duration-300`}>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                onFocus={() => handleFocus('name')}
                                                onBlur={handleBlur}
                                                className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-gray-100 focus:outline-none placeholder-gray-500 transition-colors"
                                                placeholder="e.g., John Doe"
                                            />
                                            {activeField === 'name' && (
                                                <motion.div
                                                    className="absolute inset-0 border border-indigo-400/20 rounded-lg pointer-events-none"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                ></motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div className="relative">
                                        <label
                                            htmlFor="email"
                                            className={`block text-sm font-medium mb-1.5 transition-colors duration-200 ${activeField === 'email' ? 'text-indigo-300' : 'text-gray-300'}`}
                                        >
                                            Email Address
                                        </label>
                                        <div className={`relative border ${activeField === 'email' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-gray-700'} rounded-lg transition-all duration-300`}>
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onFocus={() => handleFocus('email')}
                                                onBlur={handleBlur}
                                                className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-gray-100 focus:outline-none placeholder-gray-500 transition-colors"
                                                placeholder="you@example.com"
                                            />
                                            {activeField === 'email' && (
                                                <motion.div
                                                    className="absolute inset-0 border border-indigo-400/20 rounded-lg pointer-events-none"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                ></motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subject Field */}
                                    <div className="relative">
                                        <label
                                            htmlFor="subject"
                                            className={`block text-sm font-medium mb-1.5 transition-colors duration-200 ${activeField === 'subject' ? 'text-indigo-300' : 'text-gray-300'}`}
                                        >
                                            Subject
                                        </label>
                                        <div className={`relative border ${activeField === 'subject' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-gray-700'} rounded-lg transition-all duration-300`}>
                                            <input
                                                type="text"
                                                name="subject"
                                                id="subject"
                                                required
                                                value={formData.subject}
                                                onChange={handleInputChange}
                                                onFocus={() => handleFocus('subject')}
                                                onBlur={handleBlur}
                                                className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-gray-100 focus:outline-none placeholder-gray-500 transition-colors"
                                                placeholder="What would you like to discuss?"
                                            />
                                            {activeField === 'subject' && (
                                                <motion.div
                                                    className="absolute inset-0 border border-indigo-400/20 rounded-lg pointer-events-none"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                ></motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Field */}
                                    <div className="relative">
                                        <label
                                            htmlFor="message"
                                            className={`block text-sm font-medium mb-1.5 transition-colors duration-200 ${activeField === 'message' ? 'text-indigo-300' : 'text-gray-300'}`}
                                        >
                                            Message
                                        </label>
                                        <div className={`relative border ${activeField === 'message' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-gray-700'} rounded-lg transition-all duration-300`}>
                                            <textarea
                                                name="message"
                                                id="message"
                                                rows={5}
                                                required
                                                value={formData.message}
                                                onChange={handleInputChange}
                                                onFocus={() => handleFocus('message')}
                                                onBlur={handleBlur}
                                                className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-gray-100 focus:outline-none placeholder-gray-500 transition-colors"
                                                placeholder="Please describe your question or inquiry in detail..."
                                            ></textarea>
                                            {activeField === 'message' && (
                                                <motion.div
                                                    className="absolute inset-0 border border-indigo-400/20 rounded-lg pointer-events-none"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                ></motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button & Status */}
                                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                        <motion.button
                                            type="submit"
                                            disabled={isSubmitting}
                                            whileHover={{ scale: isSubmitting ? 1 : 1.03, boxShadow: isSubmitting ? 'none' : "0 0 25px rgba(99, 102, 241, 0.5)" }}
                                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                            className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-medium shadow-lg shadow-indigo-900/30 text-base transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center">
                                                    <Loader2 size={18} className="animate-spin mr-2" /> Sending...
                                                </span>
                                            ) : (
                                                <span className="flex items-center">
                                                    <Send size={16} className="mr-2" /> Send Message
                                                </span>
                                            )}
                                        </motion.button>

                                        <AnimatePresence>
                                            {submitStatus === 'success' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center text-sm bg-green-900/20 text-green-300 px-4 py-2 rounded-lg border border-green-500/30"
                                                >
                                                    <CheckCircle size={16} className="mr-1.5" /> Message sent successfully!
                                                </motion.div>
                                            )}
                                            {submitStatus === 'error' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center text-sm bg-red-900/20 text-red-300 px-4 py-2 rounded-lg border border-red-500/30"
                                                >
                                                    <AlertCircle size={16} className="mr-1.5" /> Failed to send message. Please try again.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}