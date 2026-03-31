const axios = require('axios');
const logger = require('../utils/logger');
const { SUPPORTED_CURRENCY_CODES, getBaseCurrency } = require('../config/currencies');

/* * 
* Exchange rate API service 
* Use Tianxing Data API to obtain real-time exchange rates */
class ExchangeRateApiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://apis.tianapi.com/fxrate/index';
        this.supportedCurrencies = SUPPORTED_CURRENCY_CODES;
    }

    /* * 
* Get a single exchange rate 
* @param {string} fromCurrency - source currency 
* @param {string} toCurrency - target currency 
* @param {number} amount - amount, default is 1 
* @returns {Promise<number>} exchange rate value */
    async getExchangeRate(fromCurrency, toCurrency, amount = 1) {
        if (!this.apiKey) {
            throw new Error('TIANAPI_KEY not configured');
        }

        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    key: this.apiKey,
                    fromcoin: fromCurrency,
                    tocoin: toCurrency,
                    money: amount
                },
                timeout: 10000 // 10 seconds timeout
            });

            if (response.data.code === 200) {
                const rate = parseFloat(response.data.result.money) / amount;
                return rate;
            } else {
                throw new Error(`API Error: ${response.data.msg} (Code: ${response.data.code})`);
            }
        } catch (error) {
            if (error.response) {
                throw new Error(`API Request Failed: ${error.response.status} - ${error.response.data?.msg || error.message}`);
            } else if (error.request) {
                throw new Error('Network Error: Unable to reach exchange rate API');
            } else {
                throw new Error(`Exchange Rate Service Error: ${error.message}`);
            }
        }
    }

    /* * 
* Get exchange rates in batches (based on base currency) 
* @returns {Promise<Array>} exchange rate array */
    async getAllExchangeRates() {
        if (!this.apiKey) {
            logger.warn('TIANAPI_KEY not configured, skipping exchange rate update');
            return [];
        }

        const rates = [];
        const baseCurrency = getBaseCurrency();

        // Add base currency to own exchange rate
        rates.push({
            from_currency: baseCurrency,
            to_currency: baseCurrency,
            rate: 1.0
        });

        // Get the exchange rate of another currency relative to the base currency
        for (const currency of this.supportedCurrencies) {
            if (currency === baseCurrency) continue;

            try {
                const rate = await this.getExchangeRate(baseCurrency, currency);

                rates.push({
                    from_currency: baseCurrency,
                    to_currency: currency,
                    rate: rate
                });

                // Add delays to avoid API limitations
                await this.delay(500); // 500ms delay
            } catch (error) {
                logger.error(`Failed to fetch rate for ${baseCurrency} -> ${currency}:`, error.message);
                // Continue processing other currencies without interrupting the entire process
            }
        }

        return rates;
    }

    /* * 
* Delay function 
* @param {number} ms - delay in milliseconds */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /* * 
* Verify that the API key is valid 
* @returns {Promise<boolean>} Is it valid? */
    async validateApiKey() {
        if (!this.apiKey) {
            return false;
        }

        try {
            await this.getExchangeRate(getBaseCurrency(), 'USD');
            return true;
        } catch (error) {
            console.error('API Key validation failed:', error.message);
            return false;
        }
    }
}

module.exports = ExchangeRateApiService;
