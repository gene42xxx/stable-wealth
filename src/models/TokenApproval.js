// models/TokenApproval.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define the conventional string representation for maximum uint256 (used for 'unlimited' allowance)
const MAX_UINT256_STRING = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

/**
 * @model TokenApproval
 * @description Stores records of ERC-20 token allowances granted by users to platform smart contracts.
 * Includes handling for 'unlimited' (max uint256) approvals and essential context fields.
 * (blockNumber field has been removed as requested).
 */
const TokenApprovalSchema = new Schema({
    // --- User & Addresses ---
    user: {
        // Reference to the User document (_id) in your database.
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required.'],
        index: true
    },
    ownerAddress: {
        // User's blockchain wallet address that owns the tokens and granted the approval.
        type: String,
        required: [true, 'Owner wallet address is required.'],
        lowercase: true, // Store addresses consistently
        trim: true,
        index: true
    },
    spenderAddress: {
        // Platform's contract address that is approved to spend. Essential context.
        type: String,
        required: [true, 'Spender address is required.'],
        lowercase: true,
        trim: true,
        index: true
    },
    tokenAddress: {
        // Address of the token being approved (e.g., USDT). Essential context.
        type: String,
        required: [true, 'Token contract address is required.'],
        lowercase: true,
        trim: true,
        index: true
    },

    // --- Allowance Amount (Handling Unlimited) ---
    approvedAmount: {
        // The raw allowance amount from the blockchain (in token's smallest unit), stored as a string
        // to accommodate the potentially huge uint256 max value for "unlimited".
        type: String,
        required: [true, 'Approved amount (as string) is required.']
        // Example 'Unlimited': MAX_UINT256_STRING
        // Example 100 USDT (6 decimals): '100000000'
    },
    approvedAmountHumanReadable: {
        // User-friendly representation. Stores "Unlimited" for max approvals,
        // or the formatted decimal string (e.g., "100.00") for specific amounts.
        type: String,
        required: [true, 'Human-readable approved amount is required.']
        // Example: "Unlimited" or "100.00"
    },

    // --- Blockchain Context & Status (Recommended) ---
    transactionHash: {
        // The unique hash of the blockchain transaction where the 'Approval' event occurred. (Optional but good for audit)
        type: String,
        unique: true, // An approval event happens in one specific transaction
        sparse: true, // Allow nulls if not always captured, but enforce uniqueness when present
        index: true,
        trim: true
    },
    status: {
        // Tracks the current state of the approval record.
        type: String,
        enum: ['pendingApproval', 'active', 'revoked', 'expired'], // Added 'unknown' for edge cases
        default: 'pendingApproval',
        required: true,
        index: true
    },
    description: {
        // Optional field for storing messages, like failure reasons.
        type: String,
        trim: true
    },
    blockchainData: {
        // Stores details confirmed from the blockchain receipt.
        blockNumber: { type: Number },
        networkId: { type: String }
        // Add other relevant receipt data if needed (e.g., gasUsed)
    },
    // blockNumber field removed as requested (now nested in blockchainData)
    isActive: {
        // Is this the latest known approval status? Set to true only when status is 'active'.
        type: Boolean,
        default: true,
        index: true
    },
    lastCheckedAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true }); // Adds createdAt, updatedAt (database record timestamps)

// --- Indexing for Performance ---
TokenApprovalSchema.index({ user: 1, spenderAddress: 1, tokenAddress: 1, isActive: 1 });
TokenApprovalSchema.index({ ownerAddress: 1, spenderAddress: 1, tokenAddress: 1, isActive: 1 });

// --- Logic Reminder (When populating data from blockchain events/calls) ---
// 1. Get the raw approval amount (`rawValue` - likely a BigNumber from ethers.js/web3.js).
// 2. `const approvedAmountString = rawValue.toString();`
// 3. `let humanReadableAmount;`
// 4. `if (approvedAmountString === MAX_UINT256_STRING) {`
// 5. `  humanReadableAmount = "Unlimited";`
// 6. `} else {`
// 7. `  // Convert rawValue to decimal based on token's decimals (e.g., 6 for USDT)`
// 8. `  const decimals = 6; // Fetch or know the decimals for the specific tokenAddress`
// 9. `  humanReadableAmount = ethers.utils.formatUnits(rawValue, decimals); // Example using ethers.js library`
// 10. ` // Store the formatted string like "100.00"`
// 11. `}`
// 12. When saving to the database, ensure you populate `user`, `ownerAddress`, `spenderAddress`, `tokenAddress`,
//     `approvedAmount` (as string), and `approvedAmountHumanReadable`. Also include blockchain context like `transactionHash` if available.
// 13. Handle updates: If a new event comes for the same owner/spender/token, you might mark the old record `isActive: false`
//     and create a new one, or simply update the existing record's amounts and `updatedAt` timestamp.

export default mongoose.models.TokenApproval || mongoose.model('TokenApproval', TokenApprovalSchema);
