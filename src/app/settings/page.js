'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Save, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Simple Input component for consistency
const InputField = ({ id, label, type, value, onChange, placeholder, required = false, minLength }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      className="w-full bg-gray-800/60 border border-gray-600/80 rounded-lg px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500 transition-all hover:border-indigo-500/50 focus:border-indigo-500/70"
    />
  </div>
);

// Password input with show/hide toggle
const PasswordField = ({ id, label, value, onChange, placeholder, required = false, minLength }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full bg-gray-800/60 border border-gray-600/80 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500 transition-all hover:border-indigo-500/50 focus:border-indigo-500/70"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};


export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin'); // Or your login page
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>; // Show loader while redirecting
  }
  // Show loading state while session is loading
  if (status === 'loading') {
     return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (!currentPassword) {
        setError('Please enter your current password.');
        return;
    }

    setIsLoading(true);
    const loadingToastId = toast.loading('Updating password...');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to change password (${response.status})`);
      }

      toast.success('Password updated successfully!', { id: loadingToastId });
      // Clear form fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err) {
      console.error("Change password error:", err);
      const errorMessage = err.message || 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Update failed: ${errorMessage}`, { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Assuming a layout similar to other pages
    <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen text-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-8">
          Settings
        </h1>

        {/* Change Password Card */}
        <div className="bg-gray-800/70 border border-gray-700/60 rounded-xl shadow-lg backdrop-blur-md overflow-hidden">
          <div className="p-6 border-b border-gray-700/40">
            <h2 className="text-xl font-semibold text-gray-100 flex items-center">
              <Lock size={20} className="mr-3 text-indigo-400" />
              Change Password
            </h2>
            <p className="text-sm text-gray-400 mt-1">Update your account password.</p>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-5">
            {/* Error Display */}
            {error && (
              <div className="flex items-center p-3 bg-red-900/40 border border-red-700/60 rounded-lg text-red-300 text-sm mb-4">
                <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <PasswordField
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              required
            />
            <PasswordField
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 chars)"
              required
              minLength={8}
            />
             <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              minLength={8}
            />

            {/* Submit Button */}
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin mr-2" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Add other settings sections here if needed */}

      </div>
    </div>
  );
}
