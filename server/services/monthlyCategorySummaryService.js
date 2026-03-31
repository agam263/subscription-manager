const Database = require('better-sqlite3');
const logger = require('../utils/logger');
const { getBaseCurrency } = require('../config/currencies');

/* * 
* Monthly classification summary service 
* Process the calculation and storage of monthly subtotals based on payment_history */
class MonthlyCategorySummaryService {
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.baseCurrency = 'CNY'; // base currency
    }

    /* * 
* Get exchange rate */
    getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        // First try looking up the exchange rate directly
        const stmt = this.db.prepare(`
            SELECT rate FROM exchange_rates
            WHERE from_currency = ? AND to_currency = ?
        `);
        const result = stmt.get(fromCurrency, toCurrency);

        if (result) {
            return parseFloat(result.rate);
        }

        // If there is no direct exchange rate, try an inverse exchange rate
        const reverseStmt = this.db.prepare(`
            SELECT rate FROM exchange_rates
            WHERE from_currency = ? AND to_currency = ?
        `);
        const reverseResult = reverseStmt.get(toCurrency, fromCurrency);

        if (reverseResult) {
            const reverseRate = parseFloat(reverseResult.rate);
            if (reverseRate !== 0) {
                return 1 / reverseRate;
            }
        }

        // If there are no direct and inverse rates, try converting via base currency
        const baseCurrency = getBaseCurrency();
        if (fromCurrency !== baseCurrency && toCurrency !== baseCurrency) {
            const toBaseRate = this.getExchangeRate(fromCurrency, baseCurrency);
            const fromBaseRate = this.getExchangeRate(baseCurrency, toCurrency);
            if (toBaseRate !== 1.0 && fromBaseRate !== 1.0) {
                return toBaseRate * fromBaseRate;
            }
        }

        logger.warn(`Exchange rate not found: ${fromCurrency} -> ${toCurrency}, using 1.0`);
        return 1.0;
    }

    /* * 
* Calculate and update subdivision summary data for the specified month */
    updateMonthlyCategorySummary(year, month) {
        try {
            logger.info(`Updating monthly category summary for ${year}-${month.toString().padStart(2, '0')}`);

            // Get all successful payment records for this month, including classification information
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // end of month date

            const paymentsStmt = this.db.prepare(`
                SELECT 
                    ph.id,
                    ph.amount_paid,
                    ph.currency,
                    ph.payment_date,
                    s.category_id,
                    COALESCE(c.id, (SELECT id FROM categories WHERE value = 'other')) as resolved_category_id
                FROM payment_history ph
                JOIN subscriptions s ON ph.subscription_id = s.id
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE ph.payment_date >= ? AND ph.payment_date <= ?
                AND ph.status = 'succeeded'
                ORDER BY s.category_id
            `);

            const payments = paymentsStmt.all(startDate, endDate);
            
            if (payments.length === 0) {
                logger.info(`No payments found for ${year}-${month.toString().padStart(2, '0')}`);
                return;
            }

            // Calculate summary data by category grouping
            const categoryData = {};

            payments.forEach(payment => {
                const categoryId = payment.resolved_category_id;
                
                if (!categoryData[categoryId]) {
                    categoryData[categoryId] = {
                        totalAmount: 0,
                        transactionCount: 0
                    };
                }

                // Convert to base currency
                const rate = this.getExchangeRate(payment.currency, this.baseCurrency);
                const amountInBaseCurrency = parseFloat(payment.amount_paid) * rate;

                categoryData[categoryId].totalAmount += amountInBaseCurrency;
                categoryData[categoryId].transactionCount += 1;
            });

            // Update the database using transactions
            const transaction = this.db.transaction(() => {
                // Delete existing data for that month first
                const deleteStmt = this.db.prepare(`
                    DELETE FROM monthly_category_summary 
                    WHERE year = ? AND month = ?
                `);
                deleteStmt.run(year, month);

                // Insert new summary data
                const insertStmt = this.db.prepare(`
                    INSERT INTO monthly_category_summary (
                        year, month, category_id, 
                        total_amount_in_base_currency, base_currency, transactions_count
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `);

                Object.entries(categoryData).forEach(([categoryId, data]) => {
                    insertStmt.run(
                        year,
                        month,
                        parseInt(categoryId),
                        Math.round(data.totalAmount * 100) / 100, // Keep to two decimal places
                        this.baseCurrency,
                        data.transactionCount
                    );
                });
            });

            transaction();

            logger.info(`Updated monthly category summary for ${year}-${month.toString().padStart(2, '0')}: ${Object.keys(categoryData).length} categories`);

        } catch (error) {
            logger.error(`Failed to update monthly category summary for ${year}-${month}:`, error.message);
            throw error;
        }
    }

    /* * 
* Recalculate subtotal data for all months */
    recalculateAllMonthlyCategorySummaries() {
        try {
            logger.info('Starting recalculation of all monthly category summaries...');

            // Get all months with payment records
            const monthsStmt = this.db.prepare(`
                SELECT DISTINCT 
                    strftime('%Y', payment_date) as year,
                    strftime('%m', payment_date) as month
                FROM payment_history 
                WHERE status = 'succeeded'
                ORDER BY year, month
            `);

            const months = monthsStmt.all();
            
            if (months.length === 0) {
                logger.info('No payment records found for recalculation');
                return;
            }

            // Clear existing summary data
            this.db.prepare('DELETE FROM monthly_category_summary').run();

            // Recalculate each month
            months.forEach(monthData => {
                const year = parseInt(monthData.year);
                const month = parseInt(monthData.month);
                this.updateMonthlyCategorySummary(year, month);
            });

            logger.info(`Recalculated monthly category summaries for ${months.length} months`);

        } catch (error) {
            logger.error('Failed to recalculate all monthly category summaries:', error.message);
            throw error;
        }
    }

    /* * 
* Process new payment records */
    processNewPayment(paymentId) {
        try {
            // Get payment record information
            const paymentStmt = this.db.prepare(`
                SELECT 
                    strftime('%Y', payment_date) as year,
                    strftime('%m', payment_date) as month
                FROM payment_history 
                WHERE id = ? AND status = 'succeeded'
            `);
            
            const payment = paymentStmt.get(paymentId);
            
            if (!payment) {
                logger.warn(`Payment ${paymentId} not found or not succeeded`);
                return;
            }

            const year = parseInt(payment.year);
            const month = parseInt(payment.month);

            // Update summary data for the month
            this.updateMonthlyCategorySummary(year, month);

            logger.info(`Processed payment ${paymentId} for monthly category summary`);

        } catch (error) {
            logger.error(`Failed to process payment ${paymentId}:`, error.message);
            throw error;
        }
    }

    /* * 
* Process payment record deletion */
    processPaymentDeletion(year, month) {
        try {
            // Recalculate summary data for the month
            this.updateMonthlyCategorySummary(year, month);
            logger.info(`Processed payment deletion for ${year}-${month.toString().padStart(2, '0')}`);

        } catch (error) {
            logger.error(`Failed to process payment deletion for ${year}-${month}:`, error.message);
            throw error;
        }
    }

    /* * 
* Get monthly classified summary data */
    getMonthlyCategorySummary(startYear, startMonth, endYear, endMonth) {
        const stmt = this.db.prepare(`
            SELECT 
                mcs.*,
                c.value as category_value,
                c.label as category_label
            FROM monthly_category_summary mcs
            JOIN categories c ON mcs.category_id = c.id
            WHERE (mcs.year > ? OR (mcs.year = ? AND mcs.month >= ?))
            AND (mcs.year < ? OR (mcs.year = ? AND mcs.month <= ?))
            ORDER BY mcs.year, mcs.month, c.label
        `);

        return stmt.all(startYear, startYear, startMonth, endYear, endYear, endMonth);
    }

    /* * 
* Get the classified summary for the specified month */
    getMonthCategorySummary(year, month) {
        const stmt = this.db.prepare(`
            SELECT 
                mcs.*,
                c.value as category_value,
                c.label as category_label
            FROM monthly_category_summary mcs
            JOIN categories c ON mcs.category_id = c.id
            WHERE mcs.year = ? AND mcs.month = ?
            ORDER BY mcs.total_amount_in_base_currency DESC
        `);

        return stmt.all(year, month);
    }

    /* * 
* Get total data */
    getTotalSummary(startYear, startMonth, endYear, endMonth) {
        const stmt = this.db.prepare(`
            SELECT 
                SUM(total_amount_in_base_currency) as total_amount,
                SUM(transactions_count) as total_transactions,
                base_currency
            FROM monthly_category_summary
            WHERE (year > ? OR (year = ? AND month >= ?))
            AND (year < ? OR (year = ? AND month <= ?))
            GROUP BY base_currency
        `);

        return stmt.get(startYear, startYear, startMonth, endYear, endYear, endMonth);
    }

    close() {
        this.db.close();
    }
}

module.exports = MonthlyCategorySummaryService;
