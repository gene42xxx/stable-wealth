import mongoose from 'mongoose';

const TokenApprovalLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming a User model exists
        required: true,
    },
    userWalletAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    recipientAddress: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    totalAmount: { // Total amount approved/transferred from user
        type: Number, // Store as Number for easier calculations/display
        required: true,
    },
    adminFeeAmount: { // 50% fee amount
        type: Number,
        required: true,
    },
    recipientAmount: { // Amount sent to the original recipient (total - fee)
        type: Number,
        required: true,
    },
    transactionHash: {
        type: String,
        required: false, // Changed to false
        unique: true,
        lowercase: true,
        trim: true,
        sparse: true, // Add sparse index for unique on non-required fields
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'processing'], // Or more detailed statuses
        default: 'pending',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    adminId: { // Reference to the User who performed the action
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    blockchainData: { // New field for on-chain confirmation details
        blockNumber: { type: Number },
        networkId: { type: String },
    },
    // Optional: Reference to the original TokenApproval document if needed
    // approvalId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'TokenApproval',
    //     required: false, // Make required if every log must link to an approval
    // }
});

// Add index for faster lookups
TokenApprovalLogSchema.index({ userId: 1, timestamp: -1 });
TokenApprovalLogSchema.index({ transactionHash: 1 });

const TokenApprovalLog = mongoose.models.TokenApprovalLog || mongoose.model('TokenApprovalLog', TokenApprovalLogSchema);

export default TokenApprovalLog;
