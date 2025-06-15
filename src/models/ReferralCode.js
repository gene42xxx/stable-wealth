import { stat } from 'fs';
import mongoose from 'mongoose';
const expiresIn = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

const ReferralCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true
  },
  targetRole: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    expires: expiresIn // TTL index for 48 hours
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ReferralCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: expiresIn }); // 1 day TTL index

export default mongoose.models.ReferralCode || mongoose.model('ReferralCode', ReferralCodeSchema);
