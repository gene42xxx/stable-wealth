import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'user_update', 'user_create', 'user_delete', 'settings_change', 'subscription_update', 'PLAN_SUBSCRIBE', 'DEPOSIT_REQUESTED', 'WITHDRAWAL_REQUESTED']
  },
  details: {
    type: String,
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  // ipAddress: String, // Removed
  // userAgent: String // Removed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add 24-hour TTL index for auto expiration
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); 

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

export default Activity;
