const BaseRepository = require('../utils/BaseRepository');
const { calculateLastBillingDate, calculateNextBillingDate, calculateNextBillingDateFromStart, getTodayString } = require('../utils/dateUtils');
const MonthlyCategorySummaryService = require('./monthlyCategorySummaryService');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');
const { NotFoundError } = require('../middleware/errorHandler');

class SubscriptionService extends BaseRepository {
    constructor(db) {
        super(db, 'subscriptions');
        this.monthlyCategorySummaryService = new MonthlyCategorySummaryService(db.name);
        this.notificationService = new NotificationService(db);
    }

    /* * 
* Get all subscriptions (including associated category and payment method data) */
    async getAllSubscriptions() {
        const query = `
            SELECT
                s.*,
                c.id as category_join_id,
                c.value as category_join_value,
                c.label as category_join_label,
                pm.id as payment_method_join_id,
                pm.value as payment_method_join_value,
                pm.label as payment_method_join_label
            FROM subscriptions s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
            ORDER BY s.name ASC
        `;

        const stmt = this.db.prepare(query);
        const results = stmt.all();

        // Convert data formats and nest related data into objects
        return results.map(row => ({
            id: row.id,
            name: row.name,
            plan: row.plan,
            billing_cycle: row.billing_cycle,
            next_billing_date: row.next_billing_date,
            last_billing_date: row.last_billing_date,
            amount: row.amount,
            currency: row.currency,
            payment_method_id: row.payment_method_id,
            start_date: row.start_date,
            status: row.status,
            category_id: row.category_id,
            renewal_type: row.renewal_type,
            notes: row.notes,
            website: row.website,
            created_at: row.created_at,
            updated_at: row.updated_at,
            // Nested related objects
            category: row.category_join_id ? {
                id: row.category_join_id,
                value: row.category_join_value,
                label: row.category_join_label
            } : null,
            paymentMethod: row.payment_method_join_id ? {
                id: row.payment_method_join_id,
                value: row.payment_method_join_value,
                label: row.payment_method_join_label
            } : null
        }));
    }

    /* * 
* Get subscriptions based on ID (including associated category and payment method data) */
    async getSubscriptionById(id) {
        const query = `
            SELECT
                s.*,
                c.id as category_join_id,
                c.value as category_join_value,
                c.label as category_join_label,
                pm.id as payment_method_join_id,
                pm.value as payment_method_join_value,
                pm.label as payment_method_join_label
            FROM subscriptions s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
            WHERE s.id = ?
        `;

        const stmt = this.db.prepare(query);
        const row = stmt.get(id);

        if (!row) {
            return null;
        }

        // Convert data formats and nest related data into objects
        return {
            id: row.id,
            name: row.name,
            plan: row.plan,
            billing_cycle: row.billing_cycle,
            next_billing_date: row.next_billing_date,
            last_billing_date: row.last_billing_date,
            amount: row.amount,
            currency: row.currency,
            payment_method_id: row.payment_method_id,
            start_date: row.start_date,
            status: row.status,
            category_id: row.category_id,
            renewal_type: row.renewal_type,
            notes: row.notes,
            website: row.website,
            created_at: row.created_at,
            updated_at: row.updated_at,
            // Nested related objects
            category: row.category_join_id ? {
                id: row.category_join_id,
                value: row.category_join_value,
                label: row.category_join_label
            } : null,
            paymentMethod: row.payment_method_join_id ? {
                id: row.payment_method_join_id,
                value: row.payment_method_join_value,
                label: row.payment_method_join_label
            } : null
        };
    }

    /* * 
* Create new subscription */
    async createSubscription(subscriptionData) {
        const {
            name,
            plan,
            billing_cycle,
            next_billing_date,
            amount,
            currency,
            payment_method_id,
            start_date,
            status = 'active',
            category_id,
            renewal_type = 'manual',
            notes,
            website
        } = subscriptionData;

        // Calculate last_billing_date
        const last_billing_date = calculateLastBillingDate(
            next_billing_date, 
            start_date, 
            billing_cycle
        );

        const result = this.create({
            name,
            plan,
            billing_cycle,
            next_billing_date,
            last_billing_date,
            amount,
            currency,
            payment_method_id,
            start_date,
            status,
            category_id,
            renewal_type,
            notes,
            website
        });

        // Automatically generate payment history
        if (result.lastInsertRowid) {
            try {
                await this.generatePaymentHistory(result.lastInsertRowid, subscriptionData);
                logger.info(`Payment history generated for subscription ${result.lastInsertRowid}`);
            } catch (error) {
                logger.error(`Failed to generate payment history for subscription ${result.lastInsertRowid}:`, error.message);
            }
        }

        return result;
    }

    /* * 
* Create subscriptions in batches */
    async bulkCreateSubscriptions(subscriptionsData) {
        // Prepare subscription data for bulk insert
        const subscriptionRecords = subscriptionsData.map(subscriptionData => {
            const {
                name,
                plan,
                billing_cycle,
                next_billing_date,
                amount,
                currency,
                payment_method_id,
                start_date,
                status = 'active',
                category_id,
                renewal_type = 'manual',
                notes,
                website
            } = subscriptionData;

            // Calculate last_billing_date
            const last_billing_date = calculateLastBillingDate(
                next_billing_date, 
                start_date, 
                billing_cycle
            );

            return {
                name,
                plan,
                billing_cycle,
                next_billing_date,
                last_billing_date,
                amount,
                currency,
                payment_method_id,
                start_date,
                status,
                category_id,
                renewal_type,
                notes,
                website
            };
        });

        // Use synchronous bulk insert
        const results = this.createMany(subscriptionRecords);
        
        // Generate payment history for each created subscription (async, outside transaction)
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const subscriptionData = subscriptionsData[i];
            
            if (result.lastInsertRowid) {
                try {
                    await this.generatePaymentHistory(result.lastInsertRowid, subscriptionData);
                    logger.info(`Payment history generated for subscription ${result.lastInsertRowid}`);
                } catch (error) {
                    logger.error(`Failed to generate payment history for subscription ${result.lastInsertRowid}:`, error.message);
                }
            }
        }

        return results;
    }

    /* * 
* Update subscription */
    async updateSubscription(id, updateData) {
        // Check if the subscription exists
        const existingSubscription = this.findById(id);
        if (!existingSubscription) {
            throw new NotFoundError('Subscription');
        }

        // If the billing period or date is updated, recalculate the billing date
        if (updateData.billing_cycle || updateData.next_billing_date || updateData.start_date) {
            const billing_cycle = updateData.billing_cycle || existingSubscription.billing_cycle;
            const start_date = updateData.start_date || existingSubscription.start_date;

            // Determine next_billing_date: If the client explicitly provides it, the client shall prevail;
            // Otherwise when the billing cycle or start date changes, recalculate from start_date + billing_cycle.
            let next_billing_date;
            if (updateData.next_billing_date) {
                next_billing_date = updateData.next_billing_date;
            } else if (updateData.start_date || updateData.billing_cycle) {
                const currentDate = getTodayString();
                next_billing_date = calculateNextBillingDateFromStart(
                    start_date,
                    currentDate,
                    billing_cycle
                );
                updateData.next_billing_date = next_billing_date;
            } else {
                next_billing_date = existingSubscription.next_billing_date;
            }

            // Recalculate last_billing_date (based on final next_billing_date and start_date)
            updateData.last_billing_date = calculateLastBillingDate(
                next_billing_date,
                start_date,
                billing_cycle
            );
        }

        const result = this.update(id, updateData);

        // Regenerate payment history if key fields are updated
        const keyFields = ['amount', 'billing_cycle', 'start_date', 'status'];
        const hasKeyFieldUpdate = keyFields.some(field => updateData.hasOwnProperty(field));
        
        if (hasKeyFieldUpdate) {
            try {
                await this.regeneratePaymentHistory(id);
                logger.info(`Payment history regenerated for subscription ${id}`);
            } catch (error) {
                logger.error(`Failed to regenerate payment history for subscription ${id}:`, error.message);
            }
        }

        // Send subscription change notification (triggered asynchronously, without blocking requests)
        this.notificationService
            .sendNotification({
                subscriptionId: id,
                notificationType: 'subscription_change'
            })
            .then(() => {
                logger.info(`Subscription change notification dispatched for subscription ${id}`);
            })
            .catch((error) => {
                logger.error(
                    `Failed to send subscription change notification for subscription ${id}:`,
                    error.message
                );
            });

        return result;
    }

    /* * 
* Delete subscription */
    async deleteSubscription(id) {
        // Check if the subscription exists
        const existingSubscription = this.findById(id);
        if (!existingSubscription) {
            throw new NotFoundError('Subscription');
        }

        // Obtain the year and month information of the relevant payment history before deletion
        const paymentMonthsQuery = `
            SELECT DISTINCT 
                strftime('%Y', payment_date) as year,
                strftime('%m', payment_date) as month
            FROM payment_history
            WHERE subscription_id = ?
            AND status = 'succeeded'
        `;
        const paymentMonths = this.db.prepare(paymentMonthsQuery).all(id);

        // Delete a subscription (cascading deletion will automatically handle related payment_history and monthly_expenses)
        const result = this.delete(id);

        // Recalculate monthly subtotals for affected months
        if (paymentMonths.length > 0) {
            logger.info(`Recalculating monthly category summaries for ${paymentMonths.length} months after subscription deletion`);
            paymentMonths.forEach(({ year, month }) => {
                try {
                    this.monthlyCategorySummaryService.updateMonthlyCategorySummary(
                        parseInt(year), 
                        parseInt(month)
                    );
                } catch (error) {
                    logger.error(`Failed to update monthly category summary for ${year}-${month}:`, error.message);
                }
            });
        }

        logger.info(`Subscription deleted: ${existingSubscription.name} (ID: ${id}), related data cleaned up automatically`);
        return result;
    }

    /* * 
* Get subscription statistics */
    async getSubscriptionStats() {
        const totalQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                COUNT(CASE WHEN status = 'trial' THEN 1 END) as trial,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as total_active_amount,
                AVG(CASE WHEN status = 'active' THEN amount ELSE NULL END) as avg_active_amount
            FROM subscriptions
        `;

        const categoryQuery = `
            SELECT 
                category,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as total_amount
            FROM subscriptions
            GROUP BY category
            ORDER BY count DESC
        `;

        const billingCycleQuery = `
            SELECT 
                billing_cycle,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as total_amount
            FROM subscriptions
            GROUP BY billing_cycle
            ORDER BY count DESC
        `;

        const totalStats = this.db.prepare(totalQuery).get();
        const categoryStats = this.db.prepare(categoryQuery).all();
        const billingCycleStats = this.db.prepare(billingCycleQuery).all();

        return {
            total: totalStats,
            byCategory: categoryStats,
            byBillingCycle: billingCycleStats
        };
    }

    /* * 
* Get expiring subscriptions */
    async getUpcomingRenewals(days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const futureDateString = futureDate.toISOString().split('T')[0];

        const query = `
            SELECT * FROM subscriptions
            WHERE status = 'active' 
            AND next_billing_date <= ?
            AND next_billing_date >= ?
            ORDER BY next_billing_date ASC
        `;

        const stmt = this.db.prepare(query);
        return stmt.all(futureDateString, getTodayString());
    }

    /* * 
* Get expired subscriptions */
    async getExpiredSubscriptions() {
        const query = `
            SELECT * FROM subscriptions
            WHERE status = 'active' 
            AND next_billing_date < ?
            ORDER BY next_billing_date ASC
        `;

        const stmt = this.db.prepare(query);
        return stmt.all(getTodayString());
    }

    /* * 
* Get subscriptions by category */
    async getSubscriptionsByCategory(category) {
        return this.findAll({ 
            filters: { category },
            orderBy: 'name ASC'
        });
    }

    /* * 
* Get subscriptions by status */
    async getSubscriptionsByStatus(status) {
        return this.findAll({ 
            filters: { status },
            orderBy: 'name ASC'
        });
    }

    /* * 
* Search subscriptions */
    async searchSubscriptions(query) {
        const searchQuery = `
            SELECT * FROM subscriptions
            WHERE name LIKE ? OR plan LIKE ? OR notes LIKE ?
            ORDER BY name ASC
        `;

        const searchTerm = `%${query}%`;
        const stmt = this.db.prepare(searchQuery);
        return stmt.all(searchTerm, searchTerm, searchTerm);
    }

    /* * 
* Get the payment history of a subscription */
    async getSubscriptionPaymentHistory(subscriptionId) {
        const query = `
            SELECT * FROM payment_history
            WHERE subscription_id = ?
            ORDER BY payment_date DESC
        `;

        const stmt = this.db.prepare(query);
        return stmt.all(subscriptionId);
    }

    /* * 
*Reset all subscription data */
    async resetAllSubscriptions() {
        return this.transaction(() => {
            // Delete all subscriptions (cascading deletes will process related data)
            const subscriptionResult = this.db.prepare('DELETE FROM subscriptions').run();

            // Explicitly clean up the monthly subtotal table
            const monthlyCategorySummaryResult = this.db.prepare('DELETE FROM monthly_category_summary').run();

            logger.info(`Reset completed: ${subscriptionResult.changes} subscriptions, ${monthlyCategorySummaryResult.changes} monthly category summaries deleted`);

            return {
                subscriptions: subscriptionResult.changes,
                monthlyCategorySummary: monthlyCategorySummaryResult.changes,
                message: 'All subscription data has been reset successfully'
            };
        });
    }

    /* * 
* Generate payment history */
    async generatePaymentHistory(subscriptionId) {
        logger.info(`Generating payment history for subscription ${subscriptionId}`);

        try {
            // Get complete subscription information
            const fullSubscription = this.findById(subscriptionId);
            if (!fullSubscription) {
                throw new Error(`Subscription ${subscriptionId} not found`);
            }

            // Generate payment records from start date to now
            const payments = this._generateHistoricalPayments(fullSubscription);

            // Insert payment record
            const insertPayment = this.db.prepare(`
                INSERT INTO payment_history (
                    subscription_id, payment_date, amount_paid, currency,
                    billing_period_start, billing_period_end, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const payment of payments) {
                insertPayment.run(
                    subscriptionId,
                    payment.payment_date,
                    fullSubscription.amount,
                    fullSubscription.currency,
                    payment.billing_period_start,
                    payment.billing_period_end,
                    'succeeded',
                    'Auto-generated from subscription data'
                );
            }

            logger.info(`Generated ${payments.length} payment history records for subscription ${subscriptionId}`);

            // Trigger monthly subtotal recalculation
            if (this.monthlyCategorySummaryService && payments.length > 0) {
                // Get the latest inserted payment record ID and process it
                const lastPaymentId = this.db.prepare('SELECT last_insert_rowid() as id').get().id;
                for (let i = 0; i < payments.length; i++) {
                    const paymentId = lastPaymentId - payments.length + 1 + i;
                    this.monthlyCategorySummaryService.processNewPayment(paymentId);
                }
            }
        } catch (error) {
            logger.error(`Failed to generate payment history for subscription ${subscriptionId}:`, error.message);
            throw error;
        }
    }

    /* * 
* Regenerate payment history */
    async regeneratePaymentHistory(subscriptionId) {
        logger.info(`Regenerating payment history for subscription ${subscriptionId}`);

        try {
            // Get subscription information
            const subscription = this.findById(subscriptionId);
            if (!subscription) {
                throw new Error(`Subscription ${subscriptionId} not found`);
            }

            // Delete existing payment history
            const deleteStmt = this.db.prepare('DELETE FROM payment_history WHERE subscription_id = ?');
            const deleteResult = deleteStmt.run(subscriptionId);
            logger.info(`Deleted ${deleteResult.changes} existing payment records for subscription ${subscriptionId}`);

            // Regenerate payment history
            await this.generatePaymentHistory(subscriptionId, subscription);
        } catch (error) {
            logger.error(`Failed to regenerate payment history for subscription ${subscriptionId}:`, error.message);
            throw error;
        }
    }

    /* * 
* Auxiliary method for generating historical payment records 
* @private */
    _generateHistoricalPayments(subscription) {
        const payments = [];
        const startDate = new Date(subscription.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generate payment records from start date to last billing date or today
        let currentDate = new Date(startDate);
        const endDate = subscription.last_billing_date ?
            new Date(subscription.last_billing_date) : today;

        while (currentDate <= endDate) {
            const billingPeriodEnd = this._calculateNextBillingDate(currentDate, subscription.billing_cycle);

            payments.push({
                payment_date: currentDate.toISOString().split('T')[0],
                billing_period_start: currentDate.toISOString().split('T')[0],
                billing_period_end: billingPeriodEnd.toISOString().split('T')[0]
            });

            // Move to next billing cycle
            currentDate = new Date(billingPeriodEnd);
        }

        return payments;
    }

    /* * 
* Auxiliary method to calculate the next billing date 
* @private */
    _calculateNextBillingDate(currentDate, billingCycle) {
        const nextDate = new Date(currentDate);

        switch (billingCycle) {
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'quarterly':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'semiannual':
                nextDate.setMonth(nextDate.getMonth() + 6);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                throw new Error(`Unsupported billing cycle: ${billingCycle}`);
        }

        return nextDate;
    }

    /* * 
* 关闭资源 */
    close() {
        if (this.monthlyCategorySummaryService) {
            this.monthlyCategorySummaryService.close();
        }
        if (this.notificationService) {
            this.notificationService.close();
        }
    }
}

module.exports = SubscriptionService;
