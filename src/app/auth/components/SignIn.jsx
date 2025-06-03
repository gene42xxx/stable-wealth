'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react'; // Import signIn and useSession
import { useRouter } from 'next/navigation'; // Import useRouter for redirection
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Mail, Key, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// --- Animation Variants ---
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const inputFocus = {
    rest: { borderColor: 'rgba(107, 114, 128, 0.5)' },
    focus: { borderColor: 'rgba(99, 102, 241, 0.8)' }
};

// --- Animated Background ---
const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E2E] via-[#111936] to-[#0C1023] opacity-90"></div>
        <motion.div
            className="absolute top-[-20%] left-[-10%] w-2/3 h-2/3 bg-gradient-to-br from-indigo-500/20 via-purple-400/10 to-transparent opacity-40 blur-[20px]"
            animate={{
                x: [0, 30, 0],
                y: [0, 15, 0],
                rotate: [0, 5, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute bottom-[-20%] right-[-10%] w-2/3 h-2/3 bg-gradient-to-tl from-blue-600/20 via-violet-900/10 to-transparent opacity-30 blur-[10px]"
            animate={{
                x: [0, -30, 0],
                y: [0, -15, 0],
                rotate: [0, -5, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute top-[30%] right-[20%] w-40 h-40 rounded-full bg-gradient-to-r from-cyan-500/5 to-blue-500/5 blur-[20px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
    </div>
);

// --- Input Field Component ---
const FormField = ({ icon: Icon, type, id, label, value, onChange, placeholder, autoComplete, rightElement }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-xs font-medium text-gray-300 tracking-wide">{label}</label>
            <motion.div
                className={`relative rounded-xl overflow-hidden ${isFocused ? 'ring-2 ring-indigo-500/50' : ''}`}
                variants={inputFocus}
                initial="rest"
                animate={isFocused ? "focus" : "rest"}
                transition={{ duration: 0.2 }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 opacity-30"></div>
                <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Icon size={18} className={`${isFocused ? 'text-indigo-400' : 'text-gray-500'} transition-colors duration-200`} />
                    </span>
                    <input
                        type={type}
                        name={id}
                        id={id}
                        required
                        autoComplete={autoComplete}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full bg-gray-800/70 border border-gray-700/80 rounded-xl pl-11 pr-4 py-3 text-base text-gray-100 focus:outline-none placeholder-gray-500/80 transition-all backdrop-blur-sm"
                        placeholder={placeholder}
                        data-no-zoom
                    />
                    {rightElement && (
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                            {rightElement}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- Main Sign In Page Component ---
export default function SignInPage() {
    const [isClient, setIsClient] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter(); // Initialize router
    const { data: session, status: sessionStatus } = useSession(); // Get session status and data

    useEffect(() => {
        setIsClient(true);

        // Prevent mobile zoom on input focus
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea, select');
        const preventZoom = (e) => {
            // Check if the target is an input field and if it's a touch event
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                // Prevent default touch actions that might trigger zoom
                if (e.touches && e.touches.length > 1) {
                    e.preventDefault();
                }
            }
        };

        inputs.forEach(input => {
            input.addEventListener('touchstart', preventZoom, { passive: false });
        });

        // Cleanup event listeners on component unmount
        return () => {
            inputs.forEach(input => {
                input.removeEventListener('touchstart', preventZoom);
            });
        };
    }, []);

    // useEffect for handling redirection after successful login
    useEffect(() => {
        // Check if authenticated and session data is available
        if (sessionStatus === 'authenticated' && session?.user?.role) {
            const userRole = session.user.role;
            console.log(`Session authenticated. User role: ${userRole}. Redirecting...`);

            if (userRole === 'admin' || userRole === 'super-admin') {
                router.push('/admin/dashboard');
            } else if (userRole === 'user') {
                router.push('/investor/dashboard');
            } else {
                // Fallback if role is unexpected, though session callback should handle this
                console.error("Unexpected user role in session:", userRole);
                router.push('/'); // Redirect to a default page
            }
        }
         // Add dependencies: sessionStatus and session object (or specific fields if preferred)
         // Using sessionStatus ensures it runs when authentication state changes.
         // Using session ensures it runs if session data itself changes (e.g., role update).
    }, [sessionStatus, session, router]);


    const handlePasswordToggle = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await signIn('credentials', {
                redirect: false, // Prevent NextAuth from automatically redirecting
                email: email,
                password: password,
                // callbackUrl: '/dashboard' // Optional: specify where to redirect on success if redirect: true
            });

            if (result?.error) {
                // Handle authentication errors (e.g., wrong password)
                setError(result.error === 'CredentialsSignin' ? 'Invalid email or password.' : result.error);
            } else if (result?.ok && !result?.error) {
                // Sign in successful
                console.log('Sign In Successful', result);
                // Sign in successful - redirection is now handled by the useEffect hook
                // based on session status change.
                console.log('Sign In Successful via credentials');
                setError(null);
                // No explicit redirection here anymore.
            } else {
                 // Handle unexpected cases from signIn result
                 setError('An unexpected error occurred during sign in. Please try again.');
                 console.error('Unexpected Sign In Result:', result);
            }
        } catch (err) {
            console.log('Sign In Request Failed:', err);
            setError('An error occurred during sign in. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Basic server placeholder
    if (!isClient) {
        return <div className="bg-[#080A1A] min-h-screen"></div>;
    }

    return (
        <div className="min-h-screen pt-[10rem] bg-[#080A1A] text-gray-200 font-sans flex flex-col items-center justify-center p-4 relative isolate overflow-hidden">
            <AnimatedBackground />

            {/* Top Logo - Optional Floating Above Card */}
            <motion.div
                className="relative z-10 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                <Link href="/" aria-label="StableWealth Home">
                    <Image
                        src="/logo.png"
                        alt="StableWealth"
                        width={160}
                        height={40}
                        priority
                        className="drop-shadow-xl"
                    />
                </Link>
            </motion.div>

            {/* Main Sign In Card */}
            <motion.div
                className="relative z-10 w-full max-w-md bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/30 rounded-2xl shadow-2xl p-8 md:p-10 overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Decorative elements */}
                <div className="absolute -top-24 -right-24 w-40 h-40 bg-indigo-600/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    {/* Security Icon */}
                    <motion.div
                        className="mx-auto w-16 h-16 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full mb-6 border border-indigo-500/30"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                    >
                        <LockKeyhole size={28} className="text-indigo-300" />
                    </motion.div>

                    <motion.div
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-2 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-center text-gray-400 mb-8">
                            Sign in to access your StableWealth account
                        </p>
                    </motion.div>

                    {/* Sign In Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <FormField
                            icon={Mail}
                            type="email"
                            id="email"
                            label="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label htmlFor="password" className="block text-xs font-medium text-gray-300 tracking-wide">Password</label>
                                <Link href="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <FormField
                                icon={Key}
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={handlePasswordToggle}
                                        className="text-gray-500 hover:text-gray-300 focus:outline-none transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />
                        </div>

                        {/* Remember Me Checkbox - Removed for now, handle via NextAuth session config if needed */}
                        {/* <div className="flex items-center"> ... </div> */}

                        {/* Error Message Display */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-xs backdrop-blur-sm"
                                >
                                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-900/30 text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative z-10 flex items-center">
                                {isSubmitting ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <LogIn size={18} className="mr-2" /> Sign In
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </form>

                    {/* Sign Up Link */}
                    <motion.p
                        className="text-center text-sm text-gray-400 mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                            Create Account
                        </Link>
                    </motion.p>

                    {/* Security Badge */}
                    <motion.div
                        className="flex items-center justify-center gap-2 mt-8 py-2 px-4 mx-auto max-w-max rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <ShieldCheck size={14} className="text-green-400" />
                        <span className="text-xs text-gray-400">Secure Connection</span>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
