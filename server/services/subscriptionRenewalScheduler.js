const cron = require('node-cron');
const logger = require('../utils/logger');
const SubscriptionManagementService = require('./subscriptionManagementService');

/* * 
* Subscription renewal scheduled task service 
* Responsible for handling automatic renewal and regular checks of expired subscriptions */
class SubscriptionRenewalScheduler {
    constructor(db) {
        this.subscriptionManagementService = new SubscriptionManagementService(db);
        this.isRunning = false;
    }

    /* * 
* Start scheduled tasks */
    start() {
        if (this.isRunning) {
            logger.warn('Scheduler service is already running');
            return;
        }

        // Automatic renewal and expiration processing are performed at 2 a.m. every day
        this.dailyTask = cron.schedule('0 2 * * *', async () => {
            logger.info('Starting daily subscription maintenance...');
            await this.runDailyMaintenance();
        }, {
            scheduled: false,
            timezone: "Asia/Shanghai" // Time zone can be adjusted as needed
        });

        // Start task
        this.dailyTask.start();
        this.isRunning = true;
        
        logger.info('Scheduler service started - Daily maintenance scheduled for 2:00 AM');
    }

    /* * 
* Stop scheduled tasks */
    stop() {
        if (this.dailyTask) {
            this.dailyTask.stop();
            this.dailyTask.destroy();
        }
        this.isRunning = false;
        logger.info('Scheduler service stopped');
    }

    /* * 
* Perform routine maintenance tasks */
    async runDailyMaintenance() {
        try {
            logger.info('Running daily subscription maintenance...');

            // Handle automatic renewal
            const autoRenewalResult = await this.subscriptionManagementService.processAutoRenewals();
            
            // Handle expired subscriptions
            const expiredResult = await this.subscriptionManagementService.processExpiredSubscriptions();

            // Record results
            const totalProcessed = autoRenewalResult.processed + expiredResult.processed;
            const totalErrors = autoRenewalResult.errors + expiredResult.errors;

            logger.info(`Daily maintenance completed: ${totalProcessed} subscriptions processed, ${totalErrors} errors`);

            if (autoRenewalResult.processed > 0) {
                logger.info(`Auto-renewed ${autoRenewalResult.processed} subscription(s)`);
            }
            if (expiredResult.processed > 0) {
                logger.info(`Cancelled ${expiredResult.processed} expired subscription(s)`);
            }

            return {
                success: true,
                autoRenewalResult,
                expiredResult,
                totalProcessed,
                totalErrors
            };

        } catch (error) {
            logger.error('Error during daily maintenance:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /* * 
* Manually trigger maintenance tasks (for testing or emergencies) */
    async runMaintenanceNow() {
        logger.info('Manual maintenance triggered');
        return await this.runDailyMaintenance();
    }

    /* * 
* Get scheduled task status */
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextRun: this.dailyTask ? this.dailyTask.nextDate() : null
        };
    }
}

module.exports = SubscriptionRenewalScheduler;
