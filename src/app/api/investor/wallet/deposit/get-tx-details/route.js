import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, getAddress, decodeEventLog } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TARGET_CHAIN = IS_PRODUCTION ? mainnet : sepolia;
const RPC_URL = IS_PRODUCTION
    ? process.env.MAINNET_RPC_URL
    : process.env.ALCHEMY_SEPOLIA_URL;

if (!RPC_URL) {
    console.error("Error: RPC_URL environment variable is not set!");
}

const publicClient = RPC_URL ? createPublicClient({
    chain: TARGET_CHAIN,
    transport: http(RPC_URL),
}) : null;

// ABI for Transfer event - This should work for most ERC-20 tokens including mock USDT
const TRANSFER_EVENT_ABI = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// Transfer event topic hash - Standard ERC-20 Transfer event
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Mock USDT Contract Addresses
const USDT_ADDRESS_MAINNET = process.env.NEXT_PUBLIC_USDT_ADDRESS || "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Real USDT mainnet
const MOCK_USDT_ADDRESS_SEPOLIA = process.env.NEXT_PUBLIC_USDT_ADDRESS_SEPOLIA || "0x0F631DA7778F6A346F3f9D3b3EaB962c986d4Ffd"; // Your mock USDT

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    if (!publicClient) {
        return NextResponse.json({ message: 'Service unavailable: RPC configuration error' }, { status: 503 });
    }

    try {
        const { txHash } = await request.json();

        if (!txHash) {
            return NextResponse.json({ message: 'Transaction hash is required' }, { status: 400 });
        }

        // Fetch transaction receipt
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

        if (!receipt) {
            return NextResponse.json({ message: 'Transaction not found or not yet confirmed on blockchain.' }, { status: 404 });
        }

        if (receipt.status !== 'success') {
            return NextResponse.json({ message: 'Transaction was not successful on-chain (reverted).' }, { status: 400 });
        }

        // Determine the correct USDT address for the current chain
        const currentUSDTAddress = TARGET_CHAIN.id === mainnet.id ? USDT_ADDRESS_MAINNET : MOCK_USDT_ADDRESS_SEPOLIA;

        console.log('Debug Info:');
        console.log('Target Chain:', TARGET_CHAIN.name);
        console.log('Expected USDT Address:', currentUSDTAddress);
        console.log('Transfer Event Topic:', TRANSFER_EVENT_TOPIC);
        console.log('Number of logs:', receipt.logs.length);

        let transferEvents = [];
        let debugLogs = [];

        // Iterate through logs to find Transfer events
        for (let i = 0; i < receipt.logs.length; i++) {
            const log = receipt.logs[i];

            debugLogs.push({
                logIndex: i,
                address: log.address,
                topics: log.topics,
                isTransferTopic: log.topics[0] === TRANSFER_EVENT_TOPIC
            });

            // Check if this is a Transfer event (topic matches)
            if (log.topics[0] === TRANSFER_EVENT_TOPIC) {
                try {
                    const decodedLog = decodeEventLog({
                        abi: [TRANSFER_EVENT_ABI],
                        data: log.data,
                        topics: log.topics,
                    });

                    const transferEvent = {
                        logIndex: i,
                        contractAddress: log.address,
                        from: decodedLog.args.from,
                        to: decodedLog.args.to,
                        value: decodedLog.args.value.toString(),
                        isUSDTContract: false
                    };

                    // Check if this is from the USDT contract
                    try {
                        if (currentUSDTAddress && getAddress(log.address) === getAddress(currentUSDTAddress)) {
                            transferEvent.isUSDTContract = true;
                        }
                    } catch (addressError) {
                        console.warn('Address comparison error:', addressError.message);
                        // Fallback to string comparison
                        if (log.address.toLowerCase() === currentUSDTAddress.toLowerCase()) {
                            transferEvent.isUSDTContract = true;
                        }
                    }

                    transferEvents.push(transferEvent);

                } catch (decodeError) {
                    console.warn(`Could not decode Transfer event at log ${i}:`, decodeError.message);
                }
            }
        }

        console.log('All Transfer Events Found:', transferEvents);
        console.log('Debug Logs:', debugLogs);

        // Find USDT transfer events
        let usdtTransfers = transferEvents.filter(event => event.isUSDTContract);

        // If no USDT transfers found but there are other transfers, 
        // optionally return the first transfer event for debugging
        if (usdtTransfers.length === 0 && transferEvents.length > 0) {
            console.warn('No USDT transfers found, but other transfer events exist');

            // Uncomment the next line if you want to accept any transfer event for testing
            // usdtTransfers = [transferEvents[0]];
        }

        if (usdtTransfers.length === 0) {
            return NextResponse.json({
                message: 'Could not find a relevant USDT transfer event in the transaction logs.',
                debug: {
                    totalLogs: receipt.logs.length,
                    transferEvents: transferEvents.length,
                    usdtTransfers: usdtTransfers.length,
                    expectedUSDTAddress: currentUSDTAddress,
                    allTransferEvents: transferEvents,
                    debugLogs: debugLogs
                }
            }, { status: 404 });
        }

        // Use the first USDT transfer (or implement more complex logic if needed)
        const usdtTransfer = usdtTransfers[0];

        return NextResponse.json({
            message: 'Transaction details fetched successfully',
            txDetails: {
                amount: usdtTransfer.value, // Amount in smallest unit (as string)
                fromAddress: usdtTransfer.from,
                toAddress: usdtTransfer.to,
                blockNumber: receipt.blockNumber.toString(),
                transactionHash: receipt.transactionHash,
                contractAddress: usdtTransfer.contractAddress, // Include contract address for verification
            },
            debug: {
                totalTransferEvents: transferEvents.length,
                usdtTransferEvents: usdtTransfers.length,
                allTransferEvents: transferEvents,
                // Add decimal info if needed
                note: "Amount is in smallest unit (wei for 18 decimals, or custom for mock USDT)"
            }
        }, { status: 200 });

    } catch (error) {
        console.error("API Error fetching transaction details:", error);
        let errorMessage = 'Failed to fetch transaction details.';
        if (error.message.includes('Transaction with hash')) {
            errorMessage = 'Transaction not found or invalid hash.';
        } else if (error.message.includes('could not be found')) {
            errorMessage = 'Transaction not found on the blockchain.';
        }
        return NextResponse.json({ message: errorMessage, error: error.message }, { status: 500 });
    }
}