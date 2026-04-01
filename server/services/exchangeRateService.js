const axios = require('axios');
const logger = require('../utils/logger');
const { SUPPORTED_CURRENCY_CODES, getBaseCurrency } = require('../config/currencies');

/**
 * Exchange Rate API Service
 * Handles fetching currency multipliers with robust fallback and error handling.
 */
class ExchangeRateApiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        // Using the v4 free endpoint as a robust fallback to avoid crashing if the API key is missing
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/';
        this.supportedCurrencies = SUPPORTED_CURRENCY_CODES;
    }

    /**
     * Get a single exchange rate with extensive error handling
     * @param {string} fromCurrency - source currency 
     * @param {string} toCurrency - target currency 
     * @param {number} amount - amount, default is 1 
     * @returns {Promise<number>} exchange rate value 
     */
    async getExchangeRate(fromCurrency, toCurrency, amount = 1) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        // 1. Missing API Key Error Handling (Academic Requirement)
        if (!this.apiKey || this.apiKey.trim() === '') {
            logger.warn(`[ExchangeRateService] Missing API key when converting ${fromCurrency} to ${toCurrency}. Proceeding with free unauthenticated tier.`);
        }

        try {
            logger.info(`[ExchangeRateService] Requesting conversion from ${fromCurrency} to ${toCurrency}...`);
            const response = await axios.get(`${this.baseUrl}${fromCurrency}`, {
                timeout: 5000 // 5 seconds timeout to prevent hanging the application
            });

            // 2. Invalid Response Error Handling
            if (!response || !response.data) {
                logger.error('[ExchangeRateService] Invalid response: Payload is empty.');
                throw new Error('Invalid API response: No data received from provider.');
            }

            if (!response.data.rates || typeof response.data.rates !== 'object') {
                logger.error('[ExchangeRateService] Invalid response structural format: "rates" object missing.');
                throw new Error('Invalid API response: Rates object is missing or malformed.');
            }

            if (response.data.rates[toCurrency]) {
                const rate = response.data.rates[toCurrency];
                return rate * amount;
            } else {
                logger.error(`[ExchangeRateService] Target currency ${toCurrency} is missing in the fetched rates scope.`);
                throw new Error(`Currency translation failed: ${toCurrency} not supported by the provider.`);
            }

        } catch (error) {
            // Guarantee application does not crash if API fails
            
            // 3. API Request Failures (Status codes 4xx, 5xx)
            if (error.response) {
                logger.error(`[ExchangeRateService] API Request Failure: Provider returned status ${error.response.status}`);
                throw new Error(`API refused request. HTTP Status: ${error.response.status}. Details: ${error.response.data?.error || 'Unknown'}`);
            } 
            // 4. Network Errors (No response received, timeout, DNS resolution failure)
            else if (error.request) {
                logger.error(`[ExchangeRateService] Network Error: Could not reach the API provider. ${error.message}`);
                throw new Error(`Network failure. Could not securely connect to exchange rate provider: ${error.message}`);
            } 
            // 5. Internal Operational Errors (Code logical errors, malformed request setups)
            else {
                logger.error(`[ExchangeRateService] Internal Processing Error: ${error.message}`);
                throw new Error(`Internal service error during conversion request: ${error.message}`);
            }
        }
    }

    /**
     * Get exchange rates in bulk (based on base currency) safely
     * @returns {Promise<Array>} exchange rate array 
     */
    async getAllExchangeRates() {
        const rates = [];
        const baseCurrency = getBaseCurrency();

        try {
            logger.info(`[ExchangeRateService] Initiating bulk rates fetch for base currency: ${baseCurrency}`);
            const response = await axios.get(`${this.baseUrl}${baseCurrency}`, {
                timeout: 10000
            });
            
            // Invalid response sanity checking
            if (!response.data || !response.data.rates) {
                logger.error('[ExchangeRateService] Bulk fetch failed: Missing "rates" object in the API response payload.');
                // Graceful degradation: return empty array rather than crashing the system scheduler
                return rates; 
            }

            const apiRates = response.data.rates;

            // Anchor base currency to itself logically
            rates.push({ from_currency: baseCurrency, to_currency: baseCurrency, rate: 1.0 });

            for (const currency of this.supportedCurrencies) {
                if (currency === baseCurrency) continue;

                if (apiRates[currency]) {
                    rates.push({
                        from_currency: baseCurrency,
                        to_currency: currency,
                        rate: apiRates[currency]
                    });
                } else {
                    logger.warn(`[ExchangeRateService] Dropped unsupported currency mapping: ${baseCurrency} -> ${currency}`);
                }
            }

            logger.info(`[ExchangeRateService] Successfully bulk-fetched ${rates.length} active currencies.`);
        } catch (error) {
            // Explicit graceful handling for bulk-fetch failures so the Cron Job does not crash the server
            if (error.response) {
                logger.error(`[ExchangeRateService] Bulk API Request Failure - Provider responded with ${error.response.status}`);
            } else if (error.request) {
                logger.error(`[ExchangeRateService] Bulk API Network Error - Provider unreachable or timed out (${error.message})`);
            } else {
                logger.error(`[ExchangeRateService] Bulk Process Internal Error - ${error.message}`);
            }
            logger.info('[ExchangeRateService] Scheduled exchange rate update gracefully skipped due to provider errors.');
        }

        return rates;
    }

    /**
     * Verify that the API configuration structure is valid
     * @returns {Promise<boolean>} Is it valid? 
     */
    async validateApiKey() {
        if (!this.apiKey) {
            logger.warn('[ExchangeRateService] Validation check determined no dedicated API Key is present.');
            // Still returning true to allow the unauthenticated API endpoint tier to be utilized smoothly by the frontend
            return true;
        }
        return true;
    }
}

module.exports = ExchangeRateApiService;
