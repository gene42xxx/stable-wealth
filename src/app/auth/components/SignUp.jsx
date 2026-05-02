'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, User, Key, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Code, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster

// --- Animation Variants ---
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

// --- Animated Background ---
const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E2E] via-[#111936] to-[#0C1023] opacity-90"></div>
        <div
            className="absolute top-[-20%] left-[-10%] w-2/3 h-2/3 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-transparent opacity-40 blur-[20px]"
        />
        <div
            className="absolute bottom-[-20%] right-[-10%] w-2/3 h-2/3 bg-gradient-to-tl from-blue-300/50 via-violet-900/10 to-transparent opacity-30 blur-[10px]"
            animate={{
                x: [0, -30, 0],
                y: [0, -15, 0],
                rotate: [0, -5, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
            className="absolute top-[30%] right-[20%] w-40 h-40 rounded-full bg-gradient-to-r from-cyan-500/5 to-blue-500/5 blur-[10px]"
        />
    </div>
);

// --- Input Field Component ---
const FormField = ({ icon: Icon, type, id, label, value, onChange, placeholder, autoComplete, rightElement, error }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-xs font-medium text-gray-300 tracking-wide">{label}</label>
            <motion.div
                className={`relative rounded-xl overflow-hidden ${error ? 'ring-2 ring-red-500/50' : isFocused ? 'ring-2 ring-indigo-500/50' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className={`absolute inset-0 ${error ? 'bg-gradient-to-r from-red-600/10 to-red-600/5' : 'bg-gradient-to-r from-indigo-600/10 to-purple-600/10'} opacity-30`}></div>
                <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Icon size={18} className={`${error ? 'text-red-400' : isFocused ? 'text-indigo-400' : 'text-gray-500'} transition-colors duration-200`} />
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
                        className={`w-full bg-gray-800/70 border ${error ? 'border-red-700/50' : 'border-gray-700/80'} rounded-xl pl-11 pr-4 py-3 text-sm text-gray-100 focus:outline-none placeholder-gray-500/80 transition-all backdrop-blur-sm`}
                        placeholder={placeholder}
                    />
                    {rightElement && (
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                            {rightElement}
                        </div>
                    )}
                </div>
            </motion.div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-red-400 mt-1 flex items-center"
                >
                    <AlertCircle size={12} className="mr-1 flex-shrink-0" /> {error}
                </motion.p>
            )}
        </div>
    );
};

// --- Main Sign Up Page Component ---
export default function SignUpPage() {
    const [isClient, setIsClient] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        referenceCode: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [formComplete, setFormComplete] = useState(false); // Initialize to false

    useEffect(() => { setIsClient(true); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateStep1 = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!emailRegex.test(formData.email)) newErrors.email = 'Please enter a valid email';
        if (!formData.referenceCode.trim()) newErrors.referenceCode = 'Referral code is required'; // Added validation

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        if (!agreeTerms) newErrors.terms = 'You must agree to the Terms & Conditions';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (formStep === 1 && validateStep1()) {
            setFormStep(2);
        }
    };

    const prevStep = () => {
        setFormStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (formStep === 2 && validateStep2()) {
            setIsSubmitting(true);
            setErrors({}); // Clear previous errors

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        password: formData.password,
                        referralCode: formData.referenceCode,
                    }),
                });

                const data = await response.json();

                if (response.ok) { // Status 201 Created
                    setFormComplete(true);
                    // Optional: Clear form data after successful submission
                    // setFormData({ firstName: '', lastName: '', email: '', phone: '', referenceCode: '', password: '', confirmPassword: '' });
                    // setAgreeTerms(false);
                    // No need for timeout here, the success screen handles display
                } else {
                    // Handle API errors more specifically
                    const apiMessage = data.message || 'An error occurred.';
                    const lowerCaseApiMessage = apiMessage.toLowerCase();
                    let toastMessage = apiMessage; // Default toast message

                    if (response.status === 409) { // Conflict (Duplicate Email from transaction)
                         setErrors(prev => ({ ...prev, email: apiMessage }));
                         toastMessage = apiMessage;
                    } else if (response.status === 400) { // Bad Request
                        if (lowerCaseApiMessage.includes('user already exists')) {
                            setErrors(prev => ({ ...prev, email: apiMessage }));
                            toastMessage = apiMessage;
                        } else if (lowerCaseApiMessage.includes('password must be at least 8 characters')) {
                            setErrors(prev => ({ ...prev, password: apiMessage }));
                            toastMessage = apiMessage;
                        } else if (lowerCaseApiMessage.includes('referral code')) {
                            // Catches invalid, used, expired, origin errors
                            setErrors(prev => ({ ...prev, referenceCode: apiMessage }));
                            toastMessage = apiMessage;
                        } else if (lowerCaseApiMessage.includes('please provide')) {
                             // This shouldn't happen often due to frontend validation, but handle it
                             const generalMsg = "Please ensure all required fields are filled.";
                             setErrors(prev => ({ ...prev, form: generalMsg }));
                             toastMessage = generalMsg;
                        }
                         else {
                            // General 400 error
                            setErrors(prev => ({ ...prev, form: apiMessage }));
                            toastMessage = apiMessage;
                        }
                    } else if (response.status === 500) { // Server Error
                         const serverErrorMsg = "Registration failed due to a server issue. Please try again later.";
                         setErrors({ form: serverErrorMsg });
                         toastMessage = serverErrorMsg;
                    }
                     else {
                        // Catch-all for other non-2xx statuses
                        const unexpectedErrorMsg = `An unexpected error occurred (Status: ${response.status}). Please try again.`;
                        setErrors({ form: unexpectedErrorMsg });
                        toastMessage = unexpectedErrorMsg;
                    }
                    toast.error(toastMessage); // Display the toast error
                }
            } catch (error) {
                console.error('Sign up error:', error);
                const connectionErrorMsg = 'Could not connect to the server. Please check your internet connection and try again.';
                setErrors({ form: connectionErrorMsg });
                toast.error(connectionErrorMsg); // Toast for connection error
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Basic server placeholder
    if (!isClient) {
        return <div className="bg-[#080A1A] min-h-screen"></div>;
    }

    return (
        <div className="min-h-screen pt-[10rem] bg-[#080A1A] text-gray-200 font-sans flex flex-col items-center justify-center p-4 relative isolate overflow-hidden">
            <Toaster position="top-center" reverseOrder={false} /> {/* Add Toaster component */}
            <AnimatedBackground />

            {/* Top Logo */}
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

            {/* Main Sign Up Card */}
            <AnimatePresence mode="wait">
                {formComplete ? (
                    <motion.div
                        key="success"
                        className="relative z-10 w-full max-w-md bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/30 rounded-2xl shadow-2xl p-8 md:p-10 overflow-hidden text-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="relative z-10">
                            <motion.div
                                className="mx-auto w-20 h-20 flex items-center justify-center bg-green-500/20 rounded-full mb-6 border border-green-500/30"
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            >
                                <Check size={32} className="text-green-400" />
                            </motion.div>

                            <h2 className="text-2xl font-bold text-white mb-4">Registration Complete!</h2>
                            <p className="text-gray-300 mb-8">Your account has been created successfully. Check your email for verification instructions.</p>

                            <Link href="/auth/signin">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg text-sm"
                                >
                                    Proceed to Sign In
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        className="relative z-10 w-full max-w-md bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/30 rounded-2xl shadow-2xl p-8 md:p-10 overflow-hidden"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Decorative elements */}
                        <div className="absolute -top-24 -right-24 w-40 h-40 bg-indigo-600/30 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            {/* Step Indicator */}
                            <div className="flex justify-center mb-6">
                                <div className="flex items-center">
                                    <motion.div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === 1 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-indigo-600/40'} text-white text-sm font-medium`}
                                        animate={{
                                            scale: formStep === 1 ? 1 : 0.9,
                                            opacity: formStep === 1 ? 1 : 0.7
                                        }}
                                    >
                                        1
                                    </motion.div>
                                    <div className={`w-12 h-0.5 ${formStep === 2 ? 'bg-indigo-500' : 'bg-gray-700'} mx-1 transition-colors`}></div>
                                    <motion.div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === 2 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-indigo-600/40'} text-white text-sm font-medium`}
                                        animate={{
                                            scale: formStep === 2 ? 1 : 0.9,
                                            opacity: formStep === 2 ? 1 : 0.7
                                        }}
                                    >
                                        2
                                    </motion.div>
                                </div>
                            </div>

                            <motion.div
                                variants={fadeIn}
                                initial="hidden"
                                animate="visible"
                            >
                                <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-2 tracking-tight">
                                    Create Your Account
                                </h1>
                                <p className="text-sm text-center text-gray-400 mb-8">
                                    Join StableWealth and start building your financial future
                                </p>
                            </motion.div>

                            {/* Sign Up Form */}
                            <form onSubmit={handleSubmit}>
                                <AnimatePresence mode="wait">
                                    {formStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            variants={staggerContainer}
                                            initial="hidden"
                                            animate="visible"
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-5"
                                        >
                                            {/* Personal Information Fields */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    icon={User}
                                                    type="text"
                                                    id="firstName"
                                                    label="First Name"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    placeholder="John"
                                                    autoComplete="given-name"
                                                    error={errors.firstName}
                                                />
                                                <FormField
                                                    icon={User}
                                                    type="text"
                                                    id="lastName"
                                                    label="Last Name"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    placeholder="Doe"
                                                    autoComplete="family-name"
                                                    error={errors.lastName}
                                                />
                                            </div>

                                            <FormField
                                                icon={Mail}
                                                type="email"
                                                id="email"
                                                label="Email Address"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                error={errors.email}
                                            />

                                            <FormField
                                                icon={Code}
                                                type="text"
                                                id="referenceCode"
                                                label="Reference Code" // Removed (Optional)
                                                value={formData.referenceCode}
                                                onChange={handleChange}
                                                placeholder="Enter your referral code" // Updated placeholder
                                                error={errors.referenceCode}
                                            />

                                            <motion.button
                                                type="button"
                                                onClick={nextStep}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-900/30 text-sm transition-all duration-300 relative overflow-hidden group"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <span className="relative z-10">Continue</span>
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {formStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-5"
                                        >
                                            {/* Password Fields */}
                                            <FormField
                                                icon={Key}
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                label="Password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Create a strong password"
                                                autoComplete="new-password"
                                                error={errors.password}
                                                rightElement={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="text-gray-500 hover:text-gray-300 focus:outline-none"
                                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                }
                                            />

                                            <FormField
                                                icon={Key}
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirmPassword"
                                                label="Confirm Password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Confirm your password"
                                                autoComplete="new-password"
                                                error={errors.confirmPassword}
                                                rightElement={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="text-gray-500 hover:text-gray-300 focus:outline-none"
                                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                }
                                            />

                                            {/* Password Strength Indicator */}
                                            {formData.password && (
                                                <div className="space-y-2">
                                                    <div className="flex gap-1 h-1.5">
                                                        <motion.div
                                                            className="h-full rounded-full bg-red-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: formData.password.length > 0 ? '25%' : 0 }}
                                                        ></motion.div>
                                                        <motion.div
                                                            className="h-full rounded-full bg-yellow-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: formData.password.length >= 6 ? '25%' : 0 }}
                                                        ></motion.div>
                                                        <motion.div
                                                            className="h-full rounded-full bg-green-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: formData.password.length >= 8 ? '25%' : 0 }}
                                                        ></motion.div>
                                                        <motion.div
                                                            className="h-full rounded-full bg-green-400"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: formData.password.length >= 10 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? '25%' : 0 }}
                                                        ></motion.div>
                                                    </div>
                                                    <p className="text-xs text-gray-400">Password strength: {
                                                        formData.password.length >= 10 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? 'Strong' :
                                                            formData.password.length >= 8 ? 'Good' :
                                                                formData.password.length >= 6 ? 'Fair' : 'Weak'
                                                    }</p>
                                                </div>
                                            )}

                                            {/* Terms and Conditions */}
                                            <div className="mt-4">
                                                <label className="flex items-start cursor-pointer">
                                                    <div className="relative flex items-center mt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={agreeTerms}
                                                            onChange={() => {
                                                                setAgreeTerms(!agreeTerms);
                                                                if (errors.terms) {
                                                                    setErrors(prev => ({ ...prev, terms: '' }));
                                                                }
                                                            }}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-4 h-4 border ${agreeTerms ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-800 border-gray-600'} rounded transition-colors duration-200 ${errors.terms ? 'border-red-500' : ''}`}></div>
                                                        {agreeTerms && (
                                                            <motion.svg
                                                                initial={{ opacity: 0, scale: 0.5 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="absolute top-0 left-0 text-white w-4 h-4"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </motion.svg>
                                                        )}
                                                    </div>
                                                    <span className="ml-2 text-xs text-gray-400">
                                                        I agree to the <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>
                                                    </span>
                                                </label>
                                                {errors.terms && (
                                                    <p className="text-xs text-red-400 mt-1">{errors.terms}</p>
                                                )}
                                            </div>

                                            {/* Form Error */}
                                            {errors.form && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-xs"
                                                >
                                                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                                                    <span>{errors.form}</span>
                                                </motion.div>
                                            )}

                                            <div className="flex gap-3 pt-2">
                                                <motion.button
                                                    type="button"
                                                    onClick={prevStep}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 font-medium text-sm flex items-center justify-center flex-shrink-0"
                                                >
                                                    <ArrowLeft size={16} className="mr-1" /> Back
                                                </motion.button>

                                                <motion.button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                                    className="flex-1 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-indigo-900/30 text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <span className="relative z-10 flex items-center justify-center">
                                                        {isSubmitting ? (
                                                            <Loader2 size={20} className="animate-spin" />
                                                        ) : (
                                                            <>
                                                                <UserPlus size={18} className="mr-2" /> Create Account
                                                            </>
                                                        )}
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>

                            {/* Sign In Link */}
                            <motion.p
                                className="text-center text-sm text-gray-400 mt-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                            >
                                Already have an account?{' '}
                                <Link href="/auth/signin" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Sign In
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
                                <span className="text-xs text-gray-400">Secure Registration</span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
