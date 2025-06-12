'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Save, Lock, Eye, EyeOff, AlertCircle, ShieldCheck,
  User, Mail, Settings, Bell, Palette, Globe, Shield,
  Check, X, Info, ChevronRight
} from 'lucide-react';

// Password strength indicator component
const PasswordStrengthMeter = ({ password }) => {
  const getStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const strength = getStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'from-red-500 to-red-600',
    'from-orange-400 to-orange-500',
    'from-yellow-400 to-yellow-500',
    'from-blue-400 to-blue-500',
    'from-emerald-400 to-emerald-500'
  ];

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">Password Strength</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${strengthColors[strength]} text-white`}>
          {strengthLabels[strength]}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-800/70 rounded-full overflow-hidden flex gap-1">
        {[...Array(5)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: index <= strength ? 1 : 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex-1 h-full rounded-sm origin-left ${index <= strength
                ? `bg-gradient-to-r ${strengthColors[strength]}`
                : 'bg-transparent'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

// Enhanced Input Field Component
const InputField = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  error = null,
  disabled = false,
  icon: Icon
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="group">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-300 mb-3"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="relative">
        <motion.div
          className={`absolute inset-0 rounded-2xl transition-all duration-300 ${error
              ? 'ring-2 ring-red-500/60 bg-red-950/10'
              : isFocused
                ? 'ring-2 ring-indigo-500/60 bg-indigo-950/10'
                : 'ring-1 ring-white/10 bg-gray-900/40'
            }`}
          animate={{
            boxShadow: isFocused
              ? '0 0 0 4px rgba(99, 102, 241, 0.1), 0 8px 30px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        />

        <div className="relative flex items-center">
          {Icon && (
            <Icon
              size={18}
              className={`absolute left-4 z-10 transition-colors duration-200 ${error ? 'text-red-400' : isFocused ? 'text-indigo-400' : 'text-gray-500'
                }`}
            />
          )}

          <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            required={required}
            minLength={minLength}
            disabled={disabled}
            className={`w-full bg-transparent border-0 rounded-2xl py-4 pr-4 text-gray-100 placeholder-gray-500/70 z-10 relative focus:outline-none transition-all duration-200 ${Icon ? 'pl-12' : 'pl-4'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="text-red-400 text-sm mt-2 ml-1 flex items-center"
          >
            <AlertCircle size={14} className="mr-2 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
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
    <div className="group">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-300 mb-3"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="relative">
        <motion.div
          className={`absolute inset-0 rounded-2xl transition-all duration-300 ${error
              ? 'ring-2 ring-red-500/60 bg-red-950/10'
              : isFocused
                ? 'ring-2 ring-indigo-500/60 bg-indigo-950/10'
                : 'ring-1 ring-white/10 bg-gray-900/40'
            }`}
          animate={{
            boxShadow: isFocused
              ? '0 0 0 4px rgba(99, 102, 241, 0.1), 0 8px 30px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        />

        <div className="relative flex items-center">
          <Lock
            size={18}
            className={`absolute left-4 z-10 transition-colors duration-200 ${error ? 'text-red-400' : isFocused ? 'text-indigo-400' : 'text-gray-500'
              }`}
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
            className="w-full bg-transparent border-0 rounded-2xl pl-12 pr-12 py-4 text-gray-100 placeholder-gray-500/70 z-10 relative focus:outline-none transition-all duration-200"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 z-20 p-1 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-white/5 transition-all duration-200"
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
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="text-red-400 text-sm mt-2 ml-1 flex items-center"
          >
            <AlertCircle size={14} className="mr-2 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {showStrengthMeter && value && <PasswordStrengthMeter password={value} />}
    </div>
  );
};

// Settings Card Component
const SettingsCard = ({ title, description, icon: Icon, children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/40 rounded-3xl shadow-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-300 ${className}`}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="p-8 border-b border-gray-700/30">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
              <Icon size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">{title}</h2>
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default function SettingsPage() {
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
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [activeTab, setActiveTab] = useState('security');

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

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    const loadingToastId = toast.loading('Updating password...');

    try {
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
        throw new Error(result.message || `Failed to change password (${response.status})`);
      }

      toast.success('Password updated successfully!', { id: loadingToastId });
      // Clear form fields on success
      setFormState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (err) {
      console.error("Change password error:", err);
      // Handle specific API errors
      if (err.message.includes('current password is incorrect')) {
        setFieldErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        setGeneralError(err.message || 'An unexpected error occurred.');
      }
      toast.error(`Update failed: ${err.message || 'An unknown error occurred.'}`, { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 blur-3xl" />
        <div className="relative px-6 py-12 md:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4">
                Settings
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Manage your account settings and preferences to customize your experience
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-12 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mb-8 p-2 bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/40"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </motion.div>

          <div className="grid gap-8">
            {activeTab === 'security' && (
              <SettingsCard
                title="Change Password"
                description="Update your account password to keep your account secure"
                icon={Lock}
              >
                <form onSubmit={handleChangePassword} className="space-y-6">
                  {/* General Error Message */}
                  <AnimatePresence>
                    {generalError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-start p-4 rounded-2xl bg-gradient-to-r from-red-950/50 to-red-900/30 border border-red-500/30 text-red-200"
                      >
                        <AlertCircle size={20} className="mt-0.5 mr-3 flex-shrink-0 text-red-400" />
                        <span className="text-sm">{generalError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                    placeholder="Enter new password (min 8 chars)"
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
                    placeholder="Confirm your new password"
                    required
                    minLength={8}
                    error={fieldErrors.confirmPassword}
                  />

                  {/* Security Tips */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-gradient-to-r from-indigo-950/30 to-purple-950/30 border border-indigo-500/20 rounded-2xl"
                  >
                    <div className="flex items-center mb-3">
                      <ShieldCheck size={18} className="mr-2 text-indigo-400" />
                      <p className="font-semibold text-indigo-300">Security Best Practices</p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-emerald-400 flex-shrink-0" />
                        Use at least 12 characters for maximum security
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-emerald-400 flex-shrink-0" />
                        Include uppercase, lowercase, numbers & symbols
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-emerald-400 flex-shrink-0" />
                        Avoid personal information and common patterns
                      </li>
                    </ul>
                  </motion.div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin mr-2" />
                      ) : (
                        <Save size={18} className="mr-2" />
                      )}
                      Update Password
                    </motion.button>
                  </div>
                </form>
              </SettingsCard>
            )}

            {activeTab === 'profile' && (
              <SettingsCard
                title="Profile Information"
                description="Manage your public profile and account details"
                icon={User}
              >
                <div className="space-y-6">
                  <InputField
                    id="username"
                    label="Username"
                    type="text"
                    value={session?.user?.name || ''}
                    onChange={() => { }}
                    placeholder="Your username"
                    disabled
                    icon={User}
                  />

                  <InputField
                    id="email"
                    label="Email Address"
                    type="email"
                    value={session?.user?.email || ''}
                    onChange={() => { }}
                    placeholder="Your email"
                    disabled
                    icon={Mail}
                  />

                  <div className="flex justify-end pt-4">
                    <motion.button
                      type="button"
                      disabled
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-4 rounded-2xl text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 transition-all duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Save size={18} className="mr-2" />
                      Save Profile
                    </motion.button>
                  </div>
                </div>
              </SettingsCard>
            )}

            {activeTab === 'preferences' && (
              <SettingsCard
                title="Preferences"
                description="Customize your app experience and interface settings"
                icon={Palette}
              >
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <Palette size={18} className="mr-2 text-purple-400" />
                      Theme & Appearance
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 cursor-pointer hover:border-indigo-500/50 transition-colors">
                        <div className="w-full h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-2"></div>
                        <p className="text-sm font-medium text-gray-300">Dark Mode</p>
                      </div>
                      <div className="p-4 bg-gray-100 rounded-xl border border-gray-300 cursor-pointer opacity-50">
                        <div className="w-full h-16 bg-gradient-to-br from-gray-100 to-white rounded-lg mb-2"></div>
                        <p className="text-sm font-medium text-gray-600">Light Mode (Soon)</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <Globe size={18} className="mr-2 text-blue-400" />
                      Language & Region
                    </h3>
                    <p className="text-sm text-gray-400">Language settings coming soon...</p>
                  </div>
                </div>
              </SettingsCard>
            )}

            {activeTab === 'notifications' && (
              <SettingsCard
                title="Notifications"
                description="Control how and when you receive notifications"
                icon={Bell}
              >
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                      <Bell size={18} className="mr-2 text-yellow-400" />
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      {[
                        'Email notifications for account changes',
                        'Push notifications for new messages',
                        'Weekly summary emails',
                        'Security alerts'
                      ].map((setting, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                          <span className="text-sm text-gray-300">{setting}</span>
                          <div className="w-12 h-6 bg-gray-700 rounded-full relative cursor-pointer">
                            <div className="w-5 h-5 bg-indigo-500 rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SettingsCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}