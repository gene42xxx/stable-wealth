import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'profit', 'fee', 'subscription'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USDT'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'pending_signature', 'processing'],
    default: 'pending'
  },
  txHash: {
    type: String
  },
  description: String,
  // For tracking if transaction affects real or fake balance
  balanceType: {
    type: String,
    enum: ['real', 'fake'],
    required: true
  },
  // Reference to a smart contract transaction
  blockchainData: {
    networkId: String,
    blockNumber: Number,
    confirmations: Number,
    networkFee: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
