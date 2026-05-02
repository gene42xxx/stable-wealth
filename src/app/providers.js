"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { DynamicContextProvider, overrideNetworkRpcUrl } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import dynamic from "next/dynamic";
import { readContract } from 'wagmi/actions';
import { erc20Abi } from 'viem';



// ─── Chains ───────────────────────────────────────────────────────────────────
const ganache = {
  id: 1337,
  name: "Ganache Local",
  network: "ganache",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const activeChains = IS_PRODUCTION ? [mainnet] : [sepolia, ganache];

// ─── Transports ───────────────────────────────────────────────────────────────
const RPC = {
  [mainnet.id]: "/api/rpc/mainnet",
  [sepolia.id]: "/api/rpc/sepolia",
  [ganache.id]: "http://127.0.0.1:8545",
};

const transports = Object.fromEntries(
  activeChains.map((chain) => [chain.id, http(RPC[chain.id])])
);

// ─── Wagmi config ─────────────────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  chains: activeChains,
  multiInjectedProviderDiscovery: false, // Dynamic handles this
  transports,
});

const queryClient = new QueryClient();

// ─── Inner Providers ──────────────────────────────────────────────────────────
const ProvidersInner = ({ children, session }) => (
  <DynamicContextProvider
    settings={{
      environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ,
      walletConnectors: [EthereumWalletConnectors],
      // Mobile deep links handled automatically ✅
      appName: "Stable Wealth",
      appLogoUrl: "https://res.cloudinary.com/hopekumordzie/image/upload/v1777758669/sb_yk1ieg.png", // optional
      initialAuthenticationMode: 'connect-only',
      networkValidationMode: 'off',
      recommendedWallets: [
        { walletKey: 'metamask' },
        { walletKey: 'trust' },
        { walletKey: 'coinbase' }
      ],
      evmNetworks: [
        {
          blockExplorerUrls: ["https://etherscan.io"],
          chainId: 1,
          chainName: "Ethereum Mainnet",
          iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          networkId: 1,
          rpcUrls: [RPC[1]],
          vanityName: "Ethereum",
        },
        {
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
          chainId: 11155111,
          chainName: "Sepolia",
          iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
          nativeCurrency: {
            decimals: 18,
            name: "Sepolia Ether",
            symbol: "ETH",
          },
          networkId: 11155111,
          rpcUrls: [RPC[11155111]],
          vanityName: "Sepolia",
        },
      ],
    }}
      >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <SessionProvider session={session}>
              {children}
            </SessionProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
  </DynamicContextProvider >
);

const Providers = dynamic(() => Promise.resolve(ProvidersInner), {
  ssr: false,
});

export default Providers;