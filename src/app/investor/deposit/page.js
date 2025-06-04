'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useBalance, useDisconnect, useSignTypedData, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { wagmiConfig } from '../../providers';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { ConnectKitButton } from 'connectkit';
import { motion, AnimatePresence } from 'framer-motion';
import { parseUnits, formatUnits, maxUint256, erc20Abi, } from 'viem';
import {
  PERMIT2_ADDRESS,
  AllowanceProvider,
  AllowanceTransfer,
  MaxAllowanceTransferAmount,
} from '@uniswap/permit2-sdk';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
  DollarSign,
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
const USDT_ADDRESS_SEPOLIA = process.env.NEXT_PUBLIC_USDT_ADDRESS

export default function InvestorDepositPage() {
  const { address, isConnected, chain } = useAccount();
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [statusType, setStatusType] = useState(''); // 'success', 'error', 'pending'
  const [transactionStage, setTransactionStage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const formRef = useRef(null);

  const { openConnectModal: openRainbowKitConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [permitSignature, setPermitSignature] = useState(null);
  const [walletApproved, setApprovedWallet] = useState(false);
  const [expandedInfoCard, setExpandedInfoCard] = useState(null); // State for expanded info card

  const USDT_ADDRESS = chain?.id === 1 ? USDT_ADDRESS_MAINNET : USDT_ADDRESS_SEPOLIA;

  const { writeContractAsync: depositUsdt } = useWriteContract();
  const { data: hash, writeContractAsync, isPending: isWritePending, error: writeError } = useWriteContract();
  const { data: signTypedDataAsync, isPending: isSignPending, error: signError } = useSignTypedData();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash });

  const { data: usdtBalance } = useBalance({
    address,
    token: USDT_ADDRESS,
    watch: true,
    enabled: isConnected
  });

  useEffect(() => {
    if (statusType === 'success') {
      setShowConfetti(true);
      setShowSuccessModal(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [statusType]);

  useEffect(() => {
    if (transactionStage > 0 && transactionStage < 3) {
      const timer = setTimeout(() => {
        if (transactionStage < 3 && isDepositing) {
          setTransactionStage(prev => prev + 1);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transactionStage, isDepositing]);

  const handleApprove = async () => {
    if (!address) return;

    setTxStatus(`Checking existing approval status...`);

    try {
      const allowance = await readContract(wagmiConfig, {
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, CONTRACT_ADDRESS],
      });

      console.log(`Current allowance for ${CONTRACT_ADDRESS}: ${allowance?.toString() || '0'}`);

      const depositAmount = amount ? BigInt(Number(amount) * 10 ** 6) : BigInt(0);
      if (allowance && allowance >= depositAmount && depositAmount > 0) {
        console.log(`Contract already has sufficient allowance: ${allowance.toString()}. Skipping approval step.`);
        setTxStatus('Contract already approved. Proceeding with deposit...');
        setApprovedWallet(true);
        return true;
      }
    } catch (error) {
      console.error('Error checking allowance:', error);
    }

    setTxStatus(`Requesting wallet approval for ${amount} USDT...`);
    setPermitSignature(null);
    setStatusType('pending');

    try {
      const approvalTxHash = await writeContractAsync({
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, maxUint256],
      });

      setTxStatus('Deposit Approval transaction sent. Recording pending approval...');
      console.log(`Deposit Approval transaction initiated with hash: ${approvalTxHash}`);

      try {
        const apiResponse = await fetch('/api/investor/wallet/token-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerAddress: address,
            spenderAddress: CONTRACT_ADDRESS,
            tokenAddress: USDT_ADDRESS,
            approvedAmount: maxUint256.toString(),
            approvedAmountHumanReadable: "Unlimited",
            transactionHash: approvalTxHash,
          }),
        });

        const result = await apiResponse.json();
        if (apiResponse.ok) {
          console.log('Pending approval recorded successfully:', result);
          setTxStatus('Deposit Approval transaction sent. Waiting for confirmation...');
          setApprovedWallet(true);
          return true;
        } else {
          console.error('Error recording pending approval:', result.message);
          setTxStatus(`Approval sent, but failed to record pending status: ${result.message}. Please proceed with caution or retry.`);
          setStatusType('error');
          return false;
        }
      } catch (apiError) {
        console.error('API Fetch Error recording pending approval:', apiError);
        setTxStatus(`Approval sent, but failed to contact server to record status: ${apiError.message}. Please proceed with caution or retry.`);
        setStatusType('error');
        return false;
      }

    } catch (err) {
      console.error('Approval transaction failed:', err);
      setTxStatus(`Wallet approval failed: ${err.shortMessage || err.message}`);
      setStatusType('error');
      return false;
    }
  };

  const handleDeposit = async (e) => {
    setTxStatus('');
    setStatusType('');
    e.preventDefault();

    setTxStatus('Requesting wallet approval...');
    const approvalInitiated = await handleApprove();

    if (!approvalInitiated) {
      setIsDepositing(false);
      setTransactionStage(0);
      return;
    }

    console.log("Approval initiated, proceeding to deposit step...");
    setTxStatus('Approval sent. Preparing deposit...');


    if (!isConnected) {
      setTxStatus('Please connect your wallet first.');
      setStatusType('error');
      return;
    }

    if (!amount || Number(amount) <= 0 || isNaN(Number(amount))) {
      setTxStatus('Please enter a valid amount greater than 0.');
      setStatusType('error');
      if (formRef.current) {
        formRef.current.classList.add('shake-animation');
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.classList.remove('shake-animation');
          }
        }, 500);
      }
      return;
    }

    setIsDepositing(true);
    setTransactionStage(1);
    setTxStatus('Preparing deposit...');
    setStatusType('pending');

    try {
      const depositAmount = BigInt(Number(amount) * 10 ** 6);

      setTxStatus('Please confirm the transaction in your wallet...');
      const tx = await depositUsdt({
        address: CONTRACT_ADDRESS,
        abi: [
          {
            inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
            name: 'deposit',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'deposit',
        args: [depositAmount],
        chainId: chain?.id,
      });

      setTransactionStage(2);
      console.log('Deposit TX Hash:', tx);
      setTxStatus('Transaction sent! Waiting for confirmation...');

      const apiResponse = await fetch('/api/investor/wallet/deposit/submit-pending-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'USDT',
          txHash: tx,
          networkId: chain?.id,
          depositorAddress: address,
        }),
      });

      const result = await apiResponse.json();
      if (apiResponse.ok) {
        console.log('Pending deposit recorded successfully:', result);
      } else {
        console.error('Error recording pending deposit:', result.message);
      }

      setTxStatus('Transaction submitted! It\'s now processing on the blockchain, which typically takes a few minutes. You can check the final status on the Transactions page.');

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
        chainId: chain?.id,
      });

      console.log('Deposit Receipt:', receipt);

      if (receipt.status === 'success') {
        setTransactionStage(3);
        setTxStatus(`Deposit of ${amount} USDT confirmed on blockchain! Verification pending.`);
        setStatusType('success');

        if (receipt.transactionHash.toLowerCase() !== tx.toLowerCase()) {
          console.warn(`Transaction hash changed upon confirmation (likely replaced/sped up). Initial: ${tx}, Confirmed: ${receipt.transactionHash}. Updating DB.`);
          setTxStatus(`Deposit of ${amount} USDT confirmed (tx replaced). Verification pending.`);
          try {
            await fetch('/api/investor/wallet/deposit/update-txhash', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalTxHash: tx,
                confirmedTxHash: receipt.transactionHash,
                networkId: chain?.id,
              }),
            });
            console.log(`Sent update request for replaced tx hash ${receipt.transactionHash}`);
          } catch (updateError) {
            console.error("Error sending tx hash update:", updateError);
          }
        } else {
          setTxStatus(`Deposit of ${amount} USDT confirmed on blockchain! Verification pending.`);
          console.log(`Blockchain transaction ${receipt.transactionHash} successful. Backend will verify and update status.`);
        }

      } else {
        console.error('Blockchain Transaction Failed:', receipt);
        setTxStatus('Deposit failed on blockchain. Check transaction details.');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Deposit Failed:', error);
      if (error.message?.includes('User rejected the request')) {
        setTxStatus('Deposit transaction rejected.');
      } else if (error.message?.includes('insufficient funds')) {
        setTxStatus('Deposit failed: Insufficient funds for transaction.');
      } else {
        setTxStatus(`Deposit failed: ${error.shortMessage || error.message}`);
      }
      setStatusType('error');
      setTransactionStage(0);
    } finally {
      setIsDepositing(false);
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setAmount('');
    setTxStatus('');
    setStatusType('');
    setTransactionStage(0);
  };

  const amountOptions = [100, 500, 1000, 5000];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-white">
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] bg-repeat opacity-5"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full filter opacity-10 "></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600 rounded-full filter opacity-10 animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-600 rounded-full filter opacity-10 animation-delay-4000"></div>
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

                  {usdtBalance && (
                    <div className="mb-6 p-2 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/30 border border-gray-600/30">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-gray-300">Available Balance</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-medium text-gray-200">
                            {parseFloat(usdtBalance?.formatted || '0').toFixed(2)} USDT
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <form ref={formRef} onSubmit={handleDeposit} className="space-y-6">
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
                          <span className={transactionStage >= 1 ? 'text-blue-400' : ''}>Confirmation</span>
                          <span className={transactionStage >= 2 ? 'text-blue-400' : ''}>Processing</span>
                          <span className={transactionStage >= 3 ? 'text-green-400' : ''}>Complete</span>
                        </div>
                        <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${transactionStage === 3
                              ? 'bg-gradient-to-r from-blue-500 via-blue-400 to-green-400'
                              : 'bg-blue-500'
                              } transition-all duration-500 ease-out`}
                            style={{ width: `${(transactionStage / 3) * 100}%` }}
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
                            {transactionStage === 1 && "Confirming..."}
                            {transactionStage === 2 && "Processing..."}
                            {transactionStage === 3 && "Finalizing..."}
                          </span>
                        ) : (
                          'Deposit USDT'
                        )}
                      </motion.button>
                    </div>
                  </form>

                  {txStatus && !showSuccessModal && (
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
                          {txStatus}
                        </p>
                      </div>
                    </motion.div>
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
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 rounded-full"></span>
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
                  title="Approve Transaction"
                  description="Your wallet will prompt you to approve the contract to spend your USDT. This is a one-time approval for the contract to manage your funds for deposits."
                  icon={Shield}
                />
                <StepItem
                  step="Step 4"
                  title="Confirm Deposit"
                  description="After approval, your wallet will ask you to confirm the actual deposit transaction. Review the details carefully."
                  icon={CheckCircle}
                />
                <StepItem
                  step="Step 5"
                  title="Monitor Status"
                  description="Track the transaction progress on the page. Once confirmed on the blockchain, your funds will be reflected in your account."
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
                  question="How long does a deposit take?"
                  answer="Transaction times vary depending on network congestion and the blockchain network itself. It can range from a few seconds to several minutes."
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
                <TroubleshootingItem
                  title="Approval Transaction Fails"
                  icon={Shield}
                  solutions={[
                    "Ensure your wallet has enough gas to cover the approval transaction.",
                    "Clear your browser's cache and cookies, then retry."
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
    </div>
  );
}
