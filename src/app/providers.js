"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

import React from "react";
import { SessionProvider } from "next-auth/react";
import {
  createConfig,
  WagmiProvider,
  http,
  cookieStorage,
  createStorage,
  cookieToInitialState,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";

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

// ─── Toggle ───────────────────────────────────────────────────────────────────
const USE_CONNECTKIT = false; // true = ConnectKit, false = RainbowKit

// ─── Chains ───────────────────────────────────────────────────────────────────
const ganache = {
  id: 1337,
  name: "Ganache Local",
  network: "ganache",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public:  { http: ["http://127.0.0.1:8545"] },
  },
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const activeChains = IS_PRODUCTION ? [mainnet] : [sepolia, ganache];
const initialChainForProvider = IS_PRODUCTION ? mainnet : sepolia;

// ─── Transports ───────────────────────────────────────────────────────────────
const RPC = {
  [mainnet.id]: "/api/rpc/mainnet",
  [sepolia.id]: "/api/rpc/sepolia",
  [ganache.id]: "http://127.0.0.1:8545",
};

const transports = Object.fromEntries(
  activeChains.map((chain) => [chain.id, http(RPC[chain.id])])
);

// ─── Shared storage (cookie-based for mobile deep-link persistence) ───────────
const storage = createStorage({ storage: cookieStorage });

const PROJECT_ID = "bf4c49527ab36db3f8a27a9090b8d437";
const APP_NAME   = "Stable Wealth";

// ─── RainbowKit connectors ────────────────────────────────────────────────────
const rainbowKitConnectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet, walletConnectWallet, coinbaseWallet,
        trustWallet, binanceWallet, bybitWallet,
        bitgetWallet, okxWallet, ledgerWallet, phantomWallet,
      ],
    },
  ],
  { appName: APP_NAME, projectId: PROJECT_ID, chains: activeChains }
);

// ─── ConnectKit config ────────────────────────────────────────────────────────
const connectKitConfig = getDefaultConfig({
  appName: APP_NAME,
  walletConnectProjectId: PROJECT_ID,
  chains: activeChains,
  transports,
  storage, // 👈 cookie storage for mobile
  ssr: true,
});

// ─── Wagmi config ─────────────────────────────────────────────────────────────
export const wagmiConfig = createConfig(
  USE_CONNECTKIT
    ? connectKitConfig // ConnectKit already builds a full wagmi config
    : {
        ssr: true,
        chains: activeChains,
        transports,
        connectors: rainbowKitConnectors,
        storage, // 👈 cookie storage for mobile
      }
);

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient();

// ─── Inner Providers (runs client-side only) ──────────────────────────────────
const ProvidersInner = ({ children, session, initialState }) => (
  <SessionProvider session={session}>
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {USE_CONNECTKIT ? (
          <ConnectKitProvider theme="dark" mode="dark">
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

// ─── SSR-safe export ──────────────────────────────────────────────────────────
const Providers = dynamic(() => Promise.resolve(ProvidersInner), {
  ssr: false,
});

export default Providers;