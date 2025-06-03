"use client";
import "@rainbow-me/rainbowkit/styles.css"; // Keep for RainbowKit
import { ConnectKitProvider, getDefaultConfig } from "connectkit"; // Import for ConnectKit

import React, { useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { createConfig, WagmiProvider, http, useAccount } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mutate } from 'swr'; // Import SWR mutate function

// RainbowKit imports (conditional use)
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import {
  binanceWallet,
  walletConnectWallet,
  bybitWallet,
  coinbaseWallet,
  trustWallet,
  bitgetWallet,
  ledgerWallet,
  metaMaskWallet,
  okxWallet,
  phantomWallet,
} from "@rainbow-me/rainbowkit/wallets";

// Define a constant to switch between RainbowKit and ConnectKit
const USE_CONNECTKIT = true; // Set to false to use RainbowKit, true to use ConnectKit

// Define the Ganache custom chain
const ganache = {
  id: 1337, // Chain ID for Ganache
  name: "Ganache Local",
  network: "ganache",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] }, // Correct format for Wagmi v2+
    public: { http: ['http://127.0.0.1:8545'] },  // Also include public for robustness
  },
  // Optional: Add blockExplorers if you have a local explorer setup
  // blockExplorers: {
  //   default: { name: 'GanacheScan', url: 'http://localhost:xxxx' }, // Replace xxxx with port if needed
  // },
};

// Define connectors for wallets (RainbowKit specific)
const rainbowKitConnectors = connectorsForWallets(
  [
    {
      groupName: "Recommended", // Changed group name for clarity
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
        coinbaseWallet,
        trustWallet,
        binanceWallet,
        bybitWallet,
        bitgetWallet,
        okxWallet,
        ledgerWallet,
        phantomWallet,
      ],
    },
  ],
  {
    appName: "Stable Wealth",
    projectId: "c7a48f111c53139d75aeaed8c2644c62",
  }
);

// --- Environment and Chain Configuration ---
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Define RPC URLs explicitly for clarity and correctness
// Use NEXT_PUBLIC_ prefix to expose these to the client-side
const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "";
const SEPOLIA_RPC = process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL || "";
const GANACHE_RPC = "http://127.0.0.1:8545"; // Default Ganache RPC

// Determine the active chains and the initial chain based on the environment
const activeChains = IS_PRODUCTION ? [mainnet] : [sepolia, ganache];
const initialChainForProvider = IS_PRODUCTION ? mainnet : sepolia; // Define initial chain based on env

// Build the transports object dynamically based on the active chains
const transports = {};
activeChains.forEach(chain => {
  if (chain.id === mainnet.id && MAINNET_RPC) {
    transports[mainnet.id] = http(MAINNET_RPC);
  } else if (chain.id === sepolia.id && SEPOLIA_RPC) {
    transports[sepolia.id] = http(SEPOLIA_RPC);
  } else if (chain.id === ganache.id && GANACHE_RPC) {
    transports[ganache.id] = http(GANACHE_RPC);
  }
});
// --- End Environment and Chain Configuration ---

// Create the ConnectKit configuration (FIXED)
const connectKitConfig = getDefaultConfig({
  appName: "Stable Wealth",
  walletConnectProjectId: "c7a48f111c53139d75aeaed8c2644c62", // Fixed: was 'projectId'
  chains: activeChains,
  enableFamily: false, // Enable to show more wallet options (was false)
});

// Create the Wagmi configuration
const config = createConfig({
  chains: USE_CONNECTKIT ? connectKitConfig.chains : [...activeChains],
  transports: USE_CONNECTKIT ? (connectKitConfig.transports || {}) : transports,
  connectors: USE_CONNECTKIT ? connectKitConfig.connectors : rainbowKitConnectors,
});

// Export the config for use in actions like waitForTransactionReceipt
export const wagmiConfig = config;

// Initialize the QueryClient
const queryClient = new QueryClient();

// Providers component
const Providers = ({ children, session }) => { // Accept session prop if passed from server component layout
  return (
    // Wrap everything with SessionProvider
    <SessionProvider session={session}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {USE_CONNECTKIT ? (
            <ConnectKitProvider theme="dark" mode="dark">
              {children}
            </ConnectKitProvider>
          ) : (
            <RainbowKitProvider
              theme={darkTheme()} // Use the dark theme
              showRecentTransactions={true}
              initialChain={initialChainForProvider} // Use the conditional initial chain
            >
              {children}
              {/* <WalletAddressUpdater /> Add the updater component here */}
            </RainbowKitProvider>
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
};

export default Providers;