/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    devIndicators: {
        buildActivity: false, // Disable build activity panel
    },
    env: {
        NEXT_PUBLIC_MAINNET_RPC_URL: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    }
};

export default nextConfig;
