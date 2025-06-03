import mongoose from 'mongoose';

const PayoutLogSchema = new mongoose.Schema({
  adminId: { // Renamed from processedBy - Admin user who initiated payout
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userId: { // The user whose balance is being paid out
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipientAddress: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['initiated', 'pending', 'processing', 'completed', 'failed'],
    default: 'initiated',
  },
  transactionHash: {
    type: String,
  },
  blockchainData: { // Add blockchain confirmation details
    blockNumber: { type: Number },
    networkId: { type: String }
  },
  errorMessage: { // Optional field to store failure reasons
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
PayoutLogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


export default mongoose.models.PayoutLog || mongoose.model('PayoutLog', PayoutLogSchema);
