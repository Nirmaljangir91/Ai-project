const cron = require('node-cron');
const {
  resetDailyCredits,
  resetMonthlyCredits
} = require('../services/credit.service');

/**
 * DAILY RESET
 * Runs every day at 12:00 AM
 */
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Starting daily credit reset...');
  await resetDailyCredits();
});

/**
 * MONTHLY RESET
 * Runs on the 1st of every month at 12:05 AM
 */
cron.schedule('5 0 1 * *', async () => {
  console.log('[CRON] Starting monthly credit reset...');
  await resetMonthlyCredits();
});
