'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Save,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Key,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { wagmiConfig as config } from '../../providers';

// Password strength indicator component
const PasswordStrengthMeter = ({ password }) => {
  // Calculate password strength
  const getStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    // Length check
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    // Complexity checks
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    return Math.min(score, 4);
  };

  const strength = getStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-green-400',
    'bg-emerald-400'
  ];

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-400">Password Strength</span>
        <span className={`text-xs font-semibold ${strengthColors[strength].replace('bg-', 'text-')}`}>
          {strengthLabels[strength]}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-800/70 rounded-full overflow-hidden flex">
        {[...Array(5)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: index <= strength ? `${100 / 5}%` : 0,
              opacity: index <= strength ? 1 : 0
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`${index <= strength ? strengthColors[index] : 'bg-transparent'}`}
          />
        ))}
      </div>
    </div>
  );
};

// Enhanced Password Field Component
const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  showStrengthMeter = false,
  error = null
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <motion.label
        htmlFor={id}
        initial={{ y: 0 }}
        animate={{ y: isFocused || value ? -6 : 0, scale: isFocused || value ? 0.85 : 1 }}
        className="block text-sm font-medium text-gray-300 mb-1.5 transition-colors duration-200"
      >
        {label}
      </motion.label>

      <div className="relative">
        <motion.div
          className={`absolute inset-0 rounded-xl ${error
              ? 'ring-2 ring-red-500/60'
              : isFocused
                ? 'ring-2 ring-violet-500/50'
                : 'ring-1 ring-white/10'
            }`}
          animate={{
            boxShadow: isFocused
              ? '0 0 0 2px rgba(139, 92, 246, 0.15), 0 4px 20px rgba(0, 0, 0, 0.2)'
              : '0 2px 10px rgba(0, 0, 0, 0.15)'
          }}
          transition={{ duration: 0.2 }}
        />

        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="w-full bg-gray-900/40 backdrop-blur-sm border-0 rounded-xl pl-4 pr-10 py-3.5 
                    text-gray-100 placeholder-gray-500/70 z-10 relative
                    focus:outline-none focus:bg-gray-900/60"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 
                    hover:text-violet-300 transition-colors duration-200 z-20"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </motion.div>
        </button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-xs mt-1.5 ml-1 flex items-center"
        >
          <AlertCircle size={12} className="mr-1" />
          {error}
        </motion.p>
      )}

      {showStrengthMeter && <PasswordStrengthMeter password={value} />}
    </div>
  );
};

// Contract Details
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "changeAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyPause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyResume",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Main Component
export default function AdminChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formState, setFormState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState({
    currentPassword: null,
    newPassword: null,
    confirmPassword: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [success, setSuccess] = useState(false);

  // State for contract interactions
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [isChangingAdmin, setIsChangingAdmin] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));

    // Clear individual field errors as user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    // Clear general error when typing in any field
    if (generalError) setGeneralError(null);
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <Loader2 className="animate-spin mx-auto text-violet-400 mb-4" size={40} />
          <p className="text-gray-300 text-sm font-medium">Authenticating...</p>
        </motion.div>
      </div>
    );
  }

  // Authentication check
  if (status === 'unauthenticated') {
    router.replace('/auth/signin');
    return null;
  }

  if (status === 'authenticated' && !['admin', 'super-admin'].includes(session?.user?.role)) {
    router.replace('/dashboard');
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 bg-gray-800/80 backdrop-blur-md rounded-xl border border-red-500/20 shadow-lg"
        >
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-200 text-lg font-medium text-center">Access Denied</p>
          <p className="text-gray-400 text-sm mt-2 text-center">
            You don't have permission to access this area.
          </p>
        </motion.div>
      </div>
    );
  }

  // Form validation function
  const validateForm = () => {
    const errors = {
      currentPassword: null,
      newPassword: null,
      confirmPassword: null
    };
    let isValid = true;

    // Validate current password
    if (!formState.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    // Validate new password
    if (!formState.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (formState.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Validate confirmation password
    if (!formState.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (formState.newPassword !== formState.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    const loadingToastId = toast.loading('Updating your password...');

    try {
      // API call
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formState.currentPassword,
          newPassword: formState.newPassword
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Request failed (${response.status})`);
      }

      toast.success('Password successfully updated!', { id: loadingToastId });

      // Show success state
      setSuccess(true);

      // Reset form
      setFormState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Auto-dismiss success after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err) {
      console.error("Password change error:", err);

      // Handle specific API errors
      if (err.message.includes('current password is incorrect')) {
        setFieldErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        setGeneralError(err.message || 'An unexpected error occurred');
      }

      toast.error('Update failed', { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Back to dashboard handler
  const handleBackToDashboard = () => {
    router.push('/admin/dashboard');
  };

  // Background transitions
  const containerVariants = {
    initial: {
      backgroundPosition: "0% 0%"
    },
    animate: {
      backgroundPosition: "100% 100%",
      transition: {
        duration: 20,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  // Success state JSX
  const renderSuccessState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="w-full p-6 rounded-xl text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          delay: 0.2
        }}
        className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 
                 rounded-full flex items-center justify-center mx-auto mb-5"
      >
        <ShieldCheck size={28} className="text-white" />
      </motion.div>

      <h3 className="text-xl font-bold text-gray-100 mb-2">Password Updated!</h3>
      <p className="text-gray-400 mb-6">
        Your password has been successfully changed.
      </p>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setSuccess(false)}
        className="px-6 py-2.5 rounded-lg bg-gray-800 border border-gray-700 
                 text-gray-200 text-sm font-medium hover:bg-gray-700
                 transition-colors duration-150"
      >
        Back to Form
      </motion.button>
    </motion.div>
  );

  // Wagmi hooks for changeAdmin
  const { data: simulateChangeAdmin, error: simulateChangeAdminError } = useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'changeAdmin',
    args: [newAdminAddress],
    query: {
      enabled: newAdminAddress.length === 42, // Basic address validation
    },
  });
  const { writeContract: changeAdmin, isPending: isChangeAdminLoading, data: changeAdminHash } = useWriteContract();
  const { isLoading: isChangeAdminWaiting, isSuccess: isChangeAdminSuccess } = useWaitForTransactionReceipt({
    hash: changeAdminHash,
  });

  // Wagmi hooks for emergencyPause
  const { data: simulateEmergencyPause, error: simulateEmergencyPauseError } = useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'emergencyPause',
  });
  const { writeContract: emergencyPause, isPending: isEmergencyPauseLoading, data: emergencyPauseHash } = useWriteContract();
  const { isLoading: isEmergencyPauseWaiting, isSuccess: isEmergencyPauseSuccess } = useWaitForTransactionReceipt({
    hash: emergencyPauseHash,
  });

  // Wagmi hooks for emergencyResume
  const { data: simulateEmergencyResume, error: simulateEmergencyResumeError } = useSimulateContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'emergencyResume',
  });
  const { writeContract: emergencyResume, isPending: isEmergencyResumeLoading, data: emergencyResumeHash } = useWriteContract();
  const { isLoading: isEmergencyResumeWaiting, isSuccess: isEmergencyResumeSuccess } = useWaitForTransactionReceipt({
    hash: emergencyResumeHash,
  });

  // Handle change admin submission
  const handleChangeAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminAddress || newAdminAddress.length !== 42) {
      toast.error('Please enter a valid admin address.');
      return;
    }
    setIsChangingAdmin(true);
    const loadingToastId = toast.loading('Changing admin...');
    try {
      if (simulateChangeAdmin?.request) {
        changeAdmin(simulateChangeAdmin.request);
        toast.success('Change admin transaction sent!', { id: loadingToastId });
      } else {
        throw new Error(simulateChangeAdminError?.message || 'Failed to simulate transaction.');
      }
    } catch (error) {
      console.error("Change admin error:", error);
      toast.error(`Failed to change admin: ${error.message}`, { id: loadingToastId });
    } finally {
      setIsChangingAdmin(false);
    }
  };

  // Handle emergency pause submission
  const handleEmergencyPause = async () => {
    setIsPausing(true);
    const loadingToastId = toast.loading('Pausing contract...');
    try {
      if (simulateEmergencyPause?.request) {
        emergencyPause(simulateEmergencyPause.request);
        toast.success('Pause transaction sent!', { id: loadingToastId });
      } else {
        throw new Error(simulateEmergencyPauseError?.message || 'Failed to simulate transaction.');
      }
    } catch (error) {
      console.error("Emergency pause error:", error);
      toast.error(`Failed to pause contract: ${error.message}`, { id: loadingToastId });
    } finally {
      setIsPausing(false);
    }
  };

  // Handle emergency resume submission
  const handleEmergencyResume = async () => {
    setIsResuming(true);
    const loadingToastId = toast.loading('Resuming contract...');
    try {
      if (simulateEmergencyResume?.request) {
        emergencyResume(simulateEmergencyResume.request);
        toast.success('Resume transaction sent!', { id: loadingToastId });
      } else {
        throw new Error(simulateEmergencyResumeError?.message || 'Failed to simulate transaction.');
      }
    } catch (error) {
      console.error("Emergency resume error:", error);
      toast.error(`Failed to resume contract: ${error.message}`, { id: loadingToastId });
    } finally {
      setIsResuming(false);
    }
  };

  // Watch for transaction confirmations
  React.useEffect(() => {
    if (isChangeAdminSuccess) {
      toast.success('Admin changed successfully!');
      setNewAdminAddress('');
    }
    if (isEmergencyPauseSuccess) {
      toast.success('Contract paused successfully!');
    }
    if (isEmergencyResumeSuccess) {
      toast.success('Contract resumed successfully!');
    }
  }, [isChangeAdminSuccess, isEmergencyPauseSuccess, isEmergencyResumeSuccess]);


  return (
    <motion.div
      className="min-h-screen w-full flex items-center justify-center p-4
                bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]
                from-gray-900 via-purple-950/30 to-gray-950
                overflow-hidden"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-6xl mx-auto"
      >
        {/* Back button */}
        <motion.button
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToDashboard}
          className="absolute -left-2 -top-12 md:-left-4 md:-top-10 flex items-center 
                   text-gray-400 text-sm font-medium hover:text-violet-300 
                   transition-colors duration-150"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Dashboard
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Change Password Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/5 
                     rounded-3xl shadow-2xl shadow-black/40 overflow-hidden
                     relative z-10"
            style={{
              boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.05)"
            }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl" />

            {/* Header with glow effect */}
            <div className="relative px-7 py-6 md:px-8 md:py-7 border-b border-white/5">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-blue-600/5" />
              <div className="relative flex items-center space-x-3.5">
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                  <Lock size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Change Password
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Update your credentials securely
                  </p>
                </div>
              </div>
            </div>

            {/* Form or Success Message */}
            <div className="px-7 py-7 md:px-8 md:py-8">
              <AnimatePresence mode="wait">
                {success ? (
                  renderSuccessState()
                ) : (
                  <motion.form
                    key="password-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* General Error Message */}
                    <AnimatePresence>
                      {generalError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-start p-4 rounded-xl 
                                  bg-red-950/30 border border-red-500/20 text-red-200 text-sm"
                        >
                          <AlertCircle size={16} className="mt-0.5 mr-2.5 flex-shrink-0 text-red-400" />
                          <span>{generalError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Password Fields */}
                    <PasswordField
                      id="currentPassword"
                      label="Current Password"
                      value={formState.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter your current password"
                      required
                      error={fieldErrors.currentPassword}
                    />

                    <PasswordField
                      id="newPassword"
                      label="New Password"
                      value={formState.newPassword}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      showStrengthMeter={true}
                      error={fieldErrors.newPassword}
                    />

                    <PasswordField
                      id="confirmPassword"
                      label="Confirm New Password"
                      value={formState.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your new password"
                      required
                      error={fieldErrors.confirmPassword}
                    />

                    {/* Security Tips */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="px-4 py-3 bg-indigo-950/20 border border-indigo-500/10 
                               rounded-xl text-xs text-gray-300"
                    >
                      <p className="font-medium text-violet-300 mb-1.5 flex items-center">
                        <ShieldCheck size={14} className="mr-1.5" />
                        Password Security Tips:
                      </p>
                      <ul className="space-y-1 text-gray-400 ml-1">
                        <li>• Use at least 12 characters for strongest security</li>
                        <li>• Include uppercase, numbers & special characters</li>
                        <li>• Avoid using easily guessable information</li>
                      </ul>
                    </motion.div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full rounded-xl py-3.5 px-6 text-sm font-medium tracking-wide
                          text-white relative overflow-hidden shadow-lg
                          transition-all duration-200 ease-out
                          disabled:opacity-70 disabled:cursor-not-allowed
                        `}
                        style={{
                          background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)"
                        }}
                      >
                        {/* Gradient hover effect */}
                        <motion.div
                          className="absolute inset-0"
                          initial={{
                            background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)"
                          }}
                          whileHover={{
                            background: "linear-gradient(135deg, #9146FF 0%, #7C3AED 100%)"
                          }}
                        />

                        {/* Button content */}
                        <span className="relative flex items-center justify-center">
                          {isSubmitting ? (
                            <>
                              <Loader2 size={16} className="animate-spin mr-2" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Save size={15} className="mr-2" />
                              <span>Update Password</span>
                            </>
                          )}
                        </span>
                      </motion.button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* New Admin Settings Section */}
          {session?.user?.role === 'super-admin' && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full bg-gray-900/60 backdrop-blur-xl border border-white/5 
                       rounded-3xl shadow-2xl shadow-black/40 overflow-hidden
                       relative z-10"
              style={{
                boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.05)"
              }}
            >
              {/* Decorative elements */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-purple-600/10 rounded-full blur-3xl" />

              <div className="relative px-7 py-6 md:px-8 md:py-7 border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-violet-600/5" />
                <div className="relative flex items-center space-x-3.5">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                    <Key size={18} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      Smart Contract Admin Settings
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Manage contract ownership and emergency states
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-7 py-7 md:px-8 md:py-8 space-y-6">
                {/* Change Admin Section */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Change Admin Address</h2>
                    <form onSubmit={handleChangeAdmin} className="space-y-4">
                      <div>
                        <label htmlFor="newAdminAddress" className="block text-sm font-medium text-gray-300 mb-2">
                          New Admin Wallet Address
                        </label>
                        <input
                          type="text"
                          id="newAdminAddress"
                          value={newAdminAddress}
                          onChange={(e) => setNewAdminAddress(e.target.value)}
                          placeholder="e.g., 0xAbC123..."
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          required
                          pattern="^0x[a-fA-F0-9]{40}$"
                          title="Please enter a valid Ethereum address (0x...)"
                        />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={isChangeAdminLoading || isChangeAdminWaiting || isChangingAdmin || !simulateChangeAdmin?.request}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full rounded-lg py-2.5 px-5 text-sm font-medium
                          text-white relative overflow-hidden shadow-md
                          transition-all duration-200 ease-out
                          disabled:opacity-70 disabled:cursor-not-allowed
                        `}
                        style={{
                          background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)"
                        }}
                      >
                        <span className="relative flex items-center justify-center">
                          {(isChangeAdminLoading || isChangeAdminWaiting || isChangingAdmin) ? (
                            <>
                              <Loader2 size={16} className="animate-spin mr-2" />
                              <span>Changing Admin...</span>
                            </>
                          ) : (
                            <>
                              <Key size={15} className="mr-2" />
                              <span>Change Admin</span>
                            </>
                          )}
                        </span>
                      </motion.button>
                    </form>
                  </div>
                  {(isChangeAdminLoading || isChangeAdminWaiting) && (
                    <p className="text-center text-gray-400 text-xs mt-2">
                      {isChangeAdminWaiting ? 'Transaction pending...' : 'Preparing transaction...'}
                    </p>
                  )}
                  {simulateChangeAdminError && (
                    <p className="text-red-400 text-xs mt-2 text-center">
                      Error: {simulateChangeAdminError.message}
                    </p>
                  )}
                </div>

                {/* Emergency Pause Section */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Emergency Pause</h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Temporarily pause critical contract functions in case of an emergency.
                    </p>
                  </div>
                  <div>
                    <motion.button
                      onClick={handleEmergencyPause}
                      disabled={isEmergencyPauseLoading || isEmergencyPauseWaiting || isPausing || !simulateEmergencyPause?.request}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full rounded-lg py-2.5 px-5 text-sm font-medium
                        text-white relative overflow-hidden shadow-md
                        transition-all duration-200 ease-out
                        disabled:opacity-70 disabled:cursor-not-allowed
                      `}
                      style={{
                        background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                      }}
                    >
                      <span className="relative flex items-center justify-center">
                        {(isEmergencyPauseLoading || isEmergencyPauseWaiting || isPausing) ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            <span>Pausing...</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle size={15} className="mr-2" />
                            <span>Emergency Pause</span>
                          </>
                        )}
                      </span>
                    </motion.button>
                    {(isEmergencyPauseLoading || isEmergencyPauseWaiting) && (
                      <p className="text-center text-gray-400 text-xs mt-2">
                        {isEmergencyPauseWaiting ? 'Transaction pending...' : 'Preparing transaction...'}
                      </p>
                    )}
                    {simulateEmergencyPauseError && (
                      <p className="text-red-400 text-xs mt-2 text-center">
                        Error: {simulateEmergencyPauseError.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Emergency Resume Section */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Emergency Resume</h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Resume critical contract functions after an emergency has been resolved.
                    </p>
                  </div>
                  <div>
                    <motion.button
                      onClick={handleEmergencyResume}
                      disabled={isEmergencyResumeLoading || isEmergencyResumeWaiting || isResuming || !simulateEmergencyResume?.request}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full rounded-lg py-2.5 px-5 text-sm font-medium
                        text-white relative overflow-hidden shadow-md
                        transition-all duration-200 ease-out
                        disabled:opacity-70 disabled:cursor-not-allowed
                      `}
                      style={{
                        background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)"
                      }}
                    >
                      <span className="relative flex items-center justify-center">
                        {(isEmergencyResumeLoading || isEmergencyResumeWaiting || isResuming) ? (
                          <>
                            <Loader2 size={16} className="animate-spin mr-2" />
                            <span>Resuming...</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle size={15} className="mr-2" />
                            <span>Emergency Resume</span>
                          </>
                        )}
                      </span>
                    </motion.button>
                    {(isEmergencyResumeLoading || isEmergencyResumeWaiting) && (
                      <p className="text-center text-gray-400 text-xs mt-2">
                        {isEmergencyResumeWaiting ? 'Transaction pending...' : 'Preparing transaction...'}
                      </p>
                    )}
                    {simulateEmergencyResumeError && (
                      <p className="text-red-400 text-xs mt-2 text-center">
                        Error: {simulateEmergencyResumeError.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom info text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-gray-500 text-xs mt-5"
        >
          Password changes will be applied immediately across all devices
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
