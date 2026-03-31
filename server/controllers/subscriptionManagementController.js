const SubscriptionManagementService = require('../services/subscriptionManagementService');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleQueryResult, success, validationError } = require('../utils/responseHelper');
const { createValidator } = require('../utils/validator');

/* * 
* Subscription management controller 
* Handle HTTP requests such as subscription renewal and expiration processing */
class SubscriptionManagementController {
    constructor(db) {
        this.subscriptionManagementService = new SubscriptionManagementService(db);
    }

    /* * 
* Handle automatic renewal */
    processAutoRenewals = asyncHandler(async (req, res) => {
        const result = await this.subscriptionManagementService.processAutoRenewals();
        success(res, result, result.message);
    });

    /* * 
* Handle expired manual renewal subscriptions */
    processExpiredSubscriptions = asyncHandler(async (req, res) => {
        const result = await this.subscriptionManagementService.processExpiredSubscriptions();
        success(res, result, result.message);
    });

    /* * 
* Manual renewal subscription */
    manualRenewSubscription = asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Verify subscription ID
        const validator = createValidator();
        validator
            .required(id, 'id')
            .integer(id, 'id')
            .range(id, 'id', 1, Infinity);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.subscriptionManagementService.manualRenewSubscription(parseInt(id));
        success(res, result, result.message);
    });

    /* * 
* Reactivate canceled subscription */
    reactivateSubscription = asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Verify subscription ID
        const validator = createValidator();
        validator
            .required(id, 'id')
            .integer(id, 'id')
            .range(id, 'id', 1, Infinity);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.subscriptionManagementService.reactivateSubscription(parseInt(id));
        success(res, result, result.message);
    });

    /* * 
*Reset all subscription data */
    resetAllSubscriptions = asyncHandler(async (req, res) => {
        // Optional: Add a confirmation parameter to prevent accidental deletion
        const { confirm } = req.body;

        if (confirm !== 'DELETE_ALL_SUBSCRIPTIONS') {
            return validationError(res, 'To confirm deletion, include "confirm": "DELETE_ALL_SUBSCRIPTIONS" in request body');
        }

        const result = await this.subscriptionManagementService.resetAllSubscriptions();
        success(res, result, result.message);
    });

    /* * 
* Batch processing of subscription management tasks */
    batchProcessSubscriptions = asyncHandler(async (req, res) => {
        const { 
            processAutoRenewals = false, 
            processExpired = false,
            dryRun = false 
        } = req.body;

        // Validation parameters
        const validator = createValidator();
        validator
            .boolean(processAutoRenewals, 'processAutoRenewals')
            .boolean(processExpired, 'processExpired')
            .boolean(dryRun, 'dryRun');

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        if (!processAutoRenewals && !processExpired) {
            return validationError(res, 'At least one of processAutoRenewals or processExpired must be true');
        }

        const results = {
            dryRun,
            autoRenewals: null,
            expiredSubscriptions: null,
            summary: {
                totalProcessed: 0,
                totalErrors: 0
            }
        };

        // If it is a trial run, only the data statistics to be processed will be returned.
        if (dryRun) {
            // Get the subscription statistics to be processed
            if (processAutoRenewals) {
                // Here you can add logic to obtain the number of subscriptions to be renewed
                results.autoRenewals = { willProcess: 'Use actual service to get count' };
            }

            if (processExpired) {
                // Here you can add logic to get the number of expired subscriptions
                results.expiredSubscriptions = { willProcess: 'Use actual service to get count' };
            }

            return success(res, results, 'Dry run completed - no actual changes made');
        }

        // actual processing
        if (processAutoRenewals) {
            results.autoRenewals = await this.subscriptionManagementService.processAutoRenewals();
            results.summary.totalProcessed += results.autoRenewals.processed;
            results.summary.totalErrors += results.autoRenewals.errors;
        }

        if (processExpired) {
            results.expiredSubscriptions = await this.subscriptionManagementService.processExpiredSubscriptions();
            results.summary.totalProcessed += results.expiredSubscriptions.processed;
            results.summary.totalErrors += results.expiredSubscriptions.errors;
        }

        success(res, results, `Batch processing completed: ${results.summary.totalProcessed} processed, ${results.summary.totalErrors} errors`);
    });

    /* * 
* Get subscription management statistics */
    getSubscriptionManagementStats = asyncHandler(async (req, res) => {
        // Get subscription statistics for various statuses
        const activeAutoRenewal = this.subscriptionManagementService.count({
            status: 'active',
            renewal_type: 'auto'
        });

        const activeManualRenewal = this.subscriptionManagementService.count({
            status: 'active',
            renewal_type: 'manual'
        });

        const cancelledSubscriptions = this.subscriptionManagementService.count({
            status: 'cancelled'
        });

        const trialSubscriptions = this.subscriptionManagementService.count({
            status: 'trial'
        });

        // Get expiring subscriptions (within the next 7 days)
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const todayStr = today.toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        // You need to use raw SQL query here because BaseRepository's findAll does not support date range query
        const upcomingRenewalsStmt = this.subscriptionManagementService.db.prepare(`
            SELECT COUNT(*) as count 
            FROM subscriptions 
            WHERE status = 'active' 
            AND next_billing_date BETWEEN ? AND ?
        `);
        const upcomingRenewals = upcomingRenewalsStmt.get(todayStr, nextWeekStr).count;

        // Get expired manual renewal subscription
        const overdueStmt = this.subscriptionManagementService.db.prepare(`
            SELECT COUNT(*) as count 
            FROM subscriptions 
            WHERE status = 'active' 
            AND renewal_type = 'manual'
            AND next_billing_date < ?
        `);
        const overdueSubscriptions = overdueStmt.get(todayStr).count;

        const stats = {
            subscriptionCounts: {
                activeAutoRenewal,
                activeManualRenewal,
                cancelled: cancelledSubscriptions,
                trial: trialSubscriptions,
                total: activeAutoRenewal + activeManualRenewal + cancelledSubscriptions + trialSubscriptions
            },
            upcomingActions: {
                upcomingRenewals,
                overdueSubscriptions
            },
            healthMetrics: {
                autoRenewalRate: activeAutoRenewal + activeManualRenewal > 0 
                    ? Math.round((activeAutoRenewal / (activeAutoRenewal + activeManualRenewal)) * 100) 
                    : 0,
                activeRate: activeAutoRenewal + activeManualRenewal + cancelledSubscriptions + trialSubscriptions > 0
                    ? Math.round(((activeAutoRenewal + activeManualRenewal) / (activeAutoRenewal + activeManualRenewal + cancelledSubscriptions + trialSubscriptions)) * 100)
                    : 0
            },
            lastUpdated: new Date().toISOString()
        };

        handleQueryResult(res, stats, 'Subscription management statistics');
    });

    /* * 
* Preview expiring subscriptions */
    previewUpcomingRenewals = asyncHandler(async (req, res) => {
        const { days = 7 } = req.query;

        // Validation days parameter
        const validator = createValidator();
        validator
            .integer(days, 'days')
            .range(days, 'days', 1, 365);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const today = new Date();
        const futureDate = new Date(today.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
        const todayStr = today.toISOString().split('T')[0];
        const futureDateStr = futureDate.toISOString().split('T')[0];

        // Get expiring subscriptions
        const upcomingStmt = this.subscriptionManagementService.db.prepare(`
            SELECT * FROM subscriptions 
            WHERE status = 'active' 
            AND next_billing_date BETWEEN ? AND ?
            ORDER BY next_billing_date ASC
        `);
        const upcomingSubscriptions = upcomingStmt.all(todayStr, futureDateStr);

        // Classification processing
        const autoRenewals = upcomingSubscriptions.filter(sub => sub.renewal_type === 'auto');
        const manualRenewals = upcomingSubscriptions.filter(sub => sub.renewal_type === 'manual');

        const result = {
            period: {
                from: todayStr,
                to: futureDateStr,
                days: parseInt(days)
            },
            summary: {
                total: upcomingSubscriptions.length,
                autoRenewals: autoRenewals.length,
                manualRenewals: manualRenewals.length
            },
            subscriptions: {
                autoRenewals: autoRenewals.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    amount: sub.amount,
                    currency: sub.currency,
                    nextBillingDate: sub.next_billing_date,
                    billingCycle: sub.billing_cycle
                })),
                manualRenewals: manualRenewals.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    amount: sub.amount,
                    currency: sub.currency,
                    nextBillingDate: sub.next_billing_date,
                    billingCycle: sub.billing_cycle
                }))
            }
        };

        handleQueryResult(res, result, 'Upcoming renewals preview');
    });
}

module.exports = SubscriptionManagementController;
