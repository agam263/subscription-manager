const cron = require('node-cron');
const ExchangeRateApiService = require('./exchangeRateService');
const logger = require('../utils/logger');

/* * 
* Exchange rate update scheduler 
* Responsible for regularly updating exchange rate data */
class ExchangeRateScheduler {
    constructor(database, apiKey) {
        this.db = database;
        this.exchangeRateService = new ExchangeRateApiService(apiKey);
        this.isRunning = false;
        this.task = null;
    }

    /* * 
* Start scheduled tasks 
* Exchange rates are updated at 2 a.m. every day */
    start() {
        if (this.isRunning) {
            logger.info('Exchange rate scheduler is already running');
            return;
        }

        // Executed at 2 am every day (0 2 * * *)
        this.task = cron.schedule('0 2 * * *', async () => {
            await this.updateExchangeRates();
        }, {
            scheduled: false,
            timezone: 'Asia/Shanghai' // Use China time zone
        });

        this.task.start();
        this.isRunning = true;

        logger.info('Exchange rate scheduler started (daily at 2:00 AM CST)');

        // Perform an update immediately on startup (if there is no latest data in the database)
        this.checkAndUpdateIfNeeded();
    }

    /* * 
* Stop scheduled tasks */
    stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
        }
        this.isRunning = false;
        logger.info('Exchange rate scheduler stopped');
    }

    /* * 
* Check and update exchange rates if needed */
    async checkAndUpdateIfNeeded() {
        try {
            // Check last updated time
            const lastUpdate = this.db.prepare(`
                SELECT MAX(updated_at) as last_update 
                FROM exchange_rates
            `).get();

            const now = new Date();
            const lastUpdateDate = lastUpdate?.last_update ? new Date(lastUpdate.last_update) : null;
            
            // If there is no data or no update for more than 24 hours, update immediately
            if (!lastUpdateDate || (now - lastUpdateDate) > 24 * 60 * 60 * 1000) {
                await this.updateExchangeRates();
            }
        } catch (error) {
            logger.error('Error checking exchange rate update status:', error.message);
        }
    }

    /* * 
* Manually trigger exchange rate updates */
    async updateExchangeRates() {
        try {
            // Get the latest exchange rates
            const rates = await this.exchangeRateService.getAllExchangeRates();

            if (rates.length === 0) {
                logger.warn('No exchange rates received from API');
                return { success: false, message: 'No rates received' };
            }

            // Update database
            const updateCount = this.updateRatesInDatabase(rates);

            return {
                success: true,
                message: `Updated ${updateCount} exchange rates`,
                updatedAt: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Failed to update exchange rates:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /* * 
* Update exchange rates in database 
* @param {Array} rates - array of exchange rates 
* @returns {number} The number of updated records */
    async updateRatesInDatabase(rates) {
        const upsertRate = this.db.prepare(`
            INSERT INTO exchange_rates (from_currency, to_currency, rate, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(from_currency, to_currency) 
            DO UPDATE SET 
                rate = excluded.rate,
                updated_at = CURRENT_TIMESTAMP
        `);

        const transaction = this.db.transaction((rates) => {
            let count = 0;
            for (const rate of rates) {
                try {
                    upsertRate.run(rate.from_currency, rate.to_currency, rate.rate);
                    count++;
                } catch (error) {
                    console.error(`Failed to update rate ${rate.from_currency}->${rate.to_currency}:`, error.message);
                }
            }
            return count;
        });

        return transaction(rates);
    }

    /* * 
* Get scheduler status */
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextRun: this.task ? this.task.nextDate() : null,
            hasApiKey: !!this.exchangeRateService.apiKey
        };
    }
}

module.exports = ExchangeRateScheduler;
