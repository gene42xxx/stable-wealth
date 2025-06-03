'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, UserCircle } from 'lucide-react';

// Helper to shorten addresses (Consider moving to a shared utility file)
const shortenAddress = (address, chars = 4) => {
    if (!address) return 'N/A';
    const addrString = String(address);
    if (addrString.length <= chars * 2 + 3) {
        return addrString;
    }
    return `${addrString.substring(0, chars + 2)}...${addrString.substring(addrString.length - chars)}`;
};

const UserSelector = ({
    users = [],
    selectedUserId,
    onChange,
    isLoading = false,
    disabled = false,
    label = "Select User for Payout",
    placeholder = "Select a user"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredUsers, setFilteredUsers] = useState(users);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Current selected user
    const selectedUser = users.find(user => user._id === selectedUserId);

    // Filter users whenever search query changes
    useEffect(() => {
        if (!searchQuery) {
            setFilteredUsers(users);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = users.filter(user => {
            const walletAddress = user.walletAddress ? user.walletAddress.toLowerCase() : '';
            const contractBalance = user.contractBalance?.toString() || '';

            return (
                walletAddress.includes(query) ||
                contractBalance.includes(query)
            );
        });

        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (userId) => {
        const fakeEvent = { target: { value: userId } };
        onChange(fakeEvent);
        setIsOpen(false);
        setSearchQuery("");
    };

    const toggleDropdown = () => {
        if (!disabled && !isLoading && users.length > 0) {
            setIsOpen(!isOpen);
        }
    };

    // Calculate if there are enough users to show a scrollbar
    const showScrollbar = filteredUsers.length > 5;

    return (
        <div className="relative w-full font-sans">
            <label className="block text-sm font-medium text-gray-400 mb-1.5 transition-colors duration-200">
                {label}
            </label>

            <div ref={dropdownRef} className="relative">
                {/* Custom select button */}
                <button
                    type="button"
                    onClick={toggleDropdown}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-left 
            bg-gray-800/60 border rounded-lg shadow-sm transition duration-200 ease-in-out
            ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/60' : 'border-gray-700/80'} 
            ${disabled || isLoading || users.length === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-700/50 cursor-pointer'}`}
                    disabled={disabled || isLoading || users.length === 0}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-labelledby="user-selector-label"
                >
                    <div className="flex items-center truncate">
                        {selectedUser ? (
                            <div className="flex items-center">
                                <UserCircle className="h-5 w-5 text-emerald-400 mr-2" />
                                <div className="truncate">
                                    <span className="text-gray-100">
                                        {shortenAddress(selectedUser.walletAddress)}
                                    </span>
                                    <span className="text-emerald-400 ml-2 text-sm">
                                        {selectedUser.contractBalance?.toFixed(2) ?? '0.00'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500">{
                                isLoading
                                    ? 'Loading users...'
                                    : users.length === 0
                                        ? 'No eligible users found'
                                        : placeholder
                            }</span>
                        )}
                    </div>
                    <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 
              ${isOpen ? 'rotate-180 text-emerald-400' : ''}`}
                    />
                </button>

                {/* Dropdown menu */}
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                        {/* Search box */}
                        <div className="p-2 border-b border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search users..."
                                    className="pl-9 pr-4 py-2 w-full bg-gray-900 border border-gray-700 rounded-md text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* User list */}
                        <ul
                            className={`max-h-60 py-1 ${showScrollbar ? 'overflow-y-auto' : 'overflow-hidden'}`}
                            role="listbox"
                        >
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <li
                                        key={user._id}
                                        role="option"
                                        aria-selected={selectedUserId === user._id}
                                        onClick={() => handleSelect(user._id)}
                                        className={`px-4 py-2 flex items-center justify-between cursor-pointer transition-colors duration-150
                      ${selectedUserId === user._id ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-100 hover:bg-gray-700'}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <UserCircle className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium">{shortenAddress(user.walletAddress)}</p>
                                                <p className="text-xs text-gray-400">Balance: {user.contractBalance?.toFixed(2) ?? '0.00'}</p>
                                            </div>
                                        </div>
                                        {selectedUserId === user._id && (
                                            <Check className="h-5 w-5 text-emerald-400" />
                                        )}
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-3 text-sm text-gray-400 text-center">
                                    No matching users found
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Hidden native select for form submission compatibility */}
                <select
                    id="userSelect"
                    name="userSelect"
                    value={selectedUserId}
                    onChange={onChange}
                    className="sr-only"
                    required={false}
                    aria-hidden="true"
                    tabIndex="-1"
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {shortenAddress(user.walletAddress)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Optional hint text */}
            {users.length === 0 && !isLoading && (
                <p className="mt-1.5 text-xs text-gray-500">
                    No users are available for selection.
                </p>
            )}
        </div>
    );
};

export default UserSelector;