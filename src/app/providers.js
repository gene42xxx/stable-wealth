"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

import React, { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { createConfig, WagmiProvider, http, createStorage, cookieStorage } from "wagmi";
import { mainnet as wagmiMainnet, sepolia as wagmiSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
const USE_CONNECTKIT = true; // Set to true to use ConnectKit, false for RainbowKit

// Override chain RPC metadata to use local proxies and avoid CORS fallbacks
const mainnet = {
  ...wagmiMainnet,
  rpcUrls: {
    ...wagmiMainnet.rpcUrls,
    default: { http: ["/api/rpc/mainnet"] },
    public: { http: ["/api/rpc/mainnet"] },
  },
};

const sepolia = {
  ...wagmiSepolia,
  rpcUrls: {
    ...wagmiSepolia.rpcUrls,
    default: { http: ["/api/rpc/sepolia"] },
    public: { http: ["/api/rpc/sepolia"] },
  },
};

// Define the Ganache custom chain
const ganache = {
  id: 1337,
  name: "Ganache Local",
  network: "ganache",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

// Connectors for RainbowKit
const rainbowKitConnectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
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

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const activeChains = IS_PRODUCTION ? [mainnet] : [sepolia, ganache];
const initialChainForProvider = IS_PRODUCTION ? mainnet : sepolia;

const transports = {
  [mainnet.id]: http("/api/rpc/mainnet"),
  [sepolia.id]: http("/api/rpc/sepolia"),
  [ganache.id]: http("http://127.0.0.1:8545"),
};

// Connectors for ConnectKit
const connectKitConfig = getDefaultConfig({
  appName: "Stable Wealth",
  walletConnectProjectId: "c7a48f111c53139d75aeaed8c2644c62",
  chains: activeChains,
});

const config = createConfig({
  chains: activeChains,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports,
  connectors: USE_CONNECTKIT ? connectKitConfig.connectors : rainbowKitConnectors,
});

export const wagmiConfig = config;

const queryClient = new QueryClient();

const Providers = ({ children, session }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SessionProvider session={session}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {USE_CONNECTKIT ? (
            <ConnectKitProvider theme="auto" mode="dark">
              {children}
            </ConnectKitProvider>
          ) : (
            <RainbowKitProvider
              theme={darkTheme()}
              showRecentTransactions={true}
              initialChain={initialChainForProvider}
            >
              {children}
            </RainbowKitProvider>
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
};

export default Providers;