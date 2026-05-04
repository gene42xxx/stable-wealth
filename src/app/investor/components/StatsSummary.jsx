'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, BarChart2, Power } from 'lucide-react'; // Removed unused icons
import { formatUSDTBalance } from '@/lib/utils/formatUsdtBalance';
import { useAccount, useReadContract } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import USDTVAULT from '@/contractABI/investment.json';
import { useSession } from 'next-auth/react';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export default function StatsSummary({ dashboardData }) {
  const { data: session } = useSession();
  const { address: wagmiAddress, isConnected, chain: connectedChain } = useAccount();
  
  // Prioritize wagmiAddress (connected wallet) over session address
  const address = wagmiAddress || session?.user?.walletAddress;

  // Explicitly set target chain for reads when disconnected
  const targetChainId = IS_PRODUCTION ? mainnet.id : sepolia.id;

  // Extract necessary data safely using optional chaining and default values
  const realTimeProfit = dashboardData?.fakeProfits ?? 0;
  const weeklyRequirement = dashboardData?.weeklyRequirement ?? 0;
  const botIsActive = dashboardData?.botStatus === 'active';

  const { data: fetchedPlatformBalance, isLoading: isPlatformBalanceLoading, isError: isPlatformBalanceError, error: platformBalanceError, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: USDTVAULT.abi,
    functionName: 'getBalanceOf',
    args: address ? [address] : undefined,
    chainId: targetChainId,
    query: {
      enabled: !!address,
    },
  });

  // Also fetch the total contract balance and unprocessed deposits to help debug
  const { data: totalContractBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: USDTVAULT.abi,
    functionName: 'getContractBalance',
    chainId: targetChainId,
    query: { enabled: !!address },
  });

  const { data: unprocessedDeposits } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: USDTVAULT.abi,
    functionName: 'getUnprocessedDeposits',
    chainId: targetChainId,
    query: { enabled: !!address },
  });

  // Logic to determine the final balance to display (prioritize live, fallback to backend)
  // dashboardData.liveContractBalance is usually in human-readable units (e.g. 100.50), 
  // so we convert it to BigInt (6 decimals) if needed to match the contract output.
  const displayBalance = fetchedPlatformBalance !== undefined 
    ? fetchedPlatformBalance 
    : (dashboardData?.liveContractBalance !== undefined 
        ? BigInt(Math.floor(dashboardData.liveContractBalance * 1000000)) 
        : undefined);

  // Debugging logs
  React.useEffect(() => {
    if (address) {
      console.log("[StatsSummary] Debug Info:", {
        queryAddress: address,
        wagmiAddress,
        sessionAddress: session?.user?.walletAddress,
        contractAddress: CONTRACT_ADDRESS,
        targetChainId,
        connectedChainId: connectedChain?.id,
        userBalance: fetchedPlatformBalance,
        backendBalance: dashboardData?.liveContractBalance,
        totalContractBalance,
        unprocessedDeposits,
        isConnected
      });
    }
  }, [address, wagmiAddress, session, fetchedPlatformBalance, dashboardData, totalContractBalance, unprocessedDeposits, targetChainId, connectedChain, isConnected]);

  const liveContractBalance = fetchedPlatformBalance !== undefined ? Number(fetchedPlatformBalance) : undefined;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };


  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }} // Stagger children animation
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" // Adjusted to 3 columns as per original code before last change
    >
      {/* Total Profit Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-tr from-green-900/15 to-emerald-900/15 rounded-xl border border-green-700/10 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-green-500/20 rounded-lg mr-3">
            <DollarSign size={18} className="text-green-400" />
          </div>
          <span className="text-sm text-gray-300">Total Profit</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-lg tracking-wide font-bold text-green-400">{realTimeProfit.toFixed(2)}</span>
          <span className="ml-1.5 text-gray-300 text-sm">USDT</span>
        </div>
      </motion.div>

      {/* Contract Balance Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-tr from-cyan-900/40 to-teal-900/15 rounded-xl border border-cyan-700/15 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
            <BarChart2 size={18} className="text-cyan-400" />
          </div>
          <span className="text-sm text-gray-300">Platform Balance</span>
        </div>
        <div className="flex items-baseline">
          {isPlatformBalanceLoading ? (
            <span className="text-lg font-bold text-gray-500">Loading...</span>
          ) : isPlatformBalanceError || displayBalance === undefined ? (
            <span className="text-lg font-bold text-gray-500">Error/N/A</span>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-wide text-cyan-200">
                {formatUSDTBalance(displayBalance)}
                <span className="ml-1.5 text-gray-300 text-sm">USDT</span>
              </span>
              {typeof weeklyRequirement === 'number' && weeklyRequirement > 0 &&
                Number(formatUSDTBalance(displayBalance).replace(/,/g, '')) < weeklyRequirement && (
                  <span className='text-xs text-red-400 mt-1'>Minimum Required: <span className="font-medium text-red-400">{weeklyRequirement.toFixed(2)} USDT</span></span>
                )}
            </div>
          )}
        </div>
        {(isPlatformBalanceError || displayBalance === undefined) && (
          <p className="text-xs text-gray-500 mt-1">Balance unavailable or error fetching.</p>
        )}
      </motion.div>

      {/* Bot Status Card */}
      <motion.div variants={itemVariants} className="bg-gradient-to-tr from-purple-900/40 to-violet-900/20 rounded-xl border border-purple-700/30 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
            <Power size={18} className={`${botIsActive ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <span className="text-sm text-gray-300">Bot Status</span>
        </div>
        <div className="flex items-baseline">
          <span className={`text-xl font-semibold ${botIsActive ? 'text-green-400' : 'text-red-400'}`}>
            {botIsActive ? 'Active' : 'Inactive'}
          </span>
          {botIsActive && (
            <span className="relative flex h-3 w-3 ml-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
