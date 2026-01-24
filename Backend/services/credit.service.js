const Credit = require("../Models/Credit.models.js");

async function resetDailyCredits() {
  const today = new Date();
  try {
    const result = await Credit.updateMany(
      {
        plan: { $in: ["free", "daily", "monthly"] },
        isUnlimited: false,
        $or: [
          {
            lastDailyReset: null,
          },
          {
            lastDailyReset: { $lt: new Date(today.setHours(0, 0, 0, 0)) },
          },
        ],
      },
      {
        $set: {
          dailyUsed: 0,
          lastDailyReset: new Date(),
        },
      },
    );
    console.log(
      `[CRON] Daily credit reset | Modified: ${result.modifiedCount} `,
    );
  } catch (error) {
    console.error("[CRON] Error resetting daily credits:", error);
  }
}

async function resetMonthlyCredits() {
  try {
    const result = await Credit.updateMany(
      {
        plan: "monthly",
        isUnlimited: false,
        $or: [
          { lastMonthlyReset: null },
          {
            lastMonthlyReset: {
              $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        ],
      },
      {
        $set: {
          monthlyUsed: 0,
          lastMonthlyReset: new Date(),
        },
      },
    );

    console.log(
      `[CRON] Monthly credits reset | Modified: ${result.modifiedCount}`,
    );
  } catch (error) {
    console.error("[CRON] Monthly reset failed:", error);
  }
}

module.exports = {
  resetDailyCredits,
  resetMonthlyCredits,
};
