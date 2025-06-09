'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useBalance, useDisconnect, useWaitForTransactionReceipt, useReadContract, useWatchContractEvent } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { wagmiConfig } from '../../providers';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ConnectKitButton, useModal } from 'connectkit';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits, formatUnits, isAddress } from 'viem'; // Added isAddress for validation

import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
  DollarSign,
  CheckCircle,
  Clock,
  Shield,
  Info,
  AlertTriangle,
  Zap,
  RefreshCw,
  Hash,
  Wifi,
  BookOpen,
  FileText,
  Fuel,
  Key,
  CreditCard,
  Network,
  Search
} from 'lucide-react'; // Added Search icon
import { formatUSDTBalance } from '@/lib/utils/formatUsdtBalance';

// ABI snippets
const USDT_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
];

const LUXE_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "txHash",
        "type": "bytes32"
      }
    ],
    "name": "processDirectDeposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    name: 'deposit',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'getUnprocessedDeposits',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getBalanceOf',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'DirectDeposit',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'txHash', type: 'bytes32', indexed: true }
    ]
  }
];

/**
 * @typedef {object} PendingDeposit
 * @property {import('viem').Hash} txHash
 * @property {string} [dbTransactionId] // Optional: The MongoDB _id of the transaction
 * @property {string} amount
 * @property {number} timestamp
 * @property {'pending' | 'processed' | 'failed'} status
 */

const InfoCard = ({ title, children, icon: Icon, id }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden hover:border-gray-600/50 transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <Icon size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-gray-400"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-gray-300 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StepItem = ({ step, title, description, icon: Icon }) => (
  <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-700/30 border border-gray-600/30">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
      <Icon size={16} className="text-blue-400" />
    </div>
    <div>
      <h4 className="font-semibold text-gray-200 mb-1">{step}: {title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  </div>
);

const FAQItem = ({ question, answer, icon: Icon }) => (
  <div className="p-4 rounded-lg bg-gray-700/30 border border-gray-600/30">
    <div className="flex items-start gap-3 mb-2">
      <Icon size={16} className="text-blue-400 mt-1 flex-shrink-0" />
      <h4 className="font-semibold text-gray-200">{question}</h4>
    </div>
    <p className="text-sm text-gray-400 ml-7">{answer}</p>
  </div>
);

const TroubleshootingItem = ({ title, solutions, icon: Icon }) => (
  <div className="p-4 rounded-lg bg-gray-700/30 border border-gray-600/30">
    <div className="flex items-start gap-3 mb-3">
      <Icon size={16} className="text-amber-400 mt-1 flex-shrink-0" />
      <h4 className="font-semibold text-gray-200">{title}</h4>
    </div>
    <ul className="space-y-2 ml-7">
      {solutions.map((solution, index) => (
        <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
          <div className="w-1 h-1 rounded-full bg-gray-500 mt-2 flex-shrink-0"></div>
          {solution}
        </li>
      ))}
    </ul>
  </div>
);

const DefinitionItem = ({ term, definition, icon: Icon }) => (
  <div className="p-4 rounded-lg bg-gray-700/30 border border-gray-600/30">
    <div className="flex items-start gap-3 mb-2">
      <Icon size={16} className="text-green-400 mt-1 flex-shrink-0" />
      <h4 className="font-semibold text-gray-200">{term}</h4>
    </div>
    <p className="text-sm text-gray-400 ml-7">{definition}</p>
  </div>
);

const USE_CONNECTKIT = true;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const USDT_ADDRESS_MAINNET = process.env.NEXT_PUBLIC_USDT_ADDRESS || "";
const USDT_ADDRESS_SEPOLIA = process.env.NEXT_PUBLIC_USDT_ADDRESS_SEPOLIA || "";


// Constants
const TRANSACTION_STAGES = {
  IDLE: 0,
  REQUESTING_TRANSFER: 1,
  CONFIRMING_TRANSFER: 2,
  PROCESSING_CONTRACT: 3,
  COMPLETED: 4
};

const STATUS_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending'
};

const USDT_DECIMALS = 6;
const CONFETTI_DURATION = 6000;



export default function InvestorDepositPage() {
  // Wallet connection hooks
  const { address, isConnected, chain } = useAccount();
  const { openConnectModal: openRainbowKitConnectModal } = useModal();
  const { disconnect } = useDisconnect();

  // State management
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [statusType, setStatusType] = useState('');
  const [transactionStage, setTransactionStage] = useState(TRANSACTION_STAGES.IDLE);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState(new Map());

  // State for tab management
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' or 'verify'

  // State for Verify Transaction tab
  const [txHashInput, setTxHashInput] = useState('');
  const [verifiedTxDetails, setVerifiedTxDetails] = useState(null); // { amount, fromAddress, blockNumber, transactionHash }
  const [verifyTxStatus, setVerifyTxStatus] = useState('');
  const [isVerifyingTx, setIsVerifyingTx] = useState(false);
  const [verifyStatusType, setVerifyStatusType] = useState(''); // 'success', 'error', 'pending'
  const [verifyTxHash, setVerifyTxHash] = useState('');
  const [verifyTxDetails, setVerifyTxDetails] = useState(null);

  // Single source of truth for current transaction
  const [currentTransaction, setCurrentTransaction] = useState(null);

  // Refs for tracking transaction states
  const formRef = useRef(null);
  const verifyFormRef = useRef(null); // Ref for the verify transaction form

  // Contract addresses
  const USDT_ADDRESS = chain?.id === 1
    ? process.env.NEXT_PUBLIC_USDT_ADDRESS
    : process.env.NEXT_PUBLIC_USDT_ADDRESS_SEPOLIA;

  // Contract interaction hooks - Direct USDT transfer
  const {
    writeContract: directTransfer,
    data: directTransferHash,
    isPending: isDirectTransferPending,
    error: directTransferError,
    reset: resetDirectTransfer,

  } = useWriteContract();

  const {
    isLoading: isDirectTransferConfirming,
    isSuccess: isDirectTransferSuccess
  } = useWaitForTransactionReceipt({
    hash: directTransferHash,
  });

  // Contract interaction hooks - Process deposit
  const {
    writeContract: processDeposit,
    data: processDepositHash,
    isPending: isProcessDepositPending,
    error: processDepositError
  } = useWriteContract();

  const {
    isLoading: isProcessDepositConfirming,
    isSuccess: isProcessDepositSuccess
  } = useWaitForTransactionReceipt({
    hash: processDepositHash,
  });

  // Contract interaction hooks - Manual processDirectDeposit
  const {
    writeContract: manualProcessDirectDeposit,
    data: manualProcessDirectDepositHash,
    isPending: isManualProcessDirectDepositPending,
    error: manualProcessDirectDepositError,
    reset: resetManualProcessDirectDeposit
  } = useWriteContract();

  // Add this hook to wait for transaction receipt
  const {
    data: transactionReceipt,
    isError: isReceiptError,
    error: receiptError,
    isLoading: isReceiptLoading,
    isSuccess: isReceiptSuccess
  } = useWaitForTransactionReceipt({
    hash: manualProcessDirectDepositHash,
  });

  const extractRevertReason = (error) => {
    const errorString = error.toString();

    // Look for "Execution reverted with reason: " pattern
    const reasonMatch = errorString.match(/Execution reverted with reason: ([^.\n]+)/);
    if (reasonMatch) {
      return reasonMatch[1].trim();
    }

    // Fallback: look for "execution reverted: " pattern
    const revertMatch = errorString.match(/execution reverted: ([^.\n]+)/);
    if (revertMatch) {
      return revertMatch[1].trim();
    }

    // If no specific pattern found, return generic message
    return 'Transaction failed';
  };

  // Use it in your useEffect:
  useEffect(() => {
    if (isReceiptError && receiptError) {
      console.log('🚨 Transaction failed on-chain:', receiptError);

      const revertReason = extractRevertReason(receiptError);
      console.log('Extracted reason:', revertReason); // Should log: "Transaction already processed"

      setVerifyTxStatus(`Error: ${revertReason}`);
      setVerifyStatusType(STATUS_TYPES.ERROR);
      setIsVerifyingTx(false);
    }
  }, [isReceiptError, receiptError]);


  const {
    isLoading: isManualProcessDirectDepositConfirming,
    isSuccess: isManualProcessDirectDepositSuccess
  } = useWaitForTransactionReceipt({
    hash: manualProcessDirectDepositHash,
  });

  // Contract read hooks
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    watch: true,
    enabled: isConnected && !!address,
  });

  const { data: unprocessedDeposits } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LUXE_ABI,
    functionName: 'getUnprocessedDeposits',
    watch: true,
    enabled: isConnected,
  });

  // Utility functions
  const truncateAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  const validateAmount = useCallback((inputAmount) => {
    return !(!inputAmount || Number(inputAmount) <= 0 || isNaN(Number(inputAmount)));
  }, []);

  const triggerFormShakeAnimation = useCallback((ref) => {
    if (ref.current) {
      ref.current.classList.add('shake-animation');
      setTimeout(() => {
        if (ref.current) {
          ref.current.classList.remove('shake-animation');
        }
      }, 500);
    }
  }, []);

  const showConfettiEffect = useCallback(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, CONFETTI_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const resetTransactionState = useCallback(() => {
    setTxStatus('');
    setStatusType('');
    setTransactionStage(TRANSACTION_STAGES.IDLE);
    setCurrentTransaction(null);
    resetDirectTransfer();
    // Reset verify transaction states
    setTxHashInput('');
    setVerifiedTxDetails(null);
    setVerifyTxStatus('');
    setIsVerifyingTx(false);
    setVerifyStatusType('');
    resetManualProcessDirectDeposit();
  }, [resetDirectTransfer, resetManualProcessDirectDeposit]);

  // Helper function to clean amount for API
  const cleanAmountForAPI = useCallback((amount) => {
    if (typeof amount === 'string') {
      // Remove commas and convert to number
      return Number(amount.replace(/,/g, ''));
    }
    return Number(amount);
  }, []);

  // Centralized API function for transaction operations
  const updateTransaction = useCallback(async (updates) => {
    if (!currentTransaction?.dbId) {
      console.error('No current transaction to update');
      return null;
    }

    try {
      const payload = {
        dbTransactionId: currentTransaction.dbId,
        txHash: currentTransaction.txHash,
        status: updates.status,
        amount: cleanAmountForAPI(currentTransaction.amount),
        networkId: currentTransaction.networkId,
        currency: 'USDT',
        depositorAddress: currentTransaction.depositorAddress,
        type: 'deposit',
        blockchainData: { contractTxHash: updates.contractTxHash || null },
        description: updates.description,
      };

      const apiResponse = await fetch('/api/investor/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await apiResponse.json();
      if (apiResponse.ok) {
        console.log('Transaction updated successfully:', result);
        return result;
      } else {
        console.error('Error updating transaction:', result.message);
        return null;
      }
    } catch (error) {
      console.error('API Error updating transaction:', error);
      return null;
    }
  }, [currentTransaction, cleanAmountForAPI]);

  // Create initial transaction record
  const createInitialTransaction = useCallback(async (txHash, depositAmount, networkId, depositorAddress) => {
    try {
      const payload = {
        txHash: txHash,
        status: 'pending',
        amount: cleanAmountForAPI(depositAmount),
        networkId: networkId,
        currency: 'USDT',
        depositorAddress: depositorAddress,
        user: depositorAddress, // Set user address for the backend
        type: 'deposit',
        description: `Direct deposit of ${depositAmount} USDT initiated.`,
      };

      const apiResponse = await fetch('/api/investor/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await apiResponse.json();
      if (apiResponse.ok) {
        console.log('Initial transaction created:', result);
        return result.transactionId;
      } else {
        console.error('Error creating initial transaction:', result.message);
        return null;
      }
    } catch (error) {
      console.error('API Error creating initial transaction:', error);
      return null;
    }
  }, [cleanAmountForAPI]);

  // Handle transaction errors
  const handleTransactionError = useCallback(async (error, stage) => {
    let errorMessage = '';

    if (error.message?.includes('User rejected the request')) {
      errorMessage = 'Transaction rejected by user.';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Failed: Insufficient funds for transaction.';
    } else {
      errorMessage = `Transfer failed: ${error.shortMessage || error.message}`;
    }

    setTxStatus(errorMessage);
    setStatusType(STATUS_TYPES.ERROR);
    setTransactionStage(TRANSACTION_STAGES.IDLE);
    setIsDepositing(false);

    // Update transaction record with error
    if (currentTransaction) {
      await updateTransaction({
        status: 'failed',
        description: `${stage} failed: ${errorMessage}`,
      });
    }
  }, [currentTransaction, updateTransaction]);

  // Handle direct transfer confirmation
  const handleDirectTransferConfirmed = useCallback(async () => {
    if (!currentTransaction) return;
    if (!currentTransaction || transactionStage !== TRANSACTION_STAGES.CONFIRMING_TRANSFER) {
      return; // Exit if already processed or wrong stage
    }


    setTxStatus('Direct transfer confirmed! Processing deposit...');
    setStatusType(STATUS_TYPES.PENDING);
    setTransactionStage(TRANSACTION_STAGES.PROCESSING_CONTRACT);

    // Update pendingDeposits map
    setPendingDeposits(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentTransaction.txHash);
      if (existing) {
        newMap.set(currentTransaction.txHash, { ...existing, status: 'confirmed' });
      }
      return newMap;
    });

    // Update transaction status
    await updateTransaction({
      status: 'confirmed',
      description: `Direct USDT transfer of ${currentTransaction.amount} confirmed on blockchain. Processing deposit...`,
    });

    // Initiate contract processing
    try {
      const depositAmountWei = parseUnits(currentTransaction.amount.toString(), USDT_DECIMALS);
      await processDeposit({
        address: CONTRACT_ADDRESS,
        abi: LUXE_ABI,
        functionName: 'processDirectDeposit',
        args: [address, depositAmountWei, directTransferHash]
      });
    } catch (error) {
      console.error('Process deposit failed:', error);
      handleTransactionError(error, 'Contract processing');
    }
  }, [currentTransaction, updateTransaction, processDeposit, address, directTransferHash, handleTransactionError]);

  // Handle process deposit confirmation
  const handleProcessDepositConfirmed = useCallback(async () => {
    if (!currentTransaction) return;

    setTxStatus(`USDT deposit of ${currentTransaction.amount} added to your account balance successfully!`);
    setStatusType(STATUS_TYPES.SUCCESS);
    setShowSuccessModal(true);
    setTransactionStage(TRANSACTION_STAGES.COMPLETED);
    setIsDepositing(false);

    // Update pendingDeposits map
    setPendingDeposits(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentTransaction.txHash);
      if (existing) {
        newMap.set(currentTransaction.txHash, { ...existing, status: 'completed' });
      }
      return newMap;
    });

    // Update final transaction status
    await updateTransaction({
      status: 'completed',
      contractTxHash: processDepositHash,
      description: `USDT deposit of ${currentTransaction.amount} successfully processed and added to account balance.`,
    });

    showConfettiEffect();
    refetchBalance();
  }, [currentTransaction, updateTransaction, processDepositHash, showConfettiEffect, refetchBalance]);

  // Main transaction handler
  const handleDirectTransfer = useCallback(async (e) => {
    e.preventDefault();
    setTxStatus('');
    setStatusType('');

    // Wallet connection validation
    if (!isConnected) {
      setTxStatus('Please connect your wallet first.');
      setStatusType(STATUS_TYPES.ERROR);
      return;
    }

    // Amount validation
    if (!validateAmount(amount)) {
      setTxStatus('Please enter a valid amount greater than 0.');
      setStatusType(STATUS_TYPES.ERROR);
      triggerFormShakeAnimation(formRef); // Pass formRef
      return;
    }

    setIsDepositing(true);

    try {
      // Step 1: Initiate direct transfer
      setTxStatus('Step 1/3: Requesting direct USDT transfer. Please confirm in your wallet...');
      setStatusType(STATUS_TYPES.PENDING);
      setTransactionStage(TRANSACTION_STAGES.REQUESTING_TRANSFER);

      const depositAmountWei = parseUnits(amount.toString(), USDT_DECIMALS);
      await directTransfer({
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'transfer',
        args: [CONTRACT_ADDRESS, depositAmountWei]
      });

    } catch (error) {
      console.error('Direct transfer failed:', error);
      handleTransactionError(error, 'Direct transfer');
    }
  }, [isConnected, amount, validateAmount, triggerFormShakeAnimation, directTransfer, USDT_ADDRESS, handleTransactionError, formRef]);

  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setAmount('');
    resetTransactionState();
  }, [resetTransactionState]);

  // Centralized API function for updating manual deposit transaction
  const updateManualDepositTransaction = useCallback(async (originalTxHash, status, contractTxHash, amount, networkId, depositorAddress) => {
    try {
      const payload = {
        originalTxHash,
        status,
        contractTxHash,
        amount: cleanAmountForAPI(formatUSDTBalance(amount)),
        networkId,
        currency: 'USDT', // Assuming USDT for now
        depositorAddress,
        description: `Manual deposit of ${formatUSDTBalance(amount)} USDT processed.`,
      };

      const apiResponse = await fetch('/api/investor/wallet/deposit/update-manual-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await apiResponse.json();
      if (apiResponse.ok) {
        console.log('Manual deposit transaction updated successfully:', result);
        return result;
      } else {
        console.error('Error updating manual deposit transaction:', result.message);
        return null;
      }
    } catch (error) {
      console.error('API Error updating manual deposit transaction:', error);
      return null;
    }
  }, [cleanAmountForAPI]);

  // --- New: Verify Transaction Logic ---
  const fetchTransactionDetails = useCallback(async () => {
    setVerifyTxStatus('');
    setVerifyStatusType('');
    setVerifiedTxDetails(null);
    setIsVerifyingTx(true);

    if (!txHashInput) {
      setVerifyTxStatus('Please enter a transaction hash.');
      setVerifyStatusType(STATUS_TYPES.ERROR);
      triggerFormShakeAnimation(verifyFormRef); // Pass verifyFormRef
      setIsVerifyingTx(false);
      return;
    }

    if (txHashInput.length !== 66 || !txHashInput.startsWith('0x')) {
      setVerifyTxStatus('Invalid transaction hash format. Must be a 0x-prefixed 66-character hexadecimal string.');
      setVerifyStatusType(STATUS_TYPES.ERROR);
      triggerFormShakeAnimation(verifyFormRef);
      setIsVerifyingTx(false);
      return;
    }

    setVerifyTxStatus('Fetching transaction details...');
    setVerifyStatusType(STATUS_TYPES.PENDING);

    try {
      const response = await fetch('/api/investor/wallet/deposit/get-tx-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txHash: txHashInput }),
      });

      const result = await response.json();

      if (response.ok) {
        setVerifiedTxDetails(result.txDetails);
        setVerifyTxStatus('Transaction details fetched successfully. Review and verify.');
        setVerifyStatusType(STATUS_TYPES.SUCCESS);
      } else {
        setVerifyTxDetails(null);
        setVerifyTxStatus(`Error: ${result.message || 'Failed to fetch transaction details.'}`);
        setVerifyStatusType(STATUS_TYPES.ERROR);
      }
    } catch (error) {
      console.error('Client-side API Error fetching transaction details:', error);
      setVerifyTxStatus(`Network error: ${error.message}`);
      setVerifyStatusType(STATUS_TYPES.ERROR);
    } finally {
      setIsVerifyingTx(false);
    }
  }, [txHashInput, triggerFormShakeAnimation, verifyFormRef]);



  const handleVerifyTransaction = useCallback(async () => {
    setVerifyTxStatus('');
    setVerifyStatusType('');

    if (!isConnected) {
      setVerifyTxStatus('Please connect your wallet first.');
      setVerifyStatusType(STATUS_TYPES.ERROR);
      openRainbowKitConnectModal();
      return;
    }

    if (!verifiedTxDetails) {
      setVerifyTxStatus('Please fetch transaction details first.');
      setVerifyStatusType(STATUS_TYPES.ERROR);
      triggerFormShakeAnimation(verifyFormRef);
      return;
    }

    if (address && verifiedTxDetails.fromAddress && address.toLowerCase() !== verifiedTxDetails.fromAddress.toLowerCase()) {
      setVerifyTxStatus('Connected wallet address does not match the transaction sender address. Please connect the correct wallet.');
      setVerifyStatusType(STATUS_TYPES.ERROR);
      return;
    }

    setIsVerifyingTx(true);
    setVerifyTxStatus('Confirming manual deposit via smart contract...');
    setVerifyStatusType(STATUS_TYPES.PENDING);

    try {
      const depositAmountWei = BigInt(verifiedTxDetails.amount);
      await manualProcessDirectDeposit({
        address: CONTRACT_ADDRESS,
        abi: LUXE_ABI,
        functionName: 'processDirectDeposit',
        args: [verifiedTxDetails.fromAddress, depositAmountWei, txHashInput]
      });
    } catch (error) {
      console.error('Manual processDirectDeposit failed:', error);

      // Enhanced error parsing to catch contract revert messages
      let errorMessage = '';

      // Check for user rejection first
      if (error.message?.includes('User rejected the request')) {
        errorMessage = 'Transaction rejected by user.';
      }
      // Check for insufficient funds
      else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Failed: Insufficient funds for transaction.';
      }
      // Check for contract revert reasons in various places
      else if (error.cause?.reason) {
        // This is where Solidity revert messages usually appear
        errorMessage = `Contract Error: ${error.cause.reason}`;
      }
      else if (error.reason) {
        errorMessage = `Contract Error: ${error.reason}`;
      }
      else if (error.cause?.message) {
        errorMessage = `Error: ${error.cause.message}`;
      }
      else if (error.details) {
        errorMessage = `Error: ${error.details}`;
      }
      else if (error.shortMessage) {
        errorMessage = `Error: ${error.shortMessage}`;
      }
      else {
        errorMessage = `Verification failed: ${error.message}`;
      }

      // Log full error for debugging
      console.log('Full error object:', {
        message: error.message,
        cause: error.cause,
        reason: error.reason,
        details: error.details,
        shortMessage: error.shortMessage,
        fullError: error
      });

      setVerifyTxStatus(errorMessage);
      setVerifyStatusType(STATUS_TYPES.ERROR);
      setIsVerifyingTx(false);
    }
  }, [isConnected, verifiedTxDetails, address, txHashInput, manualProcessDirectDeposit, openRainbowKitConnectModal, triggerFormShakeAnimation, verifyFormRef]);

  // Effect for manualProcessDirectDeposit confirmation
  useEffect(() => {
    if (isManualProcessDirectDepositPending) {
      setVerifyTxStatus('Confirming manual deposit via smart contract. Please confirm in your wallet...');
      setVerifyStatusType(STATUS_TYPES.PENDING);
    }
  }, [isManualProcessDirectDepositPending]);

  useEffect(() => {
    if (isManualProcessDirectDepositConfirming) {
      setVerifyTxStatus('Manual deposit transaction submitted. Awaiting blockchain confirmation...');
      setVerifyStatusType(STATUS_TYPES.PENDING);
    }
  }, [isManualProcessDirectDepositConfirming]);

  useEffect(() => {
    const handleManualDepositSuccess = async () => {
      if (isManualProcessDirectDepositSuccess && verifiedTxDetails) { // Add null check for verifiedTxDetails
        setVerifyTxStatus(`Manual deposit of ${formatUSDTBalance(verifiedTxDetails.amount)} USDT successfully processed!`);
        setVerifyStatusType(STATUS_TYPES.SUCCESS);
        setShowSuccessModal(true); // Reuse success modal
        showConfettiEffect();
        refetchBalance();
        setIsVerifyingTx(false);

        // Update transaction in DB
        if (txHashInput && manualProcessDirectDepositHash) { // verifiedTxDetails is already checked
          await updateManualDepositTransaction(
            txHashInput,
            'completed',
            manualProcessDirectDepositHash,
            verifiedTxDetails.amount,
            chain?.id,
            address
          );
        }
        // Do NOT reset form here. Reset only on modal close.
      }
    };

    handleManualDepositSuccess();
  }, [isManualProcessDirectDepositSuccess, verifiedTxDetails, showConfettiEffect, refetchBalance, txHashInput, manualProcessDirectDepositHash, chain?.id, address, updateManualDepositTransaction]);

  useEffect(() => {
    if (manualProcessDirectDepositError) {
      let errorMessage = '';
      if (manualProcessDirectDepositError.message?.includes('User rejected the request')) {
        errorMessage = 'Transaction rejected by user.';
      } else if (manualProcessDirectDepositError.message?.includes('insufficient funds')) {
        errorMessage = 'Failed: Insufficient funds for transaction.';
      } else {
        errorMessage = `Verification failed: ${manualProcessDirectDepositError.shortMessage || manualProcessDirectDepositError.message}`;
      }
      setVerifyTxStatus(errorMessage);
      setVerifyStatusType(STATUS_TYPES.ERROR);
      setIsVerifyingTx(false);
    }
  }, [manualProcessDirectDepositError]);


  // Contract event listener (for DirectDeposit event, relevant for both methods)
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: LUXE_ABI,
    eventName: 'DirectDeposit',
    args: { user: address },
    onLogs(logs) {
      logs.forEach(async (log) => {
        // This listener will catch events from both direct transfer and manual verification
        // We need to ensure it only triggers for the relevant transaction
        const relevantTxHash = currentTransaction?.txHash || txHashInput; // Check both
        if (log.args.user === address && log.args.txHash === relevantTxHash) {
          // Update pendingDeposits map (if applicable for direct transfer)
          setPendingDeposits(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(log.args.txHash);
            if (existing) {
              newMap.set(log.args.txHash, { ...existing, status: 'completed' });
            }
            return newMap;
          });

          // This part might need refinement if manual verification doesn't create a DB record initially
          // For now, assuming it might update an existing one or create a new one if needed.
          // The prompt implies manual verification is for transactions *not yet reflected on the platform*.
          // So, we might need a separate API call to record this manual verification in the DB.
          // For simplicity, I'll assume the `updateTransaction` can handle this or it's out of scope for now.
          // The prompt only asks to call the smart contract function.

          // If it's a manual verification, update status
          if (activeTab === 'verify') {
            setVerifyTxStatus(`Manual deposit of ${formatUSDTBalance(log.args.amount)} USDT successfully processed!`);
            setVerifyStatusType(STATUS_TYPES.SUCCESS);
            // Do NOT reset form here. Reset only on modal close.
          } else {
            // This is for the original direct transfer flow
            setTxStatus(`USDT deposit of ${formatUSDTBalance(log.args.amount)} added to your account balance successfully!`);
            setStatusType(STATUS_TYPES.SUCCESS);
          }

          setShowSuccessModal(true);
          showConfettiEffect();
          refetchBalance();
        }
      });
    },
    enabled: isConnected && !!address, // Enable if connected, regardless of currentTransaction
  });

  // Simplified effects - only handle state transitions, not complex logic
  useEffect(() => {
    if (isDirectTransferPending) {
      setTxStatus('Step 1/3: Requesting direct USDT transfer. Please confirm in your wallet...');
      setStatusType(STATUS_TYPES.PENDING);
      setTransactionStage(TRANSACTION_STAGES.REQUESTING_TRANSFER);
    }
  }, [isDirectTransferPending]);

  useEffect(() => {
    if (isDirectTransferConfirming) {
      setTxStatus('Step 2/3: Direct USDT transfer requested successfully. Awaiting blockchain confirmation...');
      setStatusType(STATUS_TYPES.PENDING);
      setTransactionStage(TRANSACTION_STAGES.CONFIRMING_TRANSFER);
    }
  }, [isDirectTransferConfirming]);

  // Handle new transaction hash - Create initial record
  useEffect(() => {
    if (directTransferHash && !currentTransaction) {
      createInitialTransaction(directTransferHash, amount, chain?.id, address)
        .then((dbId) => {
          if (dbId) {
            const transactionData = {
              dbId,
              txHash: directTransferHash,
              amount: cleanAmountForAPI(amount),
              networkId: chain?.id,
              depositorAddress: address,
            };

            setCurrentTransaction(transactionData);

            // Update pendingDeposits map
            setPendingDeposits(prev => {
              const newMap = new Map(prev);
              newMap.set(directTransferHash, {
                ...transactionData,
                timestamp: Date.now(),
                status: 'pending'
              });
              return newMap;
            });

            setTxStatus('Transaction submitted! Awaiting confirmation...');
            setStatusType(STATUS_TYPES.PENDING);
          } else {
            handleTransactionError(new Error('Failed to create transaction record'), 'Database');
          }
        });
    }
  }, [directTransferHash, currentTransaction, amount, chain?.id, address, createInitialTransaction, handleTransactionError, cleanAmountForAPI]);

  // Handle transfer confirmation
  useEffect(() => {
    if (isDirectTransferSuccess && currentTransaction && !isProcessDepositPending && !isProcessDepositConfirming && transactionStage === TRANSACTION_STAGES.CONFIRMING_TRANSFER) {
      handleDirectTransferConfirmed();
    }
  }, [isDirectTransferSuccess, currentTransaction, isProcessDepositPending, isProcessDepositConfirming, handleDirectTransferConfirmed, transactionStage]);

  // Handle process deposit states
  useEffect(() => {
    if (isProcessDepositPending) {
      setTxStatus('Step 3/3: Confirming contract processing. Please confirm in your wallet...');
      setStatusType(STATUS_TYPES.PENDING);
    }
  }, [isProcessDepositPending]);

  useEffect(() => {
    if (isProcessDepositConfirming) {
      setTxStatus('Step 3/3: Contract processing initiated. Awaiting blockchain confirmation...');
      setStatusType(STATUS_TYPES.PENDING);
    }
  }, [isProcessDepositConfirming]);

  useEffect(() => {
    if (isProcessDepositSuccess && currentTransaction) {
      handleProcessDepositConfirmed();
    }
  }, [isProcessDepositSuccess, currentTransaction, handleProcessDepositConfirmed]);

  // Handle errors
  useEffect(() => {
    if (directTransferError) {
      handleTransactionError(directTransferError, 'Direct transfer');
    }
  }, [directTransferError, handleTransactionError]);

  useEffect(() => {
    if (processDepositError) {
      handleTransactionError(processDepositError, 'Contract processing');
    }
  }, [processDepositError, handleTransactionError]);

  // Show success modal effect
  useEffect(() => {
    if (statusType === STATUS_TYPES.SUCCESS) {
      setShowSuccessModal(true);
      showConfettiEffect();
    }
  }, [statusType, showConfettiEffect]);

  // Preset amount options
  const amountOptions = [100, 500, 1000, 5000, 10000, 25000, 50000];

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-white">
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] bg-repeat opacity-[0.03]"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full filter opacity-5 "></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600 rounded-full filter opacity-5 animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-600 rounded-full filter opacity-5 animation-delay-4000"></div>
      </div>

      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-gray-800 to-gray-900 max-w-md w-full rounded-2xl p-8 shadow-2xl border border-gray-700/50 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-green-400"></div>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Deposit Successful!</h2>
                <p className="text-gray-300 mb-4">Your deposit of {amount} USDT has been processed successfully.</p>
                <p className="text-sm text-gray-400 mb-6">The funds will be available in your account shortly.</p>
                <button
                  onClick={handleCloseSuccessModal}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg shadow-lg transition-all duration-300"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 relative z-10 lg:max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg mx-auto"
        >
          <div className="flex flex-col sm:flex-nowrap items-start sm:items-center mb-10 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-normal bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Deposit Funds
              </h1>
              <p className="text-gray-400 mt-2 ">Securely add USDT to your investment account</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-6 py-3 rounded-l-lg font-semibold transition-colors duration-200 ${activeTab === 'deposit'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
            >
              New Deposit
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-6 py-3 rounded-r-lg font-semibold transition-colors duration-200 ${activeTab === 'verify'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                }`}
            >
              Not Reflecting
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="backdrop-blur-md bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/30 shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"></div>

            <div className="p-4">
              {!isConnected ? (
                <div className="py-10 text-center">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 1.5
                    }}
                    className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/30 text-blue-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-500 mb-4">Wallet Connection Required</h2>
                  <p className="text-gray-400 mb-8 max-w-sm mx-auto">Connect your wallet to securely deposit USDT to your investment account.</p>
                  {USE_CONNECTKIT ? (
                    <div className="flex justify-center">
                      <ConnectKitButton theme='nouns' />
                    </div>
                  ) : (
                    <button
                      onClick={openRainbowKitConnectModal}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* MODIFIED SECTION FOR OVERFLOW FIX START */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2 mb-8 pb-4 border-b border-gray-700/30">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500/20 to-blue-600/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-sm text-gray-400">Connected Wallet</span>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="font-medium text-gray-200">{truncateAddress(address)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right min-w-0">
                      <span className="block text-sm text-gray-400 mb-1">Network</span>
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-full text-sm font-medium text-blue-300 inline-block break-all">
                        {chain?.name || 'Unknown Network'} ({chain?.id})
                      </span>
                    </div>

                    <button
                      onClick={() => disconnect()}
                      className="px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-300 transition-colors duration-200 flex-shrink-0"
                      title="Disconnect Wallet"
                    >
                      Disconnect
                    </button>
                  </div>
                  {/* MODIFIED SECTION FOR OVERFLOW FIX END */}

                  {/* Conditional rendering based on activeTab */}
                  {activeTab === 'deposit' && (
                    <>
                      {/* User Balance Display */}
                      {userBalance !== undefined && (
                        <div className="mb-6 p-2 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/30 border border-gray-600/30">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0-2.08-.402-2.599-1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-gray-300">Available USDT</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-medium text-gray-200">
                                {userBalance ? formatUSDTBalance(userBalance) : '0.00'} USDT
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Unprocessed Deposits Display */}
                      {unprocessedDeposits !== undefined && unprocessedDeposits > 0n && (
                        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded">
                          <p className="text-sm text-yellow-800 font-semibold">
                            Contract has {formatUnits(unprocessedDeposits, 6)} USDT in unprocessed deposits
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            These will be processed by admin and credited to respective users
                          </p>
                        </div>
                      )}

                      <form ref={formRef} onSubmit={handleDirectTransfer} className="space-y-6">
                        <div>
                          <label htmlFor="depositAmount" className="block text-gray-300 mb-2 font-medium">
                            Amount (USDT)
                          </label>
                          <div className="relative">
                            <input
                              id="depositAmount"
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full p-4 pl-12 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white placeholder-gray-500 text-lg transition-all duration-200"
                              min="0"
                              step="any"
                              required
                              disabled={isDepositing}
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <span className="text-gray-400">$</span>
                            </div>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                              <span className="text-gray-400">USDT</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-sm text-gray-400">Quick select:</span>
                            {amountOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                className="px-3 py-1 text-sm bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full text-blue-300 transition-colors duration-200"
                                onClick={() => setAmount(option.toString())}
                                disabled={isDepositing}
                              >
                                ${option}
                              </button>
                            ))}
                          </div>
                        </div>

                        {transactionStage > 0 && (
                          <div className="mt-6 mb-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                              <span className={transactionStage >= 1 ? 'text-blue-400' : ''}>Transfer</span>
                              <span className={transactionStage >= 2 ? 'text-blue-400' : ''}>Confirmation</span>
                              <span className={transactionStage >= 3 ? 'text-blue-400' : ''}>Contract Call</span>
                              <span className={transactionStage >= 4 ? 'text-green-400' : ''}>Complete</span>
                            </div>
                            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${transactionStage === 4
                                  ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-green-400'
                                  : 'bg-blue-500'
                                  } transition-all duration-500 ease-out`}
                                style={{ width: `${(transactionStage / 4) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <motion.button
                            type="submit"
                            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${isDepositing || !isConnected
                              ? 'bg-gray-700/70 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg hover:shadow-blue-500/20'
                              }`}
                            disabled={isDepositing || !isConnected}
                            whileHover={{ scale: isDepositing || !isConnected ? 1 : 1.02 }}
                            whileTap={{ scale: isDepositing || !isConnected ? 1 : 0.98 }}
                          >
                            {isDepositing ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isDirectTransferPending && "Confirming Transfer..."}
                                {isDirectTransferConfirming && "Processing Transfer..."}
                                {isProcessDepositPending && "Confirming Contract Call..."}
                                {isProcessDepositConfirming && "Processing Contract Call..."}
                              </span>
                            ) : (
                              'Send USDT (Direct Transfer)'
                            )}
                          </motion.button>
                        </div>
                      </form>

                      {/* Error/Status Display */}
                      {(directTransferError || txStatus) && !showSuccessModal && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-6 p-4 rounded-lg ${statusType === 'success' ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20' :
                            statusType === 'error' ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20' :
                              'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {statusType === 'success' ? (
                              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            ) : statusType === 'error' ? (
                              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            ) : (
                              <svg className="w-5 h-5 text-yellow-500 mt-0.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            <p className={`text-sm ${statusType === 'success' ? 'text-green-300' : statusType === 'error' ? 'text-red-300' : 'text-yellow-300'}`}>
                              {directTransferError?.message || txStatus}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Pending Direct Deposits */}
                      {pendingDeposits.size > 0 && (
                        <div className="border-t pt-6 mt-6">
                          <h3 className="text-lg font-semibold mb-4 text-gray-100">Your Direct Deposits</h3>
                          <div className="space-y-3">
                            {[...pendingDeposits.values()].map((deposit) => {
                              // Helper function to get status info
                              const getStatusInfo = (status) => {
                                switch (status) {
                                  case 'pending':
                                    return {
                                      bgClass: 'border-yellow-400 bg-yellow-50/20',
                                      badgeClass: 'bg-yellow-200 text-yellow-800',
                                      text: 'Confirming'
                                    };
                                  case 'confirmed':
                                    return {
                                      bgClass: 'border-blue-400 bg-blue-50/20',
                                      badgeClass: 'bg-blue-200 text-blue-800',
                                      text: 'Processing'
                                    };
                                  case 'completed':
                                    return {
                                      bgClass: 'border-green-400 bg-green-50/20',
                                      badgeClass: 'bg-green-200 text-green-800',
                                      text: 'Completed'
                                    };
                                  case 'failed':
                                    return {
                                      bgClass: 'border-red-400 bg-red-50/20',
                                      badgeClass: 'bg-red-200 text-red-800',
                                      text: 'Failed'
                                    };
                                  default:
                                    return {
                                      bgClass: 'border-gray-400 bg-gray-50/20',
                                      badgeClass: 'bg-gray-200 text-gray-800',
                                      text: 'Unknown'
                                    };
                                }
                              };

                              const statusInfo = getStatusInfo(deposit.status);

                              return (
                                <div
                                  key={deposit.txHash}
                                  className={`p-3 rounded border-l-4 ${statusInfo.bgClass}`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-gray-200">{deposit.amount} USDT</p>
                                      <p className="text-xs text-gray-400">
                                        {new Date(deposit.timestamp).toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 font-mono">
                                        Tx: {deposit.txHash.slice(0, 10)}...{deposit.txHash.slice(-8)}
                                      </p>
                                      {/* Add status description */}
                                      <p className="text-xs text-gray-400 mt-1">
                                        {deposit.status === 'pending' && 'Awaiting blockchain confirmation...'}
                                        {deposit.status === 'confirmed' && 'Transfer confirmed, processing deposit...'}
                                        {deposit.status === 'completed' && 'Successfully added to your balance'}
                                        {deposit.status === 'failed' && 'Transaction failed'}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded ${statusInfo.badgeClass}`}>
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'verify' && (
                    <div className="space-y-6">
                        {/* Info Card */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                              <Info className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold mb-2">Transaction Not Reflected?</h3>
                              <p className="text-slate-300 leading-relaxed">
                                If your deposit transaction is confirmed on the blockchain but not yet reflected on the platform,
                                use this verification tool to manually process it.
                              </p>
                            </div>
                          </div>
                        </div>
                      <form ref={verifyFormRef} onSubmit={(e) => { e.preventDefault(); fetchTransactionDetails(); }} className="space-y-6">
                        <div>
                          <label htmlFor="txHashInput" className="block text-gray-300 mb-2 font-medium">
                            Transaction Hash (TxHash)
                          </label>
                          <div className="relative">
                            <input
                              id="txHashInput"
                              type="text"
                              value={txHashInput}
                              onChange={(e) => {
                                setTxHashInput(e.target.value);
                                setVerifiedTxDetails(null); // Clear details on input change
                                setVerifyTxStatus('');
                                setVerifyStatusType('');
                              }}
                              placeholder="0x..."
                              className="w-full p-4 pl-12 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white placeholder-gray-500 text-lg transition-all duration-200"
                              required
                              disabled={isVerifyingTx}
                            />
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Hash size={20} className="text-gray-400" />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className={`mt-4 w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-300 ${isVerifyingTx
                              ? 'bg-gray-700/70 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg hover:shadow-purple-500/20'
                              }`}
                            disabled={isVerifyingTx}
                          >
                            {isVerifyingTx ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Fetching Details...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <Search size={18} /> Fetch Transaction Details
                              </span>
                            )}
                          </button>
                        </div>
                      </form>

                      {verifyTxStatus && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-6 p-4 rounded-lg ${verifyStatusType === 'success' ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20' :
                            verifyStatusType === 'error' ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20' :
                              'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {verifyStatusType === 'success' ? (
                              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            ) : verifyStatusType === 'error' ? (
                              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            ) : (
                              <svg className="w-5 h-5 text-yellow-500 mt-0.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            <p className={`text-sm ${verifyStatusType === 'success' ? 'text-green-300' : verifyStatusType === 'error' ? 'text-red-300' : 'text-yellow-300'}`}>
                              {verifyTxStatus}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {verifiedTxDetails && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 space-y-3"
                        >
                          <h4 className="text-lg font-semibold text-gray-200 mb-3">Transaction Details</h4>
                          <div className="flex justify-between font-semi items-center text-sm text-gray-300">
                            <span>Amount:</span>
                            <span className="font-semibold text-blue-300 ">
                              {formatUSDTBalance(verifiedTxDetails.amount)} USDT
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-300">
                            <span>Sender Address:</span>
                            <span className="font-medium text-blue-300">
                              {truncateAddress(verifiedTxDetails.fromAddress)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-300">
                            <span>Your Connected Wallet:</span>
                            <span className={`font-medium ${address?.toLowerCase() === verifiedTxDetails.fromAddress?.toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>
                              {truncateAddress(address)}
                            </span>
                          </div>
                          {address?.toLowerCase() !== verifiedTxDetails.fromAddress?.toLowerCase() && (
                            <p className="text-xs text-red-400 mt-2">
                              Warning: Your connected wallet does not match the sender of this transaction.
                              Please connect the correct wallet to proceed with verification.
                            </p>
                          )}
                          <button
                            onClick={handleVerifyTransaction}
                            className={`mt-6 w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${isVerifyingTx || !isConnected || address?.toLowerCase() !== verifiedTxDetails.fromAddress?.toLowerCase()
                              ? 'bg-gray-700/70 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg hover:shadow-blue-500/20'
                              }`}
                            disabled={isVerifyingTx || !isConnected || address?.toLowerCase() !== verifiedTxDetails.fromAddress?.toLowerCase()}
                            whileHover={{ scale: isVerifyingTx || !isConnected || address?.toLowerCase() !== verifiedTxDetails.fromAddress?.toLowerCase() ? 1 : 1.02 }}
                            whileTap={{ scale: isVerifyingTx || !isConnected || address?.toLowerCase() !== verifiedTxDetails.fromAddress?.toLowerCase() ? 1 : 0.98 }}
                          >
                            {isVerifyingTx ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isManualProcessDirectDepositPending && "Confirming Contract Call..."}
                                {isManualProcessDirectDepositConfirming && "Processing Contract Call..."}
                              </span>
                            ) : (
                              'Verify Transaction'
                            )}
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Helpful Info Card Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 max-w-2xl mx-auto space-y-5" // Adjusted max-width and spacing
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-100 mb-10 text-center relative pb-3"> {/* Enhanced title styling */}
              Helpful Information
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent"></span>
            </h2>

            <InfoCard title="General Instructions" icon={BookOpen} id="instructions">
              <div className="space-y-4">
                <StepItem
                  step="Step 1"
                  title="Connect Wallet"
                  description="Ensure your preferred crypto wallet (e.g., MetaMask) is connected. You'll see your connected address and network."
                  icon={Wallet}
                />
                <StepItem
                  step="Step 2"
                  title="Enter Amount"
                  description="Input the amount of USDT you wish to deposit. You can use the quick select options for common amounts."
                  icon={DollarSign}
                />
                <StepItem
                  step="Step 3"
                  title="Confirm Direct Transfer"
                  description="Your wallet will prompt you to confirm the direct USDT transfer to the Luxe contract. Review the details carefully."
                  icon={CheckCircle}
                />
                <StepItem
                  step="Step 4"
                  title="Monitor Status"
                  description="Track the transaction progress on the page. Direct transfers require admin processing to be credited to your account."
                  icon={Clock}
                />
              </div>
            </InfoCard>

            <InfoCard title="Frequently Asked Questions (FAQs)" icon={HelpCircle} id="faqs">
              <div className="space-y-4">
                <FAQItem
                  question="What is USDT?"
                  answer="USDT (Tether) is a stablecoin pegged to the US Dollar. This means 1 USDT is intended to always be worth 1 USD."
                  icon={DollarSign}
                />
                <FAQItem
                  question="Why is this a direct transfer?"
                  answer="This method sends USDT directly to the contract, simplifying the user experience by removing the separate approval step. Funds are credited after admin processing."
                  icon={Shield}
                />
                <FAQItem
                  question="How long does a direct deposit take to process?"
                  answer="After your transaction is confirmed on the blockchain, it will appear as 'Awaiting Admin'. The time it takes to be processed and credited to your balance depends on admin processing times."
                  icon={Clock}
                />
                <FAQItem
                  question="Can I deposit other cryptocurrencies?"
                  answer="Currently, only USDT deposits are supported."
                  icon={CreditCard}
                />
                <FAQItem
                  question="What happens if my transaction fails?"
                  answer="If a transaction fails, the funds usually remain in your wallet, minus any gas fees incurred. Check the Transaction Status message for specific error details. You can then retry the deposit."
                  icon={AlertTriangle}
                />
              </div>
            </InfoCard>

            <InfoCard title="Troubleshooting Tips" icon={AlertTriangle} id="troubleshooting">
              <div className="space-y-4">
                <TroubleshootingItem
                  title="Transaction Stuck/Pending"
                  icon={Clock}
                  solutions={[
                    "Check your wallet for pending transactions. Sometimes, a previous transaction needs to clear first.",
                    "Ensure you have enough ETH (for Ethereum mainnet/Sepolia) or the native token of your current network to cover gas fees.",
                    "Try speeding up or canceling the transaction in your wallet (if supported)."
                  ]}
                />
                <TroubleshootingItem
                  title="Insufficient Funds Error"
                  icon={DollarSign}
                  solutions={[
                    "Verify your USDT balance.",
                    "Ensure you have enough of the network's native token (e.g., ETH on Ethereum, MATIC on Polygon) for gas fees, in addition to the USDT you want to deposit."
                  ]}
                />
                <TroubleshootingItem
                  title="Wallet Not Connecting"
                  icon={Wifi}
                  solutions={[
                    "Refresh the page.",
                    "Ensure your wallet extension is unlocked and active in your browser.",
                    "Try disconnecting and reconnecting your wallet."
                  ]}
                />
              </div>
            </InfoCard>

            <InfoCard title="Definitions of Terms" icon={BookOpen} id="definitions">
              <div className="space-y-4">
                <DefinitionItem
                  term="USDT (Tether)"
                  definition="A cryptocurrency that is a stablecoin, meaning it aims to peg its market value to an external reference, in this case, the US Dollar."
                  icon={DollarSign}
                />
                <DefinitionItem
                  term="Network (Blockchain Network)"
                  definition="A decentralized, distributed ledger system where transactions are recorded and verified. Examples include Ethereum Mainnet, Sepolia Testnet."
                  icon={Network}
                />
                <DefinitionItem
                  term="Transaction Hash (Tx Hash)"
                  definition="A unique identifier for a transaction on a blockchain. It's like a receipt number for your on-chain activity."
                  icon={Hash}
                />
                <DefinitionItem
                  term="Smart Contract"
                  definition="A self-executing contract with the terms of the agreement directly written into lines of code. Our deposit functionality is powered by a smart contract."
                  icon={FileText}
                />
                <DefinitionItem
                  term="Gas Fee"
                  definition="A fee paid by users to compensate for the computing energy required to process and validate transactions on a blockchain network. It's usually paid in the native cryptocurrency of the network (e.g., ETH for Ethereum)."
                  icon={Fuel}
                />
                <DefinitionItem
                  term="Wallet (Crypto Wallet)"
                  definition="A digital tool that allows you to securely store, send, and receive cryptocurrencies. It manages your public and private keys."
                  icon={Wallet}
                />
              </div>
            </InfoCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
