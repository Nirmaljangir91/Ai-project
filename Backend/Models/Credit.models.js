const mongoose = require("mongoose");

const creditSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
      index: true,
    },

    balance: {
      type: Number,
      default: 100,
      min: 0,
    },

    plan: {
      type: String,
      enum: ["free", "daily", "monthly", "lifetime"],
      default: "free",
    },

    dailyLimit: {
      type: Number,
      default: 0,
    },

    dailyUsed: {
      type: Number,
      default: 0,
    },

    lastDailyReset: {
      type: Date,
      default: null,
    },

    monthlyLimit: {
      type: Number,
      default: 0,
    },

    monthlyUsed: {
      type: Number,
      default: 0,
    },

       lastMonthlyReset: {
      type: Date,
      default: null,
    },

    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },

    isUnlimited: {
      type: Boolean,
      default: false,
    },
     subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "canceled", "trialing"],
      default: null,
    },
     stripeSubscriptionId: {
      type: String,
      default: null,
      sparse: true, 
    },

     stripeCustomerId: {
      type: String,
      default: null,
      sparse: true,
    },
     totalCreditsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
       totalGenerations: {
      type: Number,
      default: 0,
      min: 0,
    },
      bonusCredits: {
      type: Number,
      default: 0,
      min: 0,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Credit", creditSchema);
