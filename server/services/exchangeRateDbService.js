const BaseRepository = require('../utils/BaseRepository');
const logger = require('../utils/logger');

/* * 
* Exchange rate database service class 
* Database operations and business logic for processing exchange rate data */
class ExchangeRateDbService extends BaseRepository {
    constructor(db) {
        super(db, 'exchange_rates');
    }

    /* * 
* Get all exchange rates 
* @returns {Array} exchange rate list */
    async getAllExchangeRates() {
        try {
            return this.findAll({ orderBy: 'from_currency, to_currency' });
        } catch (error) {
            logger.error('Failed to get all exchange rates:', error.message);
            throw error;
        }
    }

    /* * 
* Get the exchange rate for a specific currency pair 
* @param {string} fromCurrency - source currency 
* @param {string} toCurrency - target currency 
* @returns {Object|null} exchange rate data */
    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            const from = fromCurrency.toUpperCase();
            const to = toCurrency.toUpperCase();

            // First try looking up the exchange rate directly
            let rate = this.findOne({
                from_currency: from,
                to_currency: to
            });

            if (rate) {
                return rate;
            }

            // If there is no direct exchange rate, try an inverse exchange rate
            const reverseRate = this.findOne({
                from_currency: to,
                to_currency: from
            });

            if (reverseRate && reverseRate.rate !== 0) {
                // Returns the reciprocal of the inverse exchange rate
                return {
                    ...reverseRate,
                    from_currency: from,
                    to_currency: to,
                    rate: 1 / reverseRate.rate,
                    is_reverse: true // Mark this as the reverse calculated exchange rate
                };
            }

            return null;
        } catch (error) {
            logger.error(`Failed to get exchange rate ${fromCurrency}/${toCurrency}:`, error.message);
            throw error;
        }
    }

    /* * 
* Get all exchange rates for a currency 
* @param {string} currency - currency code 
* @returns {Array} exchange rate list */
    async getRatesForCurrency(currency) {
        try {
            const currencyCode = currency.toUpperCase();
            
            // Get the exchange rate using this currency as the source currency
            const fromRates = this.findAll({
                filters: { from_currency: currencyCode },
                orderBy: 'to_currency'
            });

            // Get the exchange rate using this currency as the target currency
            const toRates = this.findAll({
                filters: { to_currency: currencyCode },
                orderBy: 'from_currency'
            });

            return {
                fromRates,
                toRates,
                currency: currencyCode
            };
        } catch (error) {
            logger.error(`Failed to get rates for currency ${currency}:`, error.message);
            throw error;
        }
    }

    /* * 
* Create or update exchange rates 
* @param {string} fromCurrency - source currency 
* @param {string} toCurrency - target currency 
* @param {number} rate - exchange rate 
* @param {string} source - data source 
* @returns {Object} operation result */
    async upsertExchangeRate(fromCurrency, toCurrency, rate, source = 'manual') {
        try {
            const from = fromCurrency.toUpperCase();
            const to = toCurrency.toUpperCase();

            // Verify exchange rate data
            this._validateExchangeRateData(from, to, rate);

            // Check if it already exists
            const existing = await this.getExchangeRate(from, to);

            const rateData = {
                from_currency: from,
                to_currency: to,
                rate: parseFloat(rate),
                source,
                updated_at: new Date().toISOString()
            };

            if (existing) {
                // Update existing exchange rate
                const result = this.update(existing.id, rateData);
                logger.info(`Updated exchange rate ${from}/${to}: ${rate}`);
                return { ...result, operation: 'update' };
            } else {
                // Create new exchange rate
                rateData.created_at = new Date().toISOString();
                const result = this.create(rateData);
                logger.info(`Created exchange rate ${from}/${to}: ${rate}`);
                return { ...result, operation: 'create' };
            }
        } catch (error) {
            logger.error(`Failed to upsert exchange rate ${fromCurrency}/${toCurrency}:`, error.message);
            throw error;
        }
    }

    /* * 
* Update exchange rates in batches 
* @param {Array} rates - exchange rate data array 
* @param {string} source - data source 
* @returns {Object} batch operation results */
    async bulkUpsertExchangeRates(rates, source = 'api') {
        try {
            const results = {
                created: 0,
                updated: 0,
                errors: []
            };

            // Use transactions to ensure data consistency
            return this.transaction(() => {
                for (const rateData of rates) {
                    try {
                        const { from_currency, to_currency, rate } = rateData;
                        
                        // Validate data
                        this._validateExchangeRateData(from_currency, to_currency, rate);
                        
                        // Check if it already exists
                        const existing = this.findOne({
                            from_currency: from_currency.toUpperCase(),
                            to_currency: to_currency.toUpperCase()
                        });

                        const data = {
                            from_currency: from_currency.toUpperCase(),
                            to_currency: to_currency.toUpperCase(),
                            rate: parseFloat(rate),
                            source,
                            updated_at: new Date().toISOString()
                        };

                        if (existing) {
                            this.update(existing.id, data);
                            results.updated++;
                        } else {
                            data.created_at = new Date().toISOString();
                            this.create(data);
                            results.created++;
                        }
                    } catch (error) {
                        results.errors.push({
                            rate: rateData,
                            error: error.message
                        });
                    }
                }
                return results;
            });
        } catch (error) {
            logger.error('Failed to bulk update exchange rates:', error.message);
            throw error;
        }
    }

    /* * 
* Delete exchange rate 
* @param {string} fromCurrency - source currency 
* @param {string} toCurrency - target currency 
* @returns {Object} Delete results */
    async deleteExchangeRate(fromCurrency, toCurrency) {
        try {
            const from = fromCurrency.toUpperCase();
            const to = toCurrency.toUpperCase();

            const existing = await this.getExchangeRate(from, to);
            if (!existing) {
                throw new Error(`Exchange rate ${from}/${to} not found`);
            }

            const result = this.delete(existing.id);
            logger.info(`Deleted exchange rate ${from}/${to}`);
            return result;
        } catch (error) {
            logger.error(`Failed to delete exchange rate ${fromCurrency}/${toCurrency}:`, error.message);
            throw error;
        }
    }

    /* * 
* Calculate currency conversion 
* @param {number} amount - amount 
* @param {string} fromCurrency - source currency 
* @param {string} toCurrency - target currency 
* @returns {Object} conversion result */
    async convertCurrency(amount, fromCurrency, toCurrency) {
        try {
            const from = fromCurrency.toUpperCase();
            const to = toCurrency.toUpperCase();

            // If it is the same currency, return directly
            if (from === to) {
                return {
                    originalAmount: amount,
                    convertedAmount: amount,
                    fromCurrency: from,
                    toCurrency: to,
                    rate: 1,
                    timestamp: new Date().toISOString()
                };
            }

            // Get exchange rate
            const exchangeRate = await this.getExchangeRate(from, to);
            if (!exchangeRate) {
                throw new Error(`Exchange rate not found for ${from}/${to}`);
            }

            const convertedAmount = amount * exchangeRate.rate;

            return {
                originalAmount: amount,
                convertedAmount: Math.round(convertedAmount * 100) / 100, // Keep to two decimal places
                fromCurrency: from,
                toCurrency: to,
                rate: exchangeRate.rate,
                timestamp: new Date().toISOString(),
                rateUpdatedAt: exchangeRate.updated_at
            };
        } catch (error) {
            logger.error(`Failed to convert currency ${amount} ${fromCurrency} to ${toCurrency}:`, error.message);
            throw error;
        }
    }

    /* * 
* Get exchange rate statistics 
* @returns {Object} statistics */
    async getExchangeRateStats() {
        try {
            const allRates = await this.getAllExchangeRates();
            
            const currencies = new Set();
            const sources = {};
            let oldestUpdate = null;
            let newestUpdate = null;

            allRates.forEach(rate => {
                currencies.add(rate.from_currency);
                currencies.add(rate.to_currency);

                if (!sources[rate.source]) {
                    sources[rate.source] = 0;
                }
                sources[rate.source]++;

                const updateTime = new Date(rate.updated_at);
                if (!oldestUpdate || updateTime < oldestUpdate) {
                    oldestUpdate = updateTime;
                }
                if (!newestUpdate || updateTime > newestUpdate) {
                    newestUpdate = updateTime;
                }
            });

            return {
                totalRates: allRates.length,
                uniqueCurrencies: currencies.size,
                currencies: Array.from(currencies).sort(),
                sources,
                oldestUpdate: oldestUpdate ? oldestUpdate.toISOString() : null,
                newestUpdate: newestUpdate ? newestUpdate.toISOString() : null
            };
        } catch (error) {
            logger.error('Failed to get exchange rate stats:', error.message);
            throw error;
        }
    }

    /* * 
* Verify exchange rate data 
* @private 
* @param {string} fromCurrency - source currency 
* @param {string} toCurrency - target currency 
* @param {number} rate - exchange rate */
    _validateExchangeRateData(fromCurrency, toCurrency, rate) {
        if (!fromCurrency || typeof fromCurrency !== 'string' || fromCurrency.length !== 3) {
            throw new Error('Invalid from_currency: must be a 3-character currency code');
        }

        if (!toCurrency || typeof toCurrency !== 'string' || toCurrency.length !== 3) {
            throw new Error('Invalid to_currency: must be a 3-character currency code');
        }

        if (fromCurrency === toCurrency) {
            throw new Error('from_currency and to_currency cannot be the same');
        }

        const rateNum = parseFloat(rate);
        if (isNaN(rateNum) || rateNum <= 0) {
            throw new Error('Invalid rate: must be a positive number');
        }
    }
}

module.exports = ExchangeRateDbService;
