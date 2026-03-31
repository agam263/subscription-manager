const BaseRepository = require('../utils/BaseRepository');
const logger = require('../utils/logger');

/* * 
*Analysis service category 
* Process business logic such as revenue analysis, subscription statistics, etc. */
class AnalyticsService extends BaseRepository {
    constructor(db) {
        super(db, 'payment_history');
    }

    /* * 
* Get monthly income statistics 
* @param {Object} filters - filter conditions 
* @param {string} filters.start_date - start date 
* @param {string} filters.end_date - end date 
* @param {string} filters.currency - currency type 
* @returns {Object} monthly income statistics */
    async getMonthlyRevenue(filters = {}) {
        const { start_date, end_date, currency } = filters;

        let query = `
            SELECT
                strftime('%Y-%m', payment_date) as month,
                currency,
                SUM(amount_paid) as total_revenue,
                COUNT(id) as payment_count,
                AVG(amount_paid) as average_payment
            FROM payment_history
            WHERE status = 'succeeded'
        `;

        const params = [];

        // Add date filter
        if (start_date) {
            query += ' AND payment_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND payment_date <= ?';
            params.push(end_date);
        }

        // Add currency filter
        if (currency) {
            query += ' AND currency = ?';
            params.push(currency);
        }

        query += ' GROUP BY strftime(\'%Y-%m\', payment_date), currency ORDER BY month DESC, currency';

        try {
            const stmt = this.db.prepare(query);
            const results = stmt.all(...params);

            // Conversion result format
            const monthlyStats = this._formatMonthlyStats(results);
            const summary = this._calculateRevenueSummary(results);

            return {
                monthlyStats,
                summary,
                filters: {
                    startDate: start_date || null,
                    endDate: end_date || null,
                    currency: currency || null
                }
            };
        } catch (error) {
            logger.error('Failed to get monthly revenue:', error.message);
            throw error;
        }
    }

    /* * 
* Get monthly active subscription statistics 
* @param {number} year - year 
* @param {number} month - month 
* @returns {Object} monthly active subscription statistics */
    async getMonthlyActiveSubscriptions(year, month) {
        // Validation parameters
        this._validateMonthYear(month, year);

        // Format month
        const monthStr = month.toString().padStart(2, '0');
        const targetMonth = `${year}-${monthStr}`;

        // Calculate first and last day of month
        const firstDay = `${targetMonth}-01`;
        const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

        const query = `
            SELECT DISTINCT
                s.id,
                s.name,
                s.plan,
                s.amount,
                s.currency,
                s.billing_cycle,
                s.status,
                s.category,
                COUNT(ph.id) as payment_count_in_month,
                SUM(ph.amount_paid) as total_paid_in_month,
                MIN(ph.billing_period_start) as earliest_period_start,
                MAX(ph.billing_period_end) as latest_period_end
            FROM subscriptions s
            INNER JOIN payment_history ph ON s.id = ph.subscription_id
            WHERE ph.status = 'succeeded'
                AND (
                    -- 支付周期与目标月份重叠
                    (ph.billing_period_start <= ? AND ph.billing_period_end >= ?) OR
                    (ph.billing_period_start <= ? AND ph.billing_period_end >= ?) OR
                    (ph.billing_period_start >= ? AND ph.billing_period_start <= ?)
                )
            GROUP BY s.id, s.name, s.plan, s.amount, s.currency, s.billing_cycle, s.status, s.category
            ORDER BY s.name
        `;

        try {
            const stmt = this.db.prepare(query);
            const activeSubscriptions = stmt.all(
                lastDay, firstDay,  // The cycle ends after the beginning of the month and begins before the end of the month
                firstDay, lastDay,  // The cycle starts before the end of the month and ends after the beginning of the month
                firstDay, lastDay   // The cycle starts and ends within the month
            );

            // Format subscription data
            const formattedSubscriptions = this._formatActiveSubscriptions(activeSubscriptions);
            const summary = this._calculateActiveSubscriptionsSummary(activeSubscriptions);

            return {
                targetMonth,
                period: {
                    start: firstDay,
                    end: lastDay
                },
                activeSubscriptions: formattedSubscriptions,
                summary
            };
        } catch (error) {
            logger.error('Failed to get monthly active subscriptions:', error.message);
            throw error;
        }
    }

    /* * 
* Format monthly statistics 
* @private */
    _formatMonthlyStats(results) {
        return results.map(row => ({
            month: row.month,
            currency: row.currency,
            totalRevenue: parseFloat(row.total_revenue),
            paymentCount: row.payment_count,
            averagePayment: parseFloat(row.average_payment)
        }));
    }

    /* * 
* Calculate revenue summary statistics 
* @private */
    _calculateRevenueSummary(results) {
        return {
            totalMonths: new Set(results.map(r => r.month)).size,
            totalRevenue: results.reduce((sum, r) => sum + parseFloat(r.total_revenue), 0),
            totalPayments: results.reduce((sum, r) => sum + r.payment_count, 0),
            currencies: [...new Set(results.map(r => r.currency))]
        };
    }

    /* * 
* Format active subscription data 
* @private */
    _formatActiveSubscriptions(subscriptions) {
        return subscriptions.map(sub => ({
            id: sub.id,
            name: sub.name,
            plan: sub.plan,
            amount: parseFloat(sub.amount),
            currency: sub.currency,
            billingCycle: sub.billing_cycle,
            status: sub.status,
            category: sub.category,
            paymentCountInMonth: sub.payment_count_in_month,
            totalPaidInMonth: parseFloat(sub.total_paid_in_month || 0),
            activePeriod: {
                start: sub.earliest_period_start,
                end: sub.latest_period_end
            }
        }));
    }

    /* * 
* Calculate active subscription summary statistics 
* @private */
    _calculateActiveSubscriptionsSummary(subscriptions) {
        const summary = {
            totalActiveSubscriptions: subscriptions.length,
            totalRevenue: 0,
            totalPayments: 0,
            byCategory: {},
            byCurrency: {},
            byBillingCycle: {}
        };

        subscriptions.forEach(sub => {
            const revenue = parseFloat(sub.total_paid_in_month || 0);
            const paymentCount = sub.payment_count_in_month || 0;

            summary.totalRevenue += revenue;
            summary.totalPayments += paymentCount;

            // Statistics by category
            if (!summary.byCategory[sub.category]) {
                summary.byCategory[sub.category] = { count: 0, revenue: 0 };
            }
            summary.byCategory[sub.category].count++;
            summary.byCategory[sub.category].revenue += revenue;

            // Statistics by currency
            if (!summary.byCurrency[sub.currency]) {
                summary.byCurrency[sub.currency] = { count: 0, revenue: 0 };
            }
            summary.byCurrency[sub.currency].count++;
            summary.byCurrency[sub.currency].revenue += revenue;

            // Statistics by billing cycle
            if (!summary.byBillingCycle[sub.billing_cycle]) {
                summary.byBillingCycle[sub.billing_cycle] = { count: 0, revenue: 0 };
            }
            summary.byBillingCycle[sub.billing_cycle].count++;
            summary.byBillingCycle[sub.billing_cycle].revenue += revenue;
        });

        return summary;
    }

    /* * 
* Validate month and year parameters 
* @private */
    _validateMonthYear(month, year) {
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (monthNum < 1 || monthNum > 12) {
            throw new Error('Month must be between 1 and 12');
        }

        if (yearNum < 2000 || yearNum > 3000) {
            throw new Error('Year must be between 2000 and 3000');
        }
    }
}

module.exports = AnalyticsService;
