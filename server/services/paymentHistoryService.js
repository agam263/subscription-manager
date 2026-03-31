const BaseRepository = require('../utils/BaseRepository');
const MonthlyCategorySummaryService = require('./monthlyCategorySummaryService');
const logger = require('../utils/logger');
const { NotFoundError } = require('../middleware/errorHandler');

class PaymentHistoryService extends BaseRepository {
    constructor(db) {
        super(db, 'payment_history');
        this.monthlyCategorySummaryService = new MonthlyCategorySummaryService(db.name);
    }

    /* * 
* Get payment history (with filtering and paging) */
    async getPaymentHistory(filters = {}, options = {}) {
        let query = `
            SELECT
                ph.*,
                s.name as subscription_name,
                s.plan as subscription_plan
            FROM payment_history ph
            LEFT JOIN subscriptions s ON ph.subscription_id = s.id
            WHERE 1=1
        `;

        const params = [];

        // Add filter
        if (filters.subscription_id) {
            query += ' AND ph.subscription_id = ?';
            params.push(filters.subscription_id);
        }

        if (filters.start_date) {
            query += ' AND ph.payment_date >= ?';
            params.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ' AND ph.payment_date <= ?';
            params.push(filters.end_date);
        }

        if (filters.status) {
            query += ' AND ph.status = ?';
            params.push(filters.status);
        }

        if (filters.currency) {
            query += ' AND ph.currency = ?';
            params.push(filters.currency);
        }

        // Add sort
        query += ' ORDER BY ph.payment_date DESC, ph.id DESC';

        // Add pagination
        if (options.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);

            if (options.offset) {
                query += ' OFFSET ?';
                params.push(options.offset);
            }
        }

        const stmt = this.db.prepare(query);
        return stmt.all(...params);
    }

    /* * 
* Get payment records based on ID */
    async getPaymentById(id) {
        const query = `
            SELECT
                ph.*,
                s.name as subscription_name,
                s.plan as subscription_plan,
                s.category as subscription_category
            FROM payment_history ph
            LEFT JOIN subscriptions s ON ph.subscription_id = s.id
            WHERE ph.id = ?
        `;

        const stmt = this.db.prepare(query);
        return stmt.get(id);
    }

    /* * 
* Get monthly payment statistics */
    async getMonthlyStats(year, month) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // end of month date

        const query = `
            SELECT
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'succeeded' THEN amount_paid ELSE 0 END) as total_amount,
                COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
                currency,
                AVG(CASE WHEN status = 'succeeded' THEN amount_paid ELSE NULL END) as avg_payment_amount
            FROM payment_history
            WHERE payment_date >= ? AND payment_date <= ?
            GROUP BY currency
            ORDER BY total_amount DESC
        `;

        const stmt = this.db.prepare(query);
        return stmt.all(startDate, endDate);
    }

    /* * 
* Get annual payment statistics */
    async getYearlyStats(year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const query = `
            SELECT
                strftime('%m', payment_date) as month,
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'succeeded' THEN amount_paid ELSE 0 END) as total_amount,
                COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
                currency
            FROM payment_history
            WHERE payment_date >= ? AND payment_date <= ?
            GROUP BY strftime('%m', payment_date), currency
            ORDER BY month, currency
        `;

        const stmt = this.db.prepare(query);
        return stmt.all(startDate, endDate);
    }

    /* * 
* Get quarterly payment statistics */
    async getQuarterlyStats(year, quarter) {
        const quarterMonths = {
            1: { start: '01', end: '03' },
            2: { start: '04', end: '06' },
            3: { start: '07', end: '09' },
            4: { start: '10', end: '12' }
        };

        const { start, end } = quarterMonths[quarter];
        const startDate = `${year}-${start}-01`;
        const endDate = `${year}-${end}-31`;

        const query = `
            SELECT
                strftime('%m', payment_date) as month,
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'succeeded' THEN amount_paid ELSE 0 END) as total_amount,
                COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
                currency
            FROM payment_history
            WHERE payment_date >= ? AND payment_date <= ?
            GROUP BY strftime('%m', payment_date), currency
            ORDER BY month, currency
        `;

        const stmt = this.db.prepare(query);
        return stmt.all(startDate, endDate);
    }

    /* * 
* Create payment records */
    async createPayment(paymentData) {
        const {
            subscription_id,
            payment_date,
            amount_paid,
            currency,
            billing_period_start,
            billing_period_end,
            status = 'succeeded',
            notes
        } = paymentData;

        // Verify that the subscription exists
        const subscriptionExists = this.db.prepare('SELECT id FROM subscriptions WHERE id = ?').get(subscription_id);
        if (!subscriptionExists) {
            throw new NotFoundError('Subscription');
        }

        const result = this.create({
            subscription_id,
            payment_date,
            amount_paid,
            currency,
            billing_period_start,
            billing_period_end,
            status,
            notes
        });

        // If payment is successful, update monthly breakdown summary
        if (status === 'succeeded') {
            try {
                this.monthlyCategorySummaryService.processNewPayment(result.lastInsertRowid);
                logger.info(`Monthly category summary updated for new payment ${result.lastInsertRowid}`);
            } catch (error) {
                logger.error(`Failed to update monthly category summary for payment ${result.lastInsertRowid}:`, error.message);
            }
        }

        return result;
    }

    /* * 
* Update payment records */
    async updatePayment(id, updateData) {
        // Check if the record exists
        const existingPayment = this.findById(id);
        if (!existingPayment) {
            throw new NotFoundError('Payment record');
        }

        const result = this.update(id, updateData);

        // Check if there are changes in fields that affect monthly summary (except notes field)
        const fieldsAffectingSummary = [
            'payment_date', 'amount_paid', 'currency', 'status',
            'billing_period_start', 'billing_period_end'
        ];

        const hasSignificantChanges = fieldsAffectingSummary.some(field => {
            return updateData[field] !== undefined && updateData[field] !== existingPayment[field];
        });

        if (hasSignificantChanges) {
            try {
                // Collection of months that need to be updated
                const monthsToUpdate = new Set();

                // If the payment date changes, the original date and the month of the new date need to be updated
                if (updateData.payment_date && updateData.payment_date !== existingPayment.payment_date) {
                    // The month of the original date
                    const oldPaymentDate = new Date(existingPayment.payment_date);
                    const oldYear = oldPaymentDate.getFullYear();
                    const oldMonth = oldPaymentDate.getMonth() + 1;
                    monthsToUpdate.add(`${oldYear}-${oldMonth}`);

                    // The month of the new date
                    const newPaymentDate = new Date(updateData.payment_date);
                    const newYear = newPaymentDate.getFullYear();
                    const newMonth = newPaymentDate.getMonth() + 1;
                    monthsToUpdate.add(`${newYear}-${newMonth}`);
                } else {
                    // If the payment date has not changed, just update the current month
                    const paymentDate = new Date(existingPayment.payment_date);
                    const year = paymentDate.getFullYear();
                    const month = paymentDate.getMonth() + 1;
                    monthsToUpdate.add(`${year}-${month}`);
                }

                // Update all involved months
                monthsToUpdate.forEach(monthKey => {
                    const [year, month] = monthKey.split('-').map(Number);
                    this.monthlyCategorySummaryService.updateMonthlyCategorySummary(year, month);
                });

                logger.info(`Monthly category summary updated for payment ${id} field changes. Updated months: ${Array.from(monthsToUpdate).join(', ')}`);
            } catch (error) {
                logger.error(`Failed to update monthly category summary for payment ${id}:`, error.message);
            }
        }

        return result;
    }

    /* * 
* Delete payment history */
    async deletePayment(id) {
        // Check if the record exists
        const existingPayment = this.findById(id);
        if (!existingPayment) {
            throw new NotFoundError('Payment record');
        }

        const result = this.delete(id);

        // Update monthly breakdown summary
        if (existingPayment.status === 'succeeded') {
            try {
                // Get the year and month information of the payment record
                const paymentDate = new Date(existingPayment.payment_date);
                const year = paymentDate.getFullYear();
                const month = paymentDate.getMonth() + 1;

                // Recalculate summary data for the month
                this.monthlyCategorySummaryService.processPaymentDeletion(year, month);
                logger.info(`Monthly category summary updated for deleted payment ${id}`);
            } catch (error) {
                logger.error(`Failed to update monthly category summary for deleted payment ${id}:`, error.message);
            }
        }

        return result;
    }

    /* * 
* Create payment records in batches */
    async bulkCreatePayments(paymentsData) {
        return this.transaction(() => {
            const results = [];
            for (const paymentData of paymentsData) {
                const result = this.createPayment(paymentData);
                results.push(result);
            }
            return results;
        });
    }

    /* * 
* Recalculate monthly subtotals */
    async recalculateMonthlyCategorySummaries() {
        try {
            this.monthlyCategorySummaryService.recalculateAllMonthlyCategorySummaries();
            logger.info('Monthly category summaries recalculated successfully');
        } catch (error) {
            logger.error('Failed to recalculate monthly category summaries:', error.message);
            throw error;
        }
    }

    /* * 
* 关闭资源 */
    close() {
        if (this.monthlyCategorySummaryService) {
            this.monthlyCategorySummaryService.close();
        }
    }
}

module.exports = PaymentHistoryService;
