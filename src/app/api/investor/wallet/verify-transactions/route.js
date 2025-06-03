import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import TokenApproval from '@/models/TokenApproval';
import PayoutLog from '@/models/PayoutLog'; // Import PayoutLog model
import TokenApprovalLog from '@/models/TokenApprovalLog'; // Import TokenApprovalLog model
import { createPublicClient, http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// --- Configuration ---
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TARGET_CHAIN = IS_PRODUCTION ? mainnet : sepolia;
const RPC_URL = IS_PRODUCTION
    ? process.env.NEXT_PUBLIC_MAINNET_RPC_URL
    : process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL;

if (!RPC_URL) {
    console.error("Error: RPC_URL environment variable is not set!");
    // Consider throwing an error or preventing startup if RPC_URL is missing
}

// Configure public client for blockchain interactions
const publicClient = RPC_URL ? createPublicClient({
    chain: TARGET_CHAIN,
    transport: http(RPC_URL),
    // Optional: Add polling interval if needed, though getTransactionReceipt usually waits
    // pollingInterval: 4_000,
}) : null;

// POST /api/investor/wallet/verify-transactions - Checks and updates pending deposits, withdrawals, and token approvals
export async function POST(request) {
    console.log("API Route /api/investor/wallet/verify-transactions HIT"); // <-- Add this log

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized: Not logged in' }, { status: 401 });
    }

    if (!publicClient) {
        return NextResponse.json({ message: 'Service unavailable: RPC configuration error' }, { status: 503 });
    }

    try { // Start of the main try block
        await connectDB();
        console.log(`Starting verification process on chain: ${TARGET_CHAIN.name} for user ${session.user.id}`);

        // Parse the request body to check what types to verify
    // Add 'payout' and 'tokenApprovalLog' as default types
    const { types = ['deposit', 'withdrawal', 'approval', 'payout', 'tokenApprovalLog'] } = await request.json().catch(() => ({}));

    // Validate types array
    const validTypes = Array.isArray(types) ?
        types.filter(type => ['deposit', 'withdrawal', 'approval', 'payout', 'tokenApprovalLog'].includes(type)) :
        ['deposit', 'withdrawal', 'approval', 'payout', 'tokenApprovalLog'];

    if (validTypes.length === 0) {
        return NextResponse.json({
            message: 'No valid verification types specified. Use "deposit", "withdrawal", "approval", "payout", "tokenApprovalLog", or a combination.',
        }, { status: 400 });
    }

    const results = {
        typesRequested: validTypes,
        transactions: { checked: 0, completed: 0, failed: 0, notFoundOrStillPending: 0, errors: 0 },
        approvals: { checked: 0, completed: 0, failed: 0, notFoundOrStillPending: 0, errors: 0 },
        payouts: { checked: 0, completed: 0, failed: 0, notFoundOrStillPending: 0, errors: 0 },
        tokenApprovalLogs: { checked: 0, completed: 0, failed: 0, notFoundOrStillPending: 0, errors: 0 }, // Add tokenApprovalLogs results
         details: []
     };

        // Removed the inner try block start here

        // --- Verify Pending Transactions (Deposits/Withdrawals) ---
        const transactionTypesToQuery = validTypes.filter(t => ['deposit', 'withdrawal'].includes(t));
        if (transactionTypesToQuery.length > 0) {
            const pendingTransactions = await Transaction.find({
                user: session.user.id,
                type: { $in: transactionTypesToQuery },
                status: "pending",
                txHash: { $exists: true, $ne: null, $ne: '' }
            }).lean();

            console.log(`Found ${pendingTransactions.length} pending transaction(s) [${transactionTypesToQuery.join(', ')}] to verify.`);
            results.transactions.checked = pendingTransactions.length;

            for (const transaction of pendingTransactions) {
                console.log(`Verifying Tx [${transaction.type}] ID: ${transaction._id}, Hash: ${transaction.txHash}`);
                await verifyItem(transaction, 'transaction', results);
            }
        }

        // --- Verify Pending Token Approvals ---
        if (validTypes.includes('approval')) {
            // Approvals might not be user-specific in the same way, adjust query if needed
            // Assuming approvals are linked to the user initiating them for now
            const pendingApprovals = await TokenApproval.find({
                // user: session.user.id, // Adjust if approvals aren't user-specific
                status: "pendingApproval",
                transactionHash: { $exists: true, $ne: null, $ne: '' }
            }).lean();

            console.log(`Found ${pendingApprovals.length} pending token approval(s) to verify.`);
            results.approvals.checked = pendingApprovals.length;

            for (const approval of pendingApprovals) {
                console.log(`Verifying Approval ID: ${approval._id}, Hash: ${approval.transactionHash}`);
                await verifyItem(approval, 'approval', results);
            }
        }

        // --- Verify Pending Payouts ---
        if (validTypes.includes('payout')) {
            // Payouts are initiated by admins, so query based on status and hash existence
            const pendingPayouts = await PayoutLog.find({
                status: "pending", // Status set after hash is recorded
                transactionHash: { $exists: true, $ne: null, $ne: '' }
            }).lean();

            console.log(`Found ${pendingPayouts.length} pending payout(s) to verify.`);
            results.payouts.checked = pendingPayouts.length;

            for (const payout of pendingPayouts) {
                console.log(`Verifying Payout ID: ${payout._id}, Hash: ${payout.transactionHash}`);
                await verifyItem(payout, 'payout', results); // Use helper function
            }
        }

        // --- Verify Pending Token Approval Logs ---
        if (validTypes.includes('tokenApprovalLog')) {
            const pendingTokenApprovalLogs = await TokenApprovalLog.find({
                status: "pending", // Assuming 'pending' is the status for logs awaiting on-chain confirmation
                transactionHash: { $exists: true, $ne: null, $ne: '' }
            }).lean();

            console.log(`Found ${pendingTokenApprovalLogs.length} pending token approval log(s) to verify.`);
            results.tokenApprovalLogs.checked = pendingTokenApprovalLogs.length;

            for (const log of pendingTokenApprovalLogs) {
                console.log(`Verifying Token Approval Log ID: ${log._id}, Hash: ${log.transactionHash}`);
                await verifyItem(log, 'tokenApprovalLog', results); // Use helper function
            }
        }


        console.log('Verification process finished.', results);
        return NextResponse.json({
            message: 'Verification process completed.',
            results
        }, { status: 200 });

    } catch (error) {
        console.error("API Error during verification process:", error);
        // Assign error count based on context if possible, otherwise general
        results.transactions.errors++; // Or approvals.errors++ or payouts.errors++
        return NextResponse.json({
            message: 'Error running verification process',
            error: error.message,
            results
        }, { status: 500 });
    } // This is the end of the main catch block
} // This is the end of the POST function


// --- Helper Function to Verify an Item (Transaction, Approval, or Payout) ---
async function verifyItem(item, itemType, results) {
    const id = item._id;
    // Determine hash field based on itemType
    const hash = itemType === 'transaction' ? item.txHash : item.transactionHash;
    // Determine type for logging/details
    const type = itemType === 'transaction' ? item.type : itemType; // 'approval', 'payout', or 'tokenApprovalLog'

    const resultsKey = itemType === 'transaction' ? 'transactions' :
                       itemType === 'approval' ? 'approvals' :
                       itemType === 'payout' ? 'payouts' :
                       itemType === 'tokenApprovalLog' ? 'tokenApprovalLogs' : 'unknown'; // New key for tokenApprovalLogs

    // Check if hash exists
    if (!hash) {
        console.warn(`  - Skipping verification for ${type} ID: ${id} due to missing hash.`);
        results[resultsKey].errors++;
        results.details.push({ id, type, hash: null, status: 'Skipped (Missing Hash)' });
        return;
    }

    try {
        console.log(`  - Fetching receipt for ${hash}...`);
        const receipt = await publicClient.getTransactionReceipt({ hash });
        console.log(`  - Receipt fetched: ${receipt ? 'Found' : 'Not Found'}`);

        if (!receipt) {
            console.log(`  - Receipt not found for ${hash}. Skipping (might still be pending on chain).`);
            results[resultsKey].notFoundOrStillPending++;
            results.details.push({ id, type, hash, status: 'Receipt Not Found (Still Pending?)' });
            return;
        }

        console.log(`  - Receipt found for ${hash}. Status: ${receipt.status}, Block: ${receipt.blockNumber}`);

        let updateData = {};
        let newStatus = '';
        let modelToUpdate;
        const confirmedHash = receipt.transactionHash; // Get the hash from the receipt

        // Get the latest block number to calculate confirmations
        const latestBlock = await publicClient.getBlockNumber();
        const confirmations = Number(latestBlock) - Number(receipt.blockNumber) + 1; // +1 because the block it's in counts as 1 confirmation

        // Determine model and base update data
        switch (itemType) {
            case 'transaction':
                modelToUpdate = Transaction;
                updateData = {
                    'blockchainData.blockNumber': Number(receipt.blockNumber),
                    'blockchainData.networkId': String(TARGET_CHAIN.id),
                    'blockchainData.confirmations': confirmations, // Add confirmations here
                    txHash: confirmedHash, // Update hash to confirmed one
                };
                break;
            case 'approval':
                modelToUpdate = TokenApproval;
                updateData = {
                    'blockchainData.blockNumber': Number(receipt.blockNumber),
                    'blockchainData.networkId': String(TARGET_CHAIN.id),
                    'blockchainData.confirmations': confirmations, // Add confirmations here
                    transactionHash: confirmedHash,
                };
                break;
            case 'payout':
                modelToUpdate = PayoutLog;
                updateData = {
                    'blockchainData.blockNumber': Number(receipt.blockNumber), // Use dot notation for nested fields
                    'blockchainData.networkId': String(TARGET_CHAIN.id),
                    'blockchainData.confirmations': confirmations, // Add confirmations here
                    transactionHash: confirmedHash,
                };
                break;
            case 'tokenApprovalLog': // New case for TokenApprovalLog
                modelToUpdate = TokenApprovalLog;
                updateData = {
                    'blockchainData.blockNumber': Number(receipt.blockNumber),
                    'blockchainData.networkId': String(TARGET_CHAIN.id),
                    'blockchainData.confirmations': confirmations, // Add confirmations here
                    transactionHash: confirmedHash,
                };
                break;
            default:
                console.error(`  - Unknown itemType: ${itemType} for ID ${id}`);
                results.errors++; // Use a general error counter or add one specific to this case
                return;
        }


        if (receipt.status === 'success') {
            // Determine success status based on type
            if (itemType === 'transaction' || itemType === 'payout' || itemType === 'tokenApprovalLog') {
                newStatus = 'completed';
            } else { // approval
                newStatus = 'active';
                updateData.isActive = true;
            }
            updateData.status = newStatus;

            // Add specific descriptions on success if needed
            if (itemType === 'transaction' && item.type === 'deposit') {
                updateData.description = `Deposit of ${item.amount} ${item.currency} confirmed.`;
            }
            // Add description for successful payout?
            // if (itemType === 'payout') { updateData.description = ... }

            results[resultsKey].completed++;
            console.log(`  - Marking ${type} ID: ${id} as ${newStatus} with confirmed hash ${confirmedHash}.`);

        } else if (receipt.status === 'reverted') {
            newStatus = 'failed';
            updateData.status = newStatus;

            // Add specific descriptions on failure
            if (itemType === 'transaction') {
                updateData.description = `${item.description || ''} | On-Chain Status: Reverted on block ${receipt.blockNumber}`.trim();
            } else if (itemType === 'approval') {
                updateData.isActive = false;
                updateData.description = `Approval failed (reverted on block ${receipt.blockNumber})`;
            } else if (itemType === 'payout') {
                updateData.errorMessage = `Transaction reverted on block ${receipt.blockNumber}`;
            } else if (itemType === 'tokenApprovalLog') { // New: TokenApprovalLog failure
                updateData.errorMessage = `Token approval transfer reverted on block ${receipt.blockNumber}`;
            }

            results[resultsKey].failed++;
            console.warn(`  - Marking ${type} ID: ${id} as failed (reverted) with confirmed hash ${confirmedHash}.`);
        } else {
            // Handle unexpected status - Log and leave pending
            console.log(`  - Unexpected receipt status '${receipt.status}' for ${hash}. Leaving as pending.`);
            results[resultsKey].notFoundOrStillPending++;
            results.details.push({ id, type, hash, status: `Unexpected Receipt Status: ${receipt.status}` });
            return; // Don't update DB for unexpected status
        }

        // Update the item in the database
        await modelToUpdate.findByIdAndUpdate(id, { $set: updateData });
        results.details.push({ id, type, hash, status: `Updated to ${newStatus}` });

    } catch (error) {
        const isPendingOrNotFoundError =
            error.message?.includes('could not be found') ||
            error.message?.includes('not found') ||
            error.message?.includes('not be processed on a block yet') ||
            error.code === -32000 || // Common RPC error codes for pending/not found
            error.code === -32603;

        const resultsKey = itemType === 'transaction' ? 'transactions' :
                           itemType === 'approval' ? 'approvals' :
                           itemType === 'payout' ? 'payouts' :
                           'tokenApprovalLogs'; // New key for tokenApprovalLogs

        if (isPendingOrNotFoundError) {
            console.log(`  - Receipt not found for ${hash} or error fetching: ${error.message}. Skipping (likely still pending).`);
            results[resultsKey].notFoundOrStillPending++;
            results.details.push({ id, type, hash, status: 'Receipt Not Found (Still Pending?)', error: error.message });
        } else {
            results[resultsKey].errors++;
            console.error(`Unexpected error processing ${type} verification for ID ${id} (${hash}):`, error);
            results.details.push({ id, type, hash, status: 'Error Processing', error: error.message });
        }
    }
}
