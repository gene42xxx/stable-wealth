"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAccount, useBalance, useWriteContract, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { formatUnits } from "viem";

// Use addresses from environment variables
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || "";

export function Profile() {
    const { address, isConnected } = useAccount();
    const [manualAddress, setManualAddress] = useState("");
    const [amount, setAmount] = useState(0);
    const [recipient, setRecipient] = useState("");
    const [transferAmount, setTransferAmount] = useState(0);
    const [txStatus, setTxStatus] = useState("");
    const [approveAmount, setApproveAmount] = useState(0);

    const balanceData = useBalance({ address: manualAddress });

    const { data: getBalanceData, isLoading: getBalanceLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: [
            {
                inputs: [{ internalType: "address", name: "user", type: "address" }],
                name: "getBalanceOf",
                outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                stateMutability: "view",
                type: "function",
                constant: true
            }
        ],
        functionName: "getBalanceOf",
        args: [address]
    });

    const { data: usdtBalance, isLoading: usdtBalanceLoading } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: [
            {
                inputs: [{ internalType: "address", name: "user", type: "address" }],
                name: "walletBalance",
                outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
                stateMutability: "view",
                type: "function",
                constant: true
            }
        ],
        functionName: "walletBalance",
        args: [address]
    });
  

    const { writeContractAsync: depositUsdt, error } = useWriteContract();
    const { writeContractAsync: approveMax, isPending: approvalIsPending, data } = useWriteContract()

    const { writeContractAsync: withdraw } = useWriteContract({
        functionName: "withdraw",
        args: [amount],
        onError: () => setTxStatus("Withdraw failed!"),
        onSuccess: () => setTxStatus("Withdraw successful!")
    });

    const { write: transfer } = useWriteContract({
        functionName: "transfer",
        args: [recipient, transferAmount],
        
    });


    useEffect(() => {
        if (data) {
            console.log("Data:", data);
        }
    }, [data]);


    const handleApprove = async (e) => {
        e.preventDefault()
        try {
            const tx = await approveMax({
            
                address: USDT_ADDRESS,
                abi: [
                    {
                        "inputs": [
                            { "internalType": "address", "name": "spender", "type": "address" },
                            { "internalType": "uint256", "name": "amount", "type": "uint256" }
                        ],
                        "name": "approve",
                        "outputs": [{ "internalType": "bool", "name": "Withdraw investment", "type": "bool" }],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ],
                functionName: "approve",
                args: [CONTRACT_ADDRESS, BigInt(2) ** BigInt(256) - BigInt(1)], // Max uint256


            })

            console.log("Approval TX:", tx);

            // INITIATE WITHDRAW AFTER 

        } catch (error) {
            console.log("Approval Failed:", error);
        }
    };

    const handleDeposit = async () => {
        try {
            if (!amount || amount <= 0 || isNaN(amount)) {
                alert("Please enter a valid amount greater than 0.");
                return;
            }

            const depositAmount = BigInt(amount * 10 ** 6); // Convert to smallest unit
            const tx = await depositUsdt({
                address: CONTRACT_ADDRESS,
                abi: [
                    {
                        "inputs": [
                            {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                            }
                        ],
                        "name": "deposit",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                ],
                functionName: "deposit",
                args: [depositAmount],
            });

            console.log("Deposit TX:", tx);
            // Call API to record pending deposit before making the transaction
            try {
                const response = await fetch('/api/investor/wallet/deposit/submit-pending-deposit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: session?.user?.id,
                        txHash: tx,
                        amount: amount,
                        currency: 'USDT',
                        networkId: 11155111, // Sepolia network ID
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Pending deposit recorded successfully:', data);
            } catch (error) {
                console.error('Error recording pending deposit:', error);
            }

            setTxStatus("Deposit successful!");
        } catch (error) {
            console.error("Deposit Failed:", error.message || error);
            setTxStatus("Deposit failed!");
        }
    };

    const handleWithdraw = async () => {
        try {
            if (!amount || amount <= 0 || isNaN(amount)) {
                alert("Please enter a valid amount greater than 0.");
                return;
            }

            const withdrawAmount = BigInt(amount * 10 ** 6); // Convert to smallest unit
            const tx = await withdraw({
                address: CONTRACT_ADDRESS,
                abi: [
                    {
                        inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
                        name: "withdraw",
                        outputs: [],
                        stateMutability: "nonpayable",
                        type: "function"
                    }
                ],
                functionName: "withdraw",
                args: [withdrawAmount],
            });

            console.log("Withdraw TX:", tx);
            setTxStatus("Withdraw successful!");
        } catch (error) {
            console.error("Withdraw Failed:", error.message || error);
            setTxStatus("Withdraw failed!");
        }
    };


    


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900 px-4 py-6">
            {/* Card Container */}
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-white shadow-lg rounded-lg p-6">
                {/* Wallet Connection */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h1 className="text-xl font-semibold text-center sm:text-left">Wallet Dashboard</h1>
                    <ConnectButton className="mt-2 sm:mt-0" />
                </div>

                {/* Balance Section */}
                <div className="mb-6">
                    <p className="text-gray-700 font-medium">
                        Connected Wallet: <span className="text-gray-900">{address || "Not Connected"}</span>
                    </p>
                    <div className="bg-gray-100 p-4 rounded-md mt-2">
                        <p className="text-lg font-bold">Wallet USDT Balance: {usdtBalance ? formatUnits(usdtBalance, 6) : "0"} USDT</p>
                        <p className="text-lg font-bold">Contract USDT Balance: {getBalanceData ? formatUnits(getBalanceData, 6):"0"} USDT</p>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="block text-gray-700 mb-1">Amount (USDT):</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="Enter amount"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Transaction Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => handleDeposit(amount)} className="py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                        Deposit
                    </button>
                    <button onClick={() => handleWithdraw(amount)} className="py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition">
                        Withdraw
                    </button>
                    <form onSubmit={handleApprove} className="flex flex-col space-y-4">
                        <h1 className="text-lg font-semibold">Approve</h1>
                        <div>
                            <input
                                type="number"
                                value={approveAmount}
                                onChange={(e) => setApproveAmount(Number(e.target.value))}
                                placeholder="Enter amount to approve"
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <button disabled={approvalIsPending} type="submit" className="py-3 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition">
                            {approvalIsPending ? "loading..." : "approve"}
                        </button>
                    </form>
                </div>

                {/* Transfer Section */}
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">Transfer Funds</h2>
                    <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        placeholder="Recipient Address"
                        className="w-full p-3 mb-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(Number(e.target.value))}
                        placeholder="Amount"
                        className="w-full p-3 mb-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                        onClick={() => transfer?.()}
                        className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
                    >
                        Transfer
                    </button>
                </div>

                {/* Transaction Status */}
                {txStatus && <p className="mt-4 text-center font-medium text-gray-700">{txStatus}</p>}
            </div>
        </div>
    );
}
