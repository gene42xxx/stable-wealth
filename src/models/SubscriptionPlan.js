import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema({

  name: {
    type: String,
    required: [true, 'Please provide a plan name'],
    unique: true
  },
  level: {
    type: Number,
    required: [true, 'Please provide a plan level']
  },
  weeklyRequiredAmount: {
    type: Number,
    required: [true, 'Please provide weekly required amount']
  },
  profitRateDaily: {
    type: Number,
    required: [true, 'Please provide daily profit rate percentage']
  },
  bonusRateThresholds: [{
    threshold: Number, // Additional balance threshold
    rate: Number       // Bonus profit rate
  }],
  features: [String],
  withdrawalConditions: {
    minWeeks: {
      type: Number,
      default: 4
    },
    penalties: [{
      weekRange: {
        min: Number,
        max: Number
      },
      penaltyPercentage: Number
    }]
  },
  creatorAdmin: {
    // Stores the _id of the User (with role 'admin') who created this plan
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model
    required: [true, 'A plan must be linked to a creator admin.'],
    index: true // Index for efficient querying of plans by creator
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
