import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    index: true // Add index for email
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  createdUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true // Add index for createdUsers
  }],
  walletAddress: {
    type: String,
  },
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    index: true // Add index for name
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super-admin'],
    default: 'user',
    index: true // Add index for role
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
    index: true // Add index for status
  },
  referredByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: function() { // Requirement handled by referral code logic now
    //   return this.role === 'user';
    // }
    index: true // Add index for referredByAdmin
  },
  canWithdraw: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    index: true // Add index for subscriptionPlan
  },
  // realUsdtBalance removed - use live contract balance
  fakeProfits: {
    type: Number,
    default: 0
  },
  weeklyDeposits: [{
    week: Number,
    amount: Number,
    date: Date,
    completed: Boolean,
  }],
  botActive: {
    type: Boolean,
    default: false
  },
  lastBalanceCheck: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});




// Match password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate current week based on subscription start
UserSchema.methods.getCurrentWeek = function() {
  if (!this.subscriptionStartDate) return 0;
  
  const diffTime = Math.abs(new Date() - this.subscriptionStartDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
