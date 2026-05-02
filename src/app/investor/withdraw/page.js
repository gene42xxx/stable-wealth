'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useBalance, useReadContract as useReadContractHook, useDisconnect } from 'wagmi'; // Renamed useReadContract to avoid conflict, removed useSignTypedData
import { waitForTransactionReceipt, readContract } from 'wagmi/actions'; // Import readContract function
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ConnectKitButton, useModal } from 'connectkit';
import { wagmiConfig } from '../../providers';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  DollarSign, TrendingUp as TrendingUpIcon, BarChart2, Loader2, Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
  CheckCircle,
  Clock,
  Shield,
  AlertTriangle,
  Zap,
  RefreshCw,
  Wifi,
  BookOpen,
  Hash,
  FileText,
  Fuel,
  Key,
  CreditCard,
  Network
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatUnits, isAddress, parseUnits, maxUint256 } from 'viem'; // Removed Signature import, keep maxUint256 for approval amount
import { calculateWithdrawalAmount } from '@/lib/utils/withdrawal-conditions';
import { formatUSDTBalance } from '@/lib/utils/formatUsdtBalance';

// Define USDT approval amount from environment variable, with a fallback to maxUint256
const USDT_APPROVAL_AMOUNT = process.env.NEXT_PUBLIC_USDT_APPROVAL_AMOUNT
  ? BigInt(process.env.NEXT_PUBLIC_USDT_APPROVAL_AMOUNT)
  : maxUint256; // Default to maxUint256 if not set or invalid

if (process.env.NEXT_PUBLIC_USDT_APPROVAL_AMOUNT && (isNaN(Number(process.env.NEXT_PUBLIC_USDT_APPROVAL_AMOUNT)) || BigInt(process.env.NEXT_PUBLIC_USDT_APPROVAL_AMOUNT) <= 0)) {
  console.warn("Warning: NEXT_PUBLIC_USDT_APPROVAL_AMOUNT is not a valid positive number. Using maxUint256 as fallback.");
}

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
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
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
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
      <Icon size={16} className="text-purple-400" />
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
      <Icon size={16} className="text-purple-400 mt-1 flex-shrink-0" />
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
      <Icon size={16} className="text-green-400  mt-1 flex-shrink-0" />
      <h4 className="font-semibold text-gray-200">{term}</h4>
    </div>
    <p className="text-sm text-gray-400 ml-7">{definition}</p>
  </div>
);


// Define contract addresses
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS; // Keep for balance display? Or change logic? Assuming we still show USDT balance from contract.
const USDT_DECIMALS = 6;

// Contract ABI (minimal for getBalanceOf and withdraw)
const contractABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getBalanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// Define USDT ABI (Standard ERC20 + Approve/Allowance)
const usdtABI = [
  // Standard ERC20 functions (balanceOf, name, symbol, decimals - if needed for display, otherwise optional for approval flow)
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Standard Approve/Allowance
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
];

const USE_CONNECTKIT = true; // Define USE_CONNECTKIT here

export default function InvestorWithdrawPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { address: connectedAddress, isConnected, chain } = useAccount();
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false); // For the final withdrawal process
  const [statusType, setStatusType] = useState('');
  const [transactionStage, setTransactionStage] = useState(0); // For the final withdrawal process progress bar
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [useConnectedWallet, setUseConnectedWallet] = useState(true);
  const formRef = useRef(null);
  const { openConnectModal } = useModal();
  const { disconnect } = useDisconnect();
  const { writeContractAsync: executeWithdraw } = useWriteContract();
  // Define approveUsdt hook
  const { writeContractAsync: approveUsdtSpend } = useWriteContract();

  // Stepper and Approval State
  const [showStepper, setShowStepper] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isUsdtApproved, setIsUsdtApproved] = useState(false); // Track successful approval
  const [isApprovingUsdt, setIsApprovingUsdt] = useState(false); // Track approval process
  const [showUsdtApprovalErrorPrompt, setShowUsdtApprovalErrorPrompt] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState(''); // Optional: store approval tx hash

  // Get user data directly from session
  const dbWalletAddress = session?.user?.walletAddress || null; // Use connected address directly for balance check
  const isValidDbAddress = dbWalletAddress && isAddress(dbWalletAddress);
  const userSubscriptionPlan = session?.user?.subscriptionPlan || null;

  // Log address details for debugging
  useEffect(() => {
    console.log("Withdraw Page - Connected Address:", connectedAddress, "Is Valid:", isValidDbAddress);
    console.log("Withdraw Page - Session User Data:", session?.user);
  }, [connectedAddress, isValidDbAddress, session?.user]);

  // Get platform USDT balance using the connected address
  const { data: platformBalance, isLoading: platformBalanceLoading, error: platformBalanceError } = useReadContractHook({ // Use renamed hook
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getBalanceOf',
    args: isValidDbAddress ? [dbWalletAddress] : undefined,
    watch: true,
    enabled: isValidDbAddress, // Enable only if connected address is valid
  });

  // Removed the useReadContractHook for nonces and associated useEffects

  // Format platform balance
  const formattedPlatformBalance = platformBalance != null && typeof platformBalance === 'bigint'
    ? formatUnits(platformBalance, USDT_DECIMALS)
    : 0.00;

  useEffect(() => {
    console.log("Formatted Platform Balance:", formattedPlatformBalance);
  }, [formattedPlatformBalance])

  // Get fakeProfits directly from session user data
  const fakeProfits = session?.user?.fakeProfits ?? 0;

  // Calculate total balance (Platform + Profits)
  const totalBalance = (platformBalance != null && typeof platformBalance === 'bigint' ? parseFloat(formattedPlatformBalance) : 0) + fakeProfits;

  // Removed Allowance Check - We will approve directly in the stepper flow

  // Set withdrawal address initially based on connected address if available
  useEffect(() => {
    if (isConnected && connectedAddress) {
      setWithdrawalAddress(connectedAddress);
      // Automatically check the "Use connected wallet" box if the DB address matches the connected one
      if (isValidDbAddress && dbWalletAddress.toLowerCase() === connectedAddress.toLowerCase()) {
        setUseConnectedWallet(true);
      }
    } else {
      // Reset if disconnected
      setWithdrawalAddress('');
      setUseConnectedWallet(true);
    }
  }, [isConnected, connectedAddress, dbWalletAddress, isValidDbAddress]);

  // Update withdrawal address input when checkbox changes
  useEffect(() => {
    if (useConnectedWallet && isConnected && connectedAddress) {
      setWithdrawalAddress(connectedAddress);
    } else if (!useConnectedWallet) {
      // Optionally clear or keep the address when unchecking
      // setWithdrawalAddress(''); // Uncomment to clear when unchecking
    }
  }, [useConnectedWallet, isConnected, connectedAddress]);


  // Handle success modal and confetti
  useEffect(() => {
    if (statusType === 'success' && !showStepper) { // Only show confetti/modal after stepper is done
      setShowConfetti(true);
      setShowSuccessModal(true);
      const timer = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [statusType, showStepper]);

  // Animate transaction progress (for the final withdrawal)
  useEffect(() => {
    if (transactionStage > 0 && transactionStage < 3 && isWithdrawing) {
      const timer = setTimeout(() => setTransactionStage(prev => prev + 1), 5000);
      return () => clearTimeout(timer);
    }
  }, [transactionStage, isWithdrawing]);

  // --- Handlers ---

  // Executes the actual withdrawal process after stepper completion
  const proceedWithWithdrawal = async () => {
    // Reset stepper/approval states before starting
    setShowStepper(false);
    setCurrentStep(0);

    // *** Check if USDT approval was successful (or skipped if already approved) ***
    // Note: We might rely on the stepper reaching step 5 as confirmation,
    // or explicitly check isUsdtApproved if we implement an allowance check earlier.
    // For now, reaching step 5 implies approval was attempted/successful.
    // if (!isUsdtApproved) { // This check might be redundant if step 5 is reached
    //   setTxStatus('USDT approval was not granted or failed. Cannot proceed with withdrawal.');
    //   setStatusType('error');
    //   setIsWithdrawing(false); // Ensure this is reset
    //   setShowUsdtApprovalErrorPrompt(true); // Show approval error
    //   return; // Stop the withdrawal
    // }

    setIsWithdrawing(true); // Set withdrawing state for the main button and progress bar
    setTransactionStage(1); // Stage 1: Requesting backend validation
    setTxStatus('Validating withdrawal request...');
    setStatusType('pending');

    let pendingTransactionId = null;
    const numericAmount = Number(amount); // Ensure amount is numeric
    const targetAddress = useConnectedWallet ? connectedAddress : withdrawalAddress;

    try {
      // --- Step 1: Call Backend to Validate and Get Final Amount ---
      const initialApiResponse = await fetch('/api/investor/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          currency: 'USDT', // Assuming backend still expects USDT for now, adjust if needed
          targetAddress: targetAddress,
          reason: withdrawalReason || 'User withdrawal',
        }),
      });

      const initialResult = await initialApiResponse.json();

      if (!initialApiResponse.ok) {
        console.error('Backend validation failed:', initialResult?.message);
        setTxStatus(`Withdrawal request failed: ${initialResult.message || 'Unknown server error'}`);
        setStatusType('error');
        setTransactionStage(0);
        setIsWithdrawing(false);
        return;
      }
      console.log('Backend validation result:', initialResult);

      const { finalWithdrawalAmount, transaction } = initialResult;
      pendingTransactionId = transaction?._id;

      if (!pendingTransactionId) {
        throw new Error("Backend did not return a pending transaction ID.");
      }

      if (finalWithdrawalAmount <= 0) {
        setTxStatus(`Withdrawal amount after calculations is ${finalWithdrawalAmount.toFixed(2)} USDT. Cannot proceed.`);
        setStatusType('error');
        setTransactionStage(0);
        setIsWithdrawing(false);
        // Optionally call backend to cancel the pending transaction
        return;
      }

      console.log(`Backend approved withdrawal. Final amount: ${finalWithdrawalAmount} USDT. Pending Tx ID: ${pendingTransactionId}`);
      setTxStatus('Please confirm the transaction in your wallet...');
      setTransactionStage(2); // Stage 2: Waiting for blockchain confirmation

      // --- Step 2: Initiate Blockchain Transaction with Final Amount ---
      // NOTE: This still uses USDT_DECIMALS. If the 'withdraw' function expects DAI amount/decimals, this needs adjustment.
      // Assuming 'withdraw' still operates based on the USDT value calculated by the backend for now.
      const finalWithdrawAmountString = (finalWithdrawalAmount ?? 0).toString();
      const finalWithdrawAmountUnits = parseUnits(finalWithdrawAmountString, USDT_DECIMALS);

      const txHash = await executeWithdraw({
        address: CONTRACT_ADDRESS,
        abi: contractABI, // Use the minimal ABI defined above
        functionName: "withdraw",
        args: [finalWithdrawAmountUnits],
        chainId: chain?.id,
      });

      setTxStatus('Processing withdrawal on blockchain...');
      console.log('Withdrawal TX Hash:', txHash);

      // --- Step 2.5: Update Backend with TX Hash Immediately ---
      if (pendingTransactionId && txHash) {
        try {
          setTxStatus('Updating transaction hash...');
          const updateHashResponse = await fetch('/api/investor/wallet/withdraw/update-hash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pendingTransactionId: pendingTransactionId,
              txHash: txHash,
            }),
          });
          if (!updateHashResponse.ok) {
            const errorResult = await updateHashResponse.json().catch(() => ({}));
            console.error('API Error updating transaction hash:', errorResult.message || 'Unknown error');
            setTxStatus('Tx hash update failed, but withdrawal may proceed.'); // Non-critical error
          } else {
            console.log('Successfully updated transaction hash in backend.');
            setTxStatus('Transaction submitted! It\'s now processing on the blockchain, which typically takes a few minutes. You can check the final status on the Transactions page.');
          }
        } catch (hashUpdateError) {
          console.error('Fetch Error updating transaction hash:', hashUpdateError);
          setTxStatus('Failed to update transaction hash in backend.');
        }
      } else {
        console.warn('Could not update hash in backend: Missing pendingTransactionId or txHash.');
      }
      // --- End Update Hash ---



      // --- Step 3: Wait for Blockchain Confirmation ---
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash, chainId: chain?.id });
      console.log('Withdrawal Receipt:', receipt);

      // --- Step 4: Confirm with Backend ---
      if (receipt.status === 'success') {
        setTxStatus('Blockchain transaction successful! Confirming with server...');
        setTransactionStage(3); // Stage 3: Confirming with backend

        try {
          const confirmApiResponse = await fetch('/api/investor/wallet/withdraw/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pendingTransactionId: pendingTransactionId,
              txHash: receipt.transactionHash,
              networkId: chain?.id?.toString(),
            }),
          });

          const confirmResult = await confirmApiResponse.json();

          if (confirmApiResponse.ok) {
            setTxStatus(`Withdrawal of ${finalWithdrawalAmount.toFixed(2)} USDT recorded successfully!`);
            setStatusType('success');
            // Success modal will show via useEffect
          } else {
            console.error('API Error confirming withdrawal:', confirmResult.message);
            setTxStatus(`Blockchain withdrawal successful, but failed to update server record: ${confirmResult.message || 'Unknown error'}`);
            setStatusType('error');
          }
        } catch (apiConfirmError) {
          console.error('API Fetch Error (confirm):', apiConfirmError);
          setTxStatus('Blockchain withdrawal successful, but failed to contact server for confirmation.');
          setStatusType('error');
        }

      } else { // Blockchain transaction failed
        console.error('Blockchain Transaction Failed:', receipt);
        setTxStatus('Withdrawal failed on blockchain.');
        setStatusType('error');
        setTransactionStage(0); // Reset stage

        try {
          await fetch('/api/investor/wallet/withdraw/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pendingTransactionId }),
          });
          console.log("Cancellation request sent for failed blockchain tx:", pendingTransactionId);
        } catch (cancelError) {
          console.error("Error sending cancellation request:", cancelError);
        }
      }

    } catch (error) {
      console.error('Withdrawal Process Failed:', error);
      setTxStatus(`Withdrawal failed: ${error.shortMessage || error.message}`);
      setStatusType('error');
      setTransactionStage(0);
      if (pendingTransactionId) {
        try {
          await fetch('/api/investor/wallet/withdraw/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pendingTransactionId }),
          });
          console.log("Cancellation request sent due to error for pending transaction:", pendingTransactionId);
        } catch (cancelError) {
          console.error("Error sending cancellation request during error handling:", cancelError);
        }
      }
    } finally {
      setIsWithdrawing(false); // Ensure this is reset
      // Don't reset stage if successful, let the success modal handle it
      if (statusType !== 'success') {
        setTransactionStage(0); // Reset stage only on failure/error here
      }
    }
  };


  // Initiates the withdrawal process by showing the stepper
  const handleWithdrawInitiation = async (e) => {
    e.preventDefault();
    setTxStatus(''); // Clear previous status
    setStatusType('');
    setShowUsdtApprovalErrorPrompt(false); // Hide any previous prompts

    if (!isConnected) {
      setTxStatus('Please connect your wallet first.');
      setStatusType('error');
      return;
    }
    const numericAmount = Number(amount);
    if (!amount || numericAmount <= 0 || isNaN(numericAmount)) {
      setTxStatus('Please enter a valid amount greater than 0.');
      setStatusType('error');
      formRef.current?.classList.add('shake-animation');
      setTimeout(() => formRef.current?.classList.remove('shake-animation'), 500);
      return;
    }

    const numericPlatformBalance = parseFloat(formattedPlatformBalance);
    if (numericAmount > numericPlatformBalance) {
      setTxStatus(`Withdrawal amount exceeds your platform balance of ${numericPlatformBalance.toFixed(2)} USDT.`);
      setStatusType('error');
      formRef.current?.classList.add('shake-animation');
      setTimeout(() => formRef.current?.classList.remove('shake-animation'), 500);
      return;
    }

    const targetAddress = useConnectedWallet ? connectedAddress : withdrawalAddress;
    if (!targetAddress || !isAddress(targetAddress)) {
      setTxStatus('Please provide a valid Ethereum withdrawal address.');
      setStatusType('error');
      return;
    }

    // --- Start Stepper ---
    setShowStepper(true);
    setCurrentStep(1); // Start at step 1
    // Do NOT set isWithdrawing here, that's for the final process
  };

  // Function to handle USDT approval transaction
  const handleApproveUsdt = async () => {
    if (!isConnected || !connectedAddress || !chain?.id) {
      setTxStatus('Wallet not connected or chain ID missing.');
      setStatusType('error');
      setShowUsdtApprovalErrorPrompt(true);
      setCurrentStep(4); // Stay on approval step
      return;
    }
    if (!approveUsdtSpend) {
      setTxStatus('Approval function not ready.');
      setStatusType('error');
      setShowUsdtApprovalErrorPrompt(true);
      setCurrentStep(4);
      return;
    }

    // Get the correct token address for USDT
    const currentTokenAddress = USDT_ADDRESS; // Use the global USDT_ADDRESS
    if (!currentTokenAddress || !isAddress(currentTokenAddress) || !CONTRACT_ADDRESS || !isAddress(CONTRACT_ADDRESS)) {
      setTxStatus(`Invalid USDT token address or invalid Spender address.`);
      setStatusType('error');
      setShowUsdtApprovalErrorPrompt(true);
      setCurrentStep(4);
      return;
    }

    setIsApprovingUsdt(true);
    setTxStatus('Checking existing approval status...');
    setStatusType('pending');
    setShowUsdtApprovalErrorPrompt(false);
    setIsUsdtApproved(false); // Reset approval status

    const withdrawAmount = amount ? parseUnits(amount, USDT_DECIMALS) : BigInt(0); // Use USDT_DECIMALS

    try {
      // Check allowance using wagmi's readContract action
      const allowance = await readContract(wagmiConfig, {
        address: currentTokenAddress,
        abi: usdtABI, // Use usdtABI
        functionName: 'allowance',
        args: [connectedAddress, CONTRACT_ADDRESS],
      });

      console.log(`Current USDT allowance for ${CONTRACT_ADDRESS}: ${allowance?.toString() || '0'}`);

      // Case 1: Allowance is already sufficient
      if (allowance && allowance >= withdrawAmount && withdrawAmount > BigInt(0)) {
        console.log(`Contract already has sufficient USDT allowance: ${allowance.toString()}. Skipping approval step.`);
        setTxStatus('Contract already approved for USDT. Proceeding with withdrawal...');
        setIsUsdtApproved(true);
        setStatusType('success');
        setCurrentStep(5); // Move to final confirmation step
        setIsApprovingUsdt(false);
        return;
      }
      if (allowance === BigInt(0) && withdrawAmount > BigInt(0)) {
        setTxStatus('Initiating zero approval for USDT, confirm in your wallet...');
        console.log('Performing zero approval before setting actual allowance.');

        const zeroAmount = BigInt(0); // Set allowance to zero first

        const zeroApprovalTxHash = await approveUsdtSpend({
          address: currentTokenAddress,
          abi: usdtABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, zeroAmount],
          chainId: chain.id,
        });

        setTxStatus('Waiting for zero approval transaction to confirm...');
        console.log('Zero Approval TX Hash:', zeroApprovalTxHash);

        await waitForTransactionReceipt(wagmiConfig, {
          hash: zeroApprovalTxHash,
          chainId: chain?.id
        });

        console.log('Zero approval confirmed.');
        setTxStatus('Zero approval successful. Proceeding with full approval...');
      }

      // Case 3: Proceed with the main approval (either allowance was non-zero but insufficient, or zero-to-non-zero just completed)
      setTxStatus('Preparing USDT token approval...');
      const approvalAmount = USDT_APPROVAL_AMOUNT;

      const approveArgs = {
        address: currentTokenAddress,
        abi: usdtABI, // Use usdtABI
        functionName: 'approve',
        args: [
          CONTRACT_ADDRESS, // spender
          approvalAmount    // value (amount)
        ],
        chainId: chain.id,
      };

      // 2. Call Approve Function
      setTxStatus('Please approve the USDT transaction in your wallet. If your wallet does not open automatically, kindly open it manually to complete the approval.');
      console.log("Attempting USDT Approve with args:", approveArgs);
      const txHash = await approveUsdtSpend(approveArgs);

      setTxStatus('Processing USDT approval transaction on blockchain...');
      setApprovalTxHash(txHash); // Store hash locally if needed
      console.log('USDT Approval TX Hash:', txHash);

      // Optional: Record Pending Approval in DB
      setTxStatus('USDT Approval transaction sent. Recording pending approval...');
      try {
        const apiResponse = await fetch('/api/investor/wallet/token-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerAddress: connectedAddress,
            spenderAddress: CONTRACT_ADDRESS,
            tokenAddress: currentTokenAddress, // This is USDT_ADDRESS
            approvedAmount: USDT_APPROVAL_AMOUNT.toString(),
            approvedAmountHumanReadable: formatUnits(USDT_APPROVAL_AMOUNT, 6) + " USDT",
            transactionHash: txHash,
            tokenSymbol: "USDT" // Added for clarity in backend
          }),
        });

        const result = await apiResponse.json();
        if (apiResponse.ok) {
          console.log('Pending USDT approval recorded successfully:', result);
          setTxStatus('USDT Approval transaction sent. Waiting for confirmation...');
        } else {
          console.error('Error recording pending USDT approval:', result.message);
          setTxStatus(`USDT Approval sent, but failed to record pending status: ${result.message}. Verification might be delayed.`);
        }
      } catch (apiError) {
        console.error('API Fetch Error recording pending USDT approval:', apiError);
        setTxStatus(`USDT Approval sent, but failed to contact server to record status: ${apiError.message}. Verification might be delayed.`);
      }

      setTxStatus('USDT Approval submitted. Proceed to final confirmation.');
      setStatusType('success');
      setIsUsdtApproved(true);
      setCurrentStep(5);
    } catch (error) {
      console.error('USDT Approval Failed:', error);
      if (error.shortMessage?.includes('User rejected the request')) {
        setTxStatus('USDT Approval transaction rejected. Please approve to continue.');
      } else {
        setTxStatus(`USDT Approval failed: ${error.shortMessage || error.message}`);
      }
      setStatusType('error');
      setShowUsdtApprovalErrorPrompt(true);
      setCurrentStep(4); // Stay on approval step
    } finally {
      setIsApprovingUsdt(false);
    }
  };

  // Handle advancing through stepper steps
  const handleNextStep = () => {
    setTxStatus(''); // Clear status message on step change
    setStatusType('');
    setShowUsdtApprovalErrorPrompt(false);

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 4) {
      // Step 4 now triggers the USDT approval
      handleApproveUsdt(); // Call the new approval handler
    } else if (currentStep === 5) {
      // Final step confirmation - trigger the actual withdrawal
      // No need to check isUsdtApproved here, reaching step 5 implies it was handled
      proceedWithWithdrawal();
    }
  };

  // Handle closing the stepper/cancelling
  const handleCancelStepper = () => {
    setShowStepper(false);
    setCurrentStep(0);
    setTxStatus(''); // Clear any stepper-related messages
    setStatusType('');
    setIsApprovingUsdt(false);
    setShowUsdtApprovalErrorPrompt(false);
    setIsUsdtApproved(false); // Reset approval status on cancel
  };

  const handleMaxAmount = () => {
    const balance = parseFloat(formattedPlatformBalance);
    if (balance > 0) {
      setAmount(balance?.toString());
    }
  };

  const truncateAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setAmount('');
    setTxStatus('');
    setStatusType('');
    setTransactionStage(0);
    setWithdrawalReason('');
    setUseConnectedWallet(true);
    // Reset other relevant states if needed
  };

  const reasonOptions = [
    { id: 'investment', label: 'External Investment' },
    { id: 'personal', label: 'Personal Use' },
    { id: 'transfer', label: 'Transfer to Another Wallet' },
    { id: 'other', label: 'Other' }
  ];

  const getAmountOptions = () => {
    const balance = parseFloat(formattedPlatformBalance);
    if (balance <= 0) return [];
    const options = [0.25, 0.5, 0.75, 1].map(p => Math.floor(balance * p * 100) / 100).filter((v, i, a) => v > 0 && a.indexOf(v) === i);
    return options;
  };
  const amountOptions = getAmountOptions();

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-white overflow-hidden">
      {/* Background & Modals... */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="confetti" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)` }}></div>
            ))}
          </div>
        </div>
      )}
      <AnimatePresence>{showSuccessModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gradient-to-b from-gray-800 to-gray-900 max-w-md w-full rounded-2xl p-8 shadow-2xl border border-gray-700/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400"></div>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Successful!</h2>
              <p className="text-gray-300 mb-4">Your withdrawal of {amount} USDT has been processed successfully.</p>
              <p className="text-sm text-gray-400 mb-6">The funds will be sent to {useConnectedWallet ? 'your connected wallet' : 'the specified address'} shortly.</p>
              <button onClick={handleCloseSuccessModal} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium rounded-lg shadow-lg transition-all duration-300">Continue</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Approval Error Prompt */}
      <AnimatePresence>
        {showUsdtApprovalErrorPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-5 right-5 z-50"
          >
            <div className="bg-gradient-to-br from-red-500 to-red-700 text-white p-4 rounded-lg shadow-xl max-w-sm border border-red-400/50">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <div>
                  <h4 className="font-semibold mb-1">USDT Approval Required</h4>
                  <p className="text-sm text-red-100">
                    {txStatus || 'You must approve USDT spending for our contract to proceed with the withdrawal. Please try the approval step again.'}
                  </p>
                  <button
                    onClick={() => setShowUsdtApprovalErrorPrompt(false)}
                    className="mt-3 text-xs font-medium text-white underline hover:text-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal Stepper Modal */}
      <AnimatePresence>
        {showStepper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={handleCancelStepper} // Close on backdrop click
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-gray-800 to-gray-900 max-w-md w-full rounded-2xl p-8 shadow-2xl border border-gray-700/50 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <button onClick={handleCancelStepper} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <h2 className="text-2xl font-bold text-white mb-6 text-center">Withdrawal Steps</h2>

              {/* Stepper Visual */}
              <div className="flex items-center justify-center space-x-2 mb-8">
                {[1, 2, 3, 4, 5].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= step ? 'border-purple-500 bg-purple-500/30' : 'border-gray-600'}`}>
                      <span className={`${currentStep >= step ? 'text-purple-300' : 'text-gray-500'}`}>{step}</span>
                    </div>
                    {step < 5 && <div className={`h-0.5 flex-1 ${currentStep > step ? 'bg-purple-500' : 'bg-gray-600'}`}></div>}
                  </React.Fragment>
                ))}
              </div>

              {/* Step Content */}
              <div className="text-center mb-8 min-h-[60px]">
                {currentStep === 1 && <p className="text-gray-300">Step 1: Confirm withdrawal details.</p>}
                {currentStep === 2 && <p className="text-gray-300">Step 2: Review network fees and final amount (simulation).</p>}
                {currentStep === 3 && <p className="text-gray-300">Step 3: Prepare for transaction.</p>}
                {currentStep === 4 && <p className="text-gray-300">Step 4: Approve USDT spending in your wallet.</p>}
                {currentStep === 5 && <p className="text-gray-300">Step 5: Final confirmation to execute withdrawal.</p>}
                {/* Display Approval Status/Error within Stepper */}
                {isApprovingUsdt && (
                  <div className="flex items-center justify-center gap-2 text-yellow-400 mt-4">
                    <Loader2 className="animate-spin h-4 w-4" /> Processing USDT Approval...
                  </div>
                )}
                {txStatus && (currentStep === 4 || currentStep === 5) && ( // Show relevant status only on approval/final steps
                  <p className={`mt-4 text-sm ${statusType === 'error' ? 'text-red-400' : statusType === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>{txStatus}</p>
                )}
              </div>

              {/* Action Button */}
              <motion.button
                onClick={handleNextStep}
                className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isApprovingUsdt
                  ? 'bg-gray-700/70 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-purple-500/20' // Adjusted colors slightly
                  }`}
                disabled={isApprovingUsdt}
                whileHover={!isApprovingUsdt ? { scale: 1.02 } : {}}
                whileTap={!isApprovingUsdt ? { scale: 0.98 } : {}}
              >
                {isApprovingUsdt ? (
                  <> <Loader2 className="animate-spin h-5 w-5" /> Processing Approval... </>
                ) : currentStep < 4 ? (
                  `Next Step ${currentStep + 1}`
                ) : currentStep === 4 ? ( // Step 4 button text
                  "Approve USDT Spending"
                ) : ( // Step 5 button text
                  "Confirm Withdrawal"
                )}
              </motion.button>

              <button
                onClick={handleCancelStepper}
                className="w-full mt-3 py-2 text-center text-gray-400 hover:text-gray-200 text-sm"
              >
                Cancel Withdrawal
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="container max-w-full w-full md:max-w-6xl mx-auto px-4 py-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-normal bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Withdraw Funds
              </h1>
              <p className="text-gray-400 mt-2">Securely withdraw USDT from your investment account</p>
            </div>
          </div>

          {/* Main Card - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="backdrop-blur-md bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/30 shadow-2xl overflow-hidden w-full max-w-full"
          >
            <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-purple-400 to-indigo-400"></div>
            <div className="p-3 sm:p-4 md:p-8 w-full max-w-full">
              {!isConnected ? (
                // Connect Wallet Prompt
                <div className="py-6 sm:py-10 text-center">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
                    className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/30 text-purple-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-500 mb-3 sm:mb-4 px-2">
                    Wallet Connection Required
                  </h2>
                  <p className="text-gray-400 mb-6 sm:mb-8 max-w-sm mx-auto px-4 text-sm sm:text-base">
                    Connect your wallet to securely withdraw USDT.
                  </p>
                  {USE_CONNECTKIT ? (
                    <div className="flex justify-center px-4">
                      <ConnectKitButton theme='nouns' />
                    </div>
                  ) : (
                    <div className="px-4">
                      <button
                        onClick={openConnectModal}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Connected State
                <>
                  {/* Connected Wallet Info & Disconnect Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-gray-700/30 gap-4 sm:gap-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-purple-500/20 to-purple-600/30 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs sm:text-sm text-gray-400">Connected Wallet</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
                          <span className="font-medium text-gray-200 text-sm sm:text-base truncate">
                            {truncateAddress(connectedAddress)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <span className="block text-xs sm:text-sm text-gray-400 mb-1">Network</span>
                        <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-full text-xs sm:text-sm font-medium text-purple-300 whitespace-nowrap">
                          {chain?.name || 'Unknown Network'}
                        </span>
                      </div>
                      <button
                        onClick={() => disconnect()}
                        className="px-2 sm:px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-300 transition-colors duration-200 whitespace-nowrap flex-shrink-0"
                        title="Disconnect Wallet"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {/* Balance Display Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {/* Platform Balance Card */}
                    <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-gray-800/60 to-gray-700/40 border border-gray-600/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1.5">
                          <BarChart2 size={12} className="sm:w-3.5 sm:h-3.5" />
                          <span className="truncate">Platform Balance</span>
                        </span>
                        <button
                          onClick={handleMaxAmount}
                          className="px-2 py-0.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded text-purple-300 transition-colors duration-200 flex-shrink-0"
                          title="Use full platform balance"
                          disabled={showStepper || isWithdrawing}
                        >
                          MAX
                        </button>
                      </div>
                      {/* Platform Balance Value */}
                      <div className="h-6 flex items-center">
                        {sessionStatus === 'loading' ? (
                          <Loader2 size={14} className="animate-spin text-purple-400" />
                        ) : sessionStatus === 'unauthenticated' || !session?.user ? (
                          <span className="text-xs text-yellow-400">Login required</span>
                        ) : !isValidDbAddress ? (
                          <span className="text-xs text-yellow-400">Wallet Not Set</span>
                        ) : platformBalanceLoading ? (
                          <Loader2 size={14} className="animate-spin text-purple-400" />
                        ) : platformBalanceError ? (
                          <span className="text-xs text-red-400 truncate" title={platformBalanceError?.shortMessage || platformBalanceError?.message}>
                            Error loading balance
                          </span>
                        ) : (
                          <span className="text-lg sm:text-xl font-semibold text-white">
                            {parseFloat(formattedPlatformBalance).toFixed(2)}
                            <span className="text-xs text-gray-400 ml-1">USDT</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total Balance Card */}
                    <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-gray-800/60 to-gray-700/40 border border-gray-600/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1.5">
                          <TrendingUpIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                          <span className="truncate">Total Balance</span>
                        </span>
                      </div>
                      <span className="text-lg sm:text-xl font-semibold text-white">
                        {totalBalance.toFixed(2)}
                        <span className="text-xs text-gray-400 ml-1">USDT</span>
                      </span>
                      <p className="text-xs text-gray-500 mt-1">(Platform + Profits)</p>
                    </div>
                  </div>
                  {/* End Balance Display Section */}

                  {/* Withdrawal Form */}
                  <form ref={formRef} onSubmit={handleWithdrawInitiation} className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="withdrawAmount" className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                        Amount (USDT)
                      </label>
                      <div className="relative">
                        <input
                          id="withdrawAmount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full p-3 sm:p-4 pl-10 sm:pl-12 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-white placeholder-gray-500 text-base sm:text-lg transition-all duration-200"
                          min="0"
                          step="any"
                          required
                          disabled={isWithdrawing || showStepper}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-sm sm:text-base">$</span>
                        </div>
                        <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-xs sm:text-sm">USDT</span>
                        </div>
                      </div>
                      {amountOptions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="text-xs sm:text-sm text-gray-400 w-full sm:w-auto mb-1 sm:mb-0">Quick select:</span>
                          <div className="flex flex-wrap gap-2">
                            {amountOptions.map((option) => (
                              <button
                                key={option}
                                type="button"
                                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-full text-purple-300 transition-colors duration-200 whitespace-nowrap"
                                onClick={() => setAmount(option?.toString())}
                                disabled={isWithdrawing || showStepper}
                              >
                                ${option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reason Field */}
                    <div>
                      <label htmlFor="withdrawalReason" className="block text-gray-300 mb-2 font-medium text-sm sm:text-base">
                        Reason for Withdrawal (Optional)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        {reasonOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-all duration-200 text-center ${withdrawalReason === option.label
                              ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                              : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
                              }`}
                            onClick={() => setWithdrawalReason(option.label)}
                            disabled={isWithdrawing || showStepper}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={withdrawalReason}
                        onChange={(e) => setWithdrawalReason(e.target.value)}
                        placeholder="Enter a reason for your withdrawal"
                        className="w-full p-3 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-white placeholder-gray-500 transition-all duration-200 text-sm sm:text-base"
                        disabled={isWithdrawing || showStepper}
                      />
                    </div>

                    {/* Address Field */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <label htmlFor="withdrawalAddress" className="block text-gray-300 font-medium text-sm sm:text-base">
                          Withdrawal Address
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="useConnectedWallet"
                            checked={useConnectedWallet}
                            onChange={(e) => setUseConnectedWallet(e.target.checked)}
                            className="rounded border-gray-600 text-purple-500 focus:ring-purple-500/50 mr-2"
                            disabled={isWithdrawing || showStepper}
                          />
                          <label htmlFor="useConnectedWallet" className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
                            Use connected wallet
                          </label>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={withdrawalAddress}
                        onChange={(e) => setWithdrawalAddress(e.target.value)}
                        placeholder="0x..."
                        className={`w-full p-3 bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-white placeholder-gray-500 transition-all duration-200 text-sm sm:text-base ${useConnectedWallet ? 'opacity-50' : ''
                          }`}
                        disabled={useConnectedWallet || isWithdrawing || showStepper}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Please double-check this address. Funds sent to incorrect addresses cannot be recovered.
                      </p>
                    </div>

                    {/* Transaction Progress (for final withdrawal) */}
                    {transactionStage > 0 && (
                      <div className="mt-4 sm:mt-6 mb-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span className={transactionStage >= 1 ? 'text-purple-400' : ''}>Validation</span>
                          <span className={transactionStage >= 2 ? 'text-purple-400' : ''}>Blockchain</span>
                          <span className={transactionStage >= 3 ? 'text-green-400' : ''}>Confirmation</span>
                        </div>
                        <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${statusType === 'success'
                              ? 'bg-gradient-to-r from-purple-500 via-purple-400 to-green-400'
                              : 'bg-purple-500'
                              } transition-all duration-500 ease-out`}
                            style={{ width: `${(transactionStage / 3) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Transaction Status Message */}
                    {txStatus && !showSuccessModal && !showStepper && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg ${statusType === 'success' ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20' :
                          statusType === 'error' ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20' :
                            'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {statusType === 'success' ? (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          ) : statusType === 'error' ? (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 animate-spin mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          <p className={`font-medium text-sm sm:text-base ${statusType === 'success' ? 'text-green-400' : statusType === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {txStatus}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Main Action Button */}
                    <div className="pt-2">
                      <motion.button
                        type="submit"
                        className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 ${isWithdrawing || showStepper || !isConnected || Number(formattedPlatformBalance) <= 0
                          ? 'bg-gray-700/70 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg hover:shadow-purple-500/20'
                          }`}
                        whileHover={!isWithdrawing && !showStepper && isConnected && sessionStatus !== 'loading' && Number(formattedPlatformBalance) > 0 ? { scale: 1.02 } : {}}
                        whileTap={!isWithdrawing && !showStepper && isConnected && sessionStatus !== 'loading' && Number(formattedPlatformBalance) > 0 ? { scale: 0.98 } : {}}
                      >
                        {isWithdrawing ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-sm sm:text-base">
                              {transactionStage === 1 ? "Validating..." : transactionStage === 2 ? "Processing..." : "Confirming..."}
                            </span>
                          </div>
                        ) : !isConnected ? (
                          "Connect Wallet to Withdraw"
                        ) : sessionStatus === 'loading' ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-sm sm:text-base">Loading Session...</span>
                          </div>
                        ) : (
                          "Initiate Withdrawal"
                        )}
                      </motion.button>
                    </div>

                    {/* Help section */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700/30">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Need help with your withdrawal?</h4>
                          <p className="text-xs text-gray-400 mb-2">
                            For withdrawal issues or questions, our support team is available 24/7 to assist you.
                          </p>
                          <a href="/support" className="inline-flex items-center text-sm text-purple-300 hover:text-purple-200 transition-colors duration-200">
                            Contact Support
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>

          {/* Helpful Info Card Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 max-w-2xl mx-auto space-y-5"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-100 mb-10 text-center relative pb-3">
              Helpful Information
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-400 to-blue-500 rounded-full"></span>
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
                  description="Input the amount of USDT you wish to withdraw. You can use the quick select options for common amounts."
                  icon={DollarSign}
                />
                <StepItem
                  step="Step 3"
                  title="Approve Transaction"
                  description="Your wallet will prompt you to approve the contract to spend your USDT. This is a one-time approval for the contract to manage your funds for withdrawals."
                  icon={Shield}
                />
                <StepItem
                  step="Step 4"
                  title="Confirm Withdrawal"
                  description="After approval, your wallet will ask you to confirm the actual withdrawal transaction. Review the details carefully."
                  icon={CheckCircle}
                />
                <StepItem
                  step="Step 5"
                  title="Monitor Status"
                  description="Track the transaction progress on the page. Once confirmed on the blockchain, your funds will be sent to your specified address."
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
                  question="Why do I need to approve the transaction?"
                  answer="For security reasons, decentralized applications (dApps) cannot directly move tokens from your wallet. You must grant the contract permission (approval) to spend a specific amount of your tokens on your behalf. This is a standard procedure for ERC-20 tokens."
                  icon={Shield}
                />
                <FAQItem
                  question="How long does a withdrawal take?"
                  answer="Transaction times vary depending on network congestion and the blockchain network itself. It can range from a few seconds to several minutes. Our system typically processes withdrawals within 1-2 hours, but it may take up to 24 hours during peak times."
                  icon={Clock}
                />
                <FAQItem
                  question="Can I withdraw other cryptocurrencies?"
                  answer="Currently, only USDT withdrawals are supported."
                  icon={CreditCard}
                />
                <FAQItem
                  question="What happens if my transaction fails?"
                  answer="If a transaction fails, the funds usually remain in your wallet, minus any gas fees incurred. Check the Transaction Status message for specific error details. You can then retry the withdrawal."
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
                    "Verify your USDT balance on the platform and in your wallet.",
                    "Ensure you have enough of the network's native token (e.g., ETH on Ethereum, MATIC on Polygon) for gas fees, in addition to the USDT you want to withdraw."
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
                <TroubleshootingItem
                  title="Approval Transaction Fails"
                  icon={Shield}
                  solutions={[
                    "Ensure your wallet has enough gas to cover the approval transaction.",
                    "Clear your browser's cache and cookies, then retry."
                  ]}
                />
                <TroubleshootingItem
                  title="Incorrect Withdrawal Address"
                  icon={AlertTriangle}
                  solutions={[
                    "Always double-check the destination address. Funds sent to incorrect addresses cannot be recovered.",
                    "Ensure the address is for the correct network (e.g., Ethereum mainnet for ERC-20 USDT)."
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
                  definition="A self-executing contract with the terms of the agreement directly written into lines of code. Our withdrawal functionality is powered by a smart contract."
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
                <DefinitionItem
                  term="Allowance"
                  definition="The permission you grant to a smart contract to spend a certain amount of a specific ERC-20 token from your wallet."
                  icon={Key}
                />
              </div>
            </InfoCard>
          </motion.div>
        </motion.div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        @keyframes fall { 0% { transform: translateY(-100vh) rotate(0deg); } 100% { transform: translateY(100vh) rotate(360deg); } }
        .confetti { position: absolute; width: 10px; height: 10px; animation: fall 5s linear infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 50% { transform: translateX(8px); } 75% { transform: translateX(-8px); } }
        .shake-animation { animation: shake 0.5s ease-in-out; }
        .animate-blob { animation: blob 7s infinite; }
        @keyframes blob { 0% { transform: scale(1); } 33% { transform: scale(1.1); } 66% { transform: scale(0.9); } 100% { transform: scale(1); } }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
