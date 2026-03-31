const BaseRepository = require('../utils/BaseRepository');
const { calculateNextBillingDate, getTodayString, isDateDueOrOverdue } = require('../utils/dateUtils');
const logger = require('../utils/logger');
const NotificationService = require('./notificationService');

/* * 
* Subscription management services 
* Process business logic such as subscription renewal and expiration processing */
class SubscriptionManagementService extends BaseRepository {
    constructor(db) {
        super(db, 'subscriptions');
        this.notificationService = new NotificationService(this.db);
    }

    /* * 
* Handle automatic renewal 
* @returns {Object} processing results */
    async processAutoRenewals() {
        try {
            // Get all active auto-renewable subscriptions
            const activeAutoRenewalSubscriptions = this.findAll({
                filters: { status: 'active', renewal_type: 'auto' }
            });

            let processed = 0;
            let errors = 0;
            const renewedSubscriptions = [];

            // Check whether each subscription needs to be renewed
            for (const subscription of activeAutoRenewalSubscriptions) {
                try {
                    if (isDateDueOrOverdue(subscription.next_billing_date)) {
                        const renewalResult = await this._renewSubscription(subscription, 'auto');
                        if (renewalResult.success) {
                            processed++;
                            renewedSubscriptions.push(renewalResult.data);
                        } else {
                            errors++;
                            // Send renewal failure notification (triggered asynchronously, does not block batch processing)
                            this.notificationService
                                .sendNotification({
                                    subscriptionId: subscription.id,
                                    notificationType: 'renewal_failure'
                                })
                                .then(() => {
                                    logger.info(`Renewal failure notification dispatched for subscription ${subscription.id}`);
                                })
                                .catch((notificationError) => {
                                    logger.error(`Failed to send renewal failure notification for subscription ${subscription.id}:`, notificationError.message);
                                });
                        }
                    }
                } catch (error) {
                    logger.error(`Error processing renewal for subscription ${subscription.id}:`, error.message);
                    errors++;
                }
            }

            const result = {
                message: `Auto renewal complete: ${processed} processed, ${errors} errors`,
                processed,
                errors,
                renewedSubscriptions
            };

            logger.info(result.message);
            return result;
        } catch (error) {
            logger.error('Failed to process auto renewals:', error.message);
            throw error;
        }
    }

    /* * 
* Handle expired manual renewal subscriptions 
* @returns {Object} processing results */
    async processExpiredSubscriptions() {
        try {
            // Get all active manually renewed subscriptions
            const activeManualSubscriptions = this.findAll({
                filters: { status: 'active', renewal_type: 'manual' }
            });

            let processed = 0;
            let errors = 0;
            const expiredSubscriptions = [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if each manual subscription has expired
            for (const subscription of activeManualSubscriptions) {
                try {
                    const billingDate = new Date(subscription.next_billing_date);
                    billingDate.setHours(0, 0, 0, 0);

                    // If billing date has passed, mark as canceled
                    if (billingDate < today) {
                        const result = this.update(subscription.id, {
                            status: 'cancelled',
                            updated_at: new Date().toISOString()
                        });

                        if (result.changes > 0) {
                            processed++;
                            expiredSubscriptions.push({
                                id: subscription.id,
                                name: subscription.name,
                                expiredDate: subscription.next_billing_date
                            });
                        } else {
                            errors++;
                        }
                    }
                } catch (error) {
                    logger.error(`Error processing expiration for subscription ${subscription.id}:`, error.message);
                    errors++;
                }
            }

            const result = {
                message: `Expired subscriptions processed: ${processed} expired, ${errors} errors`,
                processed,
                errors,
                expiredSubscriptions
            };

            logger.info(result.message);
            return result;
        } catch (error) {
            logger.error('Failed to process expired subscriptions:', error.message);
            throw error;
        }
    }

    /* * 
* Manual renewal subscription 
* @param {number} subscriptionId - subscription ID 
* @returns {Object} renewal result */
    async manualRenewSubscription(subscriptionId) {
        try {
            // Get subscription information
            const subscription = this.findById(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            if (subscription.renewal_type !== 'manual') {
                throw new Error('Only manual renewal subscriptions can be manually renewed');
            }

            const renewalResult = await this._renewSubscription(subscription, 'manual');
            
            if (renewalResult.success) {
                logger.info(`Manual renewal completed for subscription ${subscriptionId}`);
                return {
                    message: 'Subscription renewed successfully',
                    renewalData: renewalResult.data
                };
            } else {
                // Send manual renewal failure notification (triggered asynchronously, without blocking the request)
                this.notificationService
                    .sendNotification({
                        subscriptionId: subscription.id,
                        notificationType: 'renewal_failure'
                    })
                    .then(() => {
                        logger.info(`Manual renewal failure notification dispatched for subscription ${subscriptionId}`);
                    })
                    .catch((notificationError) => {
                        logger.error(`Failed to send manual renewal failure notification for subscription ${subscriptionId}:`, notificationError.message);
                    });
                throw new Error('Failed to update subscription');
            }
        } catch (error) {
            logger.error(`Failed to manually renew subscription ${subscriptionId}:`, error.message);
            throw error;
        }
    }

    /* * 
* Reactivate canceled subscription 
* @param {number} subscriptionId - subscription ID 
* @returns {Object} reactivation results */
    async reactivateSubscription(subscriptionId) {
        try {
            // Get subscription information
            const subscription = this.findById(subscriptionId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            if (subscription.status !== 'cancelled') {
                throw new Error('Only cancelled subscriptions can be reactivated');
            }

            const todayStr = getTodayString();
            const newNextBillingStr = calculateNextBillingDate(todayStr, subscription.billing_cycle);

            // Use transactions to ensure data consistency
            const reactivationResult = this.transaction(() => {
                // Update subscription status
                const updateResult = this.update(subscriptionId, {
                    last_billing_date: todayStr,
                    next_billing_date: newNextBillingStr,
                    status: 'active',
                    updated_at: new Date().toISOString()
                });

                if (updateResult.changes > 0) {
                    // Create payment history
                    this._createPaymentRecord(subscription, {
                        payment_date: todayStr,
                        billing_period_start: todayStr,
                        billing_period_end: newNextBillingStr,
                        notes: 'Subscription reactivation payment'
                    });
                    return true;
                }
                return false;
            });

            if (reactivationResult) {
                const result = {
                    message: 'Subscription reactivated successfully',
                    reactivationData: {
                        id: subscription.id,
                        name: subscription.name,
                        newLastBilling: todayStr,
                        newNextBilling: newNextBillingStr,
                        status: 'active'
                    }
                };

                logger.info(`Subscription ${subscriptionId} reactivated successfully`);
                return result;
            } else {
                throw new Error('Failed to reactivate subscription');
            }
        } catch (error) {
            logger.error(`Failed to reactivate subscription ${subscriptionId}:`, error.message);
            throw error;
        }
    }

    /* * 
*Reset all subscription data 
* @returns {Object} reset result */
    async resetAllSubscriptions() {
        try {
            // Use transactions to ensure data consistency
            const resetResult = this.transaction(() => {
                // Explicitly drop the payment_history table (make sure to clean)
                const paymentHistoryResult = this.db.prepare('DELETE FROM payment_history').run();

                // Delete all subscriptions
                const subscriptionResult = this.db.prepare('DELETE FROM subscriptions').run();

                // Explicitly clear the monthly_expenses table
                const monthlyExpensesResult = this.db.prepare('DELETE FROM monthly_expenses').run();

                return {
                    subscriptions: subscriptionResult.changes,
                    paymentHistory: paymentHistoryResult.changes,
                    monthlyExpenses: monthlyExpensesResult.changes
                };
            });

            const result = {
                message: 'All subscriptions and related data have been deleted.',
                deletedCounts: resetResult
            };

            logger.info(`Reset completed: ${resetResult.subscriptions} subscriptions, ${resetResult.monthlyExpenses} monthly expense records deleted`);
            return result;
        } catch (error) {
            logger.error('Failed to reset subscriptions:', error.message);
            throw error;
        }
    }

    /* * 
* Renew subscription (internal method) 
* @private 
* @param {Object} subscription - subscription object 
* @param {string} renewalType - renewal type ('auto' | 'manual') 
* @returns {Object} renewal result */
    async _renewSubscription(subscription, renewalType) {
        const todayStr = getTodayString();
        
        // Calculate new next billing date
        let baseDate;
        if (renewalType === 'manual') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentNextBilling = new Date(subscription.next_billing_date);
            currentNextBilling.setHours(0, 0, 0, 0);
            
            // If the renewal is made before the expiry date, it will be calculated from the original expiry date; if it is renewed after the expiration date, it will be calculated from today's date.
            baseDate = currentNextBilling >= today ? subscription.next_billing_date : todayStr;
        } else {
            baseDate = subscription.next_billing_date;
        }
        
        const newNextBillingStr = calculateNextBillingDate(baseDate, subscription.billing_cycle);

        try {
            // Use transactions to ensure data consistency
            const renewalResult = this.transaction(() => {
                // Update subscription
                const updateResult = this.update(subscription.id, {
                    last_billing_date: todayStr,
                    next_billing_date: newNextBillingStr,
                    status: 'active', // Make sure the status is active
                    updated_at: new Date().toISOString()
                });

                if (updateResult.changes > 0) {
                    // Create payment history
                    this._createPaymentRecord(subscription, {
                        payment_date: todayStr,
                        billing_period_start: subscription.next_billing_date,
                        billing_period_end: newNextBillingStr,
                        notes: `${renewalType === 'auto' ? 'Auto' : 'Manual'} renewal payment`
                    });
                    return true;
                }
                return false;
            });

            if (renewalResult) {
                const renewalData = {
                    id: subscription.id,
                    name: subscription.name,
                    oldNextBilling: subscription.next_billing_date,
                    newLastBilling: todayStr,
                    newNextBilling: newNextBillingStr,
                    renewedEarly: renewalType === 'manual' && new Date(subscription.next_billing_date) >= new Date()
                };

                // Send renewal success notification (triggered asynchronously, without blocking the request)
                this.notificationService
                    .sendNotification({
                        subscriptionId: subscription.id,
                        notificationType: 'renewal_success'
                    })
                    .then(() => {
                        logger.info(`Renewal success notification dispatched for subscription ${subscription.id}`);
                    })
                    .catch((notificationError) => {
                        logger.error(
                            `Failed to send renewal success notification for subscription ${subscription.id}:`,
                            notificationError.message
                        );
                        // Does not affect the renewal result, only errors are recorded
                    });

                return {
                    success: true,
                    data: renewalData
                };
            } else {
                return { success: false };
            }
        } catch (error) {
            logger.error(`Failed to renew subscription ${subscription.id}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /* * 
* Create payment record (internal method) 
* @private 
* @param {Object} subscription - subscription object 
* @param {Object} paymentData - payment data */
    _createPaymentRecord(subscription, paymentData) {
        const paymentStmt = this.db.prepare(`
            INSERT INTO payment_history (subscription_id, payment_date, amount_paid, currency, billing_period_start, billing_period_end, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        paymentStmt.run(
            subscription.id,
            paymentData.payment_date,
            subscription.amount,
            subscription.currency,
            paymentData.billing_period_start,
            paymentData.billing_period_end,
            'succeeded',
            paymentData.notes
        );
    }
}

module.exports = SubscriptionManagementService;
