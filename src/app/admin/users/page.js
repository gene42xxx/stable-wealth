'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, UserPlus, Search, Filter, X as ClearIcon, ChevronLeft, ChevronRight, ArrowUpNarrowWide, ArrowDownNarrowWide } from 'lucide-react'; // Added Sort Icons
import useSWR, { mutate } from 'swr';
import { useDebounce } from 'use-debounce';
import UserCard from '../components/UserCard';
import CreateUserModal from '../components/CreateUserModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import UserDetailsModal from '../components/UserDetailsModal'; // Import the new modal
import toast from 'react-hot-toast';

// Fetcher function for SWR
const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Request failed (${response.status})`);
  }
  return response.json();
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);

  // --- Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // 'user', 'admin', 'super-admin', '' (all)
  const [statusFilter, setStatusFilter] = useState('');
  const [referredByFilter, setReferredByFilter] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  // --- Pagination State ---
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Users per page

  // --- Sort State ---
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc' for createdAt

  // --- SWR Hook with Dynamic Key based on Filters, Pagination & Sort ---
  const buildApiUrl = useCallback(() => {
    if (status !== 'authenticated') return null;

    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    // Only add referredBy if super-admin and filter is set
    if (session?.user?.role === 'super-admin' && referredByFilter) {
      params.set('referredBy', referredByFilter);
    }
    // Add pagination params
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    // Add sort param
    params.set('sort', sortOrder === 'asc' ? 'createdAt' : '-createdAt');


    const queryString = params.toString();
    return `/api/admin/users${queryString ? `?${queryString}` : ''}`;
  }, [status, debouncedSearchTerm, roleFilter, statusFilter, referredByFilter, session?.user?.role, page, limit, sortOrder]); // Added sortOrder dependency

  const apiUrl = buildApiUrl();

  const { data, error, isLoading, isValidating } = useSWR(
    apiUrl,
    fetcher,
    {
      revalidateOnFocus: false, // Prevent revalidating on focus for pagination/filters
      keepPreviousData: true, // Keep previous data visible while loading new page/filters
      dedupingInterval: 5000,
    }
  );

  const users = data?.users || [];
  // Simple check for last page based on limit
  const isLastPage = users.length < limit;

  // Handler to update user list after editing
  const handleUserUpdate = (updatedUser) => {
    // Update the cache for instant UI update
    mutate('/api/admin/users', {
      ...data,
      users: users.map(user => (user._id === updatedUser._id ? updatedUser : user))
    }, false); // Don't revalidate immediately as our data is already fresh

    // Optionally trigger revalidation for fresh data
    mutate('/api/admin/users');
  };

  // Prepare for viewing details: find user, set state, open details modal
  const handleViewUserDetails = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setSelectedUserForDetails(user);
      setIsUserDetailsModalOpen(true);
    } else {
      toast.error("Could not find user details.");
    }
  };

  // Close the details modal
  const handleCloseUserDetailsModal = () => {
    setIsUserDetailsModalOpen(false);
    setSelectedUserForDetails(null);
  };

  // Prepare for deletion: find user, set state, open confirm modal
  const handleUserDelete = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setUserToDelete(user);
      setIsConfirmModalOpen(true);
    } else {
      toast.error("Could not find user to delete.");
    }
  };

  // Execute the deletion after confirmation
  const executeDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    const loadingToastId = toast.loading('Deleting user...');

    try {
      const response = await fetch(`/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete user (${response.status})`);
      }

      // Optimistically update the cache
      mutate('/api/admin/users', {
        ...data,
        users: users.filter(user => user._id !== userToDelete._id)
      });

      toast.success('User deleted successfully!', { id: loadingToastId });
      setIsConfirmModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.log("Error deleting user:", err);
      toast.error(`Delete failed: ${err.message}`, { id: loadingToastId });
      // Revalidate to ensure data consistency
      mutate('/api/admin/users');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const isSuperAdmin = session?.user?.role === 'super-admin';

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setReferredByFilter('');
    setPage(1);
    setSortOrder('desc'); // Reset sort on filter clear
  };

  const hasActiveFilters = searchTerm || roleFilter || statusFilter || (isSuperAdmin && referredByFilter) || sortOrder !== 'desc';

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    setPage(1); // Reset to page 1 when sort order changes
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 bg-gradient-to-b from-gray-900 to-gray-950 min-h-full text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-4 md:mb-0">
            User Management
          </h1>
          {isSuperAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center space-x-2"
              title="Create New User (Super Admin Only)"
            >
              <UserPlus size={16} />
              <span>Create User</span>
            </button>
          )}
        </div>

        {/* Filter Section */}
        <div className="mb-8 p-4 bg-gray-800/50 border border-gray-700/60 rounded-lg shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"> {/* Changed to 5 cols */}
            {/* Search Input */}
            <div className="relative lg:col-span-1">
              <label htmlFor="search-users" className="block text-xs font-medium text-gray-400 mb-1.5">Search Name/Email</label>
              <input
                type="text"
                id="search-users"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-gray-500 transition-all hover:border-indigo-500/50 focus:border-indigo-500/70"
              />
              <Search size={16} className="absolute left-3 top-9 text-gray-500 pointer-events-none" />
            </div>

            {/* Role Filter */}
            <div className="lg:col-span-1">
              <label htmlFor="role-filter" className="block text-xs font-medium text-gray-400 mb-1.5">Filter by Role</label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition appearance-none bg-no-repeat bg-right pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.7rem center', backgroundSize: '1.2em 1.2em' }}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-1">
              <label htmlFor="status-filter" className="block text-xs font-medium text-gray-400 mb-1.5">Filter by Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                 className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg px-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition appearance-none bg-no-repeat bg-right pr-8"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.7rem center', backgroundSize: '1.2em 1.2em' }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Referrer Filter (Super Admin Only) */}
            {isSuperAdmin && (
              <div className="relative lg:col-span-1">
                <label htmlFor="referrer-filter" className="block text-xs font-medium text-gray-400 mb-1.5">Filter by Referrer ID</label>
                <input
                  type="text"
                  id="referrer-filter"
                  placeholder="Enter Admin ID..."
                  value={referredByFilter}
                  onChange={(e) => setReferredByFilter(e.target.value)}
                  className="w-full bg-gray-900/70 border border-gray-600/80 rounded-lg pl-4 pr-4 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-gray-500 transition-all hover:border-indigo-500/50 focus:border-indigo-500/70"
                />
              </div>
            )}

             {/* Sort Toggle Button */}
             <div className="flex flex-col items-start sm:items-end h-full"> {/* Aligns button with bottom of inputs */}
                 <label className="block text-xs font-medium text-gray-400 mb-1.5 invisible">Sort</label> {/* Placeholder label for alignment */}
                 <button
                    onClick={toggleSortOrder}
                    className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center space-x-1.5"
                    title={`Sort by Creation Date (${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})`}
                 >
                    {sortOrder === 'desc' ? <ArrowDownNarrowWide size={14} /> : <ArrowUpNarrowWide size={14} />}
                    <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                 </button>
             </div>

             {/* Clear Filters Button */}
             {hasActiveFilters && (
                <div className="lg:col-span-5 flex justify-end pt-2"> {/* Span across all columns */}
                    <button
                        onClick={clearFilters}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-gray-700/60 hover:bg-gray-600/80 transition-colors flex items-center space-x-1"
                        title="Clear all filters"
                    >
                        <ClearIcon size={14} />
                        <span>Clear Filters</span>
                    </button>
                </div>
             )}
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || isValidating) && ( // Show loader if initial loading OR validating on filter change
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center p-6 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300">
            <AlertCircle size={24} className="mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Failed to load users</h3>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        )}

        {/* User Grid */}
        {!isLoading && !error && users && ( // Check users array exists
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.length > 0 ? (
              users.map(user => (
                <div  key={user._id} >
                  <UserCard
                    key={user._id}
                    user={user}
                    onUserUpdate={handleUserUpdate}
                    onUserDelete={handleUserDelete}
                    onViewUser={handleViewUserDetails} // Pass the view handler
                    currentUserRole={session?.user?.role}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-400 md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-10">
                {hasActiveFilters ? 'No users match the current filters.' : 'No users found.'}
              </p>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && users.length > 0 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading || isValidating}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-colors"
                >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                </button>
                <span className="text-sm text-gray-400">Page {page}</span>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={isLastPage || isLoading || isValidating}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm transition-colors"
                >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                </button>
            </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onUserCreated={() => {
            setIsCreateModalOpen(false);
            // Revalidate to update the user list
            mutate('/api/admin/users');
          }}
        />
      )}

      {/* User Details Modal */}
      {isUserDetailsModalOpen && selectedUserForDetails && (
        <UserDetailsModal
          isOpen={isUserDetailsModalOpen}
          onClose={handleCloseUserDetailsModal}
          user={selectedUserForDetails}
        />
      )}

      {/* Confirm Delete Modal */}
      {isConfirmModalOpen && userToDelete && (
        <ConfirmDeleteModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            if (!isDeletingUser) {
              setIsConfirmModalOpen(false);
              setUserToDelete(null);
            }
          }}
          onConfirm={executeDeleteUser}
          userName={userToDelete.name || userToDelete.email}
          isDeleting={isDeletingUser}
        />
      )}
    </div>
  );
}
