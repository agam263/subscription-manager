const ExchangeRateDbService = require('../services/exchangeRateDbService');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleQueryResult, handleDbResult, validationError, success, notFound } = require('../utils/responseHelper');
const { createValidator } = require('../utils/validator');
const { isSupportedCurrency } = require('../config/currencies');

/* * 
* Exchange rate controller 
* Handle exchange rate-related HTTP requests */
class ExchangeRateController {
    constructor(db) {
        this.exchangeRateService = new ExchangeRateDbService(db);
    }

    /* * 
* Get all exchange rates */
    getAllExchangeRates = asyncHandler(async (req, res) => {
        const rates = await this.exchangeRateService.getAllExchangeRates();
        handleQueryResult(res, rates, 'Exchange rates');
    });

    /* * 
* Get the exchange rate for a specific currency pair */
    getExchangeRate = asyncHandler(async (req, res) => {
        const { from, to } = req.params;

        // Verify currency code
        const validator = createValidator();
        validator
            .required(from, 'from')
            .string(from, 'from')
            .length(from, 'from', 3, 3)
            .required(to, 'to')
            .string(to, 'to')
            .length(to, 'to', 3, 3);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const rate = await this.exchangeRateService.getExchangeRate(from, to);
        
        if (!rate) {
            return notFound(res, `Exchange rate for ${from.toUpperCase()}/${to.toUpperCase()}`);
        }

        handleQueryResult(res, rate, 'Exchange rate');
    });

    /* * 
* Get all exchange rates for a currency */
    getRatesForCurrency = asyncHandler(async (req, res) => {
        const { currency } = req.params;

        // Verify currency code
        const validator = createValidator();
        validator
            .required(currency, 'currency')
            .string(currency, 'currency')
            .length(currency, 'currency', 3, 3);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const rates = await this.exchangeRateService.getRatesForCurrency(currency);
        handleQueryResult(res, rates, `Exchange rates for ${currency.toUpperCase()}`);
    });

    /* * 
* Create or update exchange rates */
    upsertExchangeRate = asyncHandler(async (req, res) => {
        const { from_currency, to_currency, rate, source = 'manual' } = req.body;

        // Validate input data
        const validator = createValidator();
        validator
            .required(from_currency, 'from_currency')
            .string(from_currency, 'from_currency')
            .length(from_currency, 'from_currency', 3, 3)
            .custom(from_currency, 'from_currency',
                (value) => isSupportedCurrency(value),
                'Currency is not supported'
            )
            .required(to_currency, 'to_currency')
            .string(to_currency, 'to_currency')
            .length(to_currency, 'to_currency', 3, 3)
            .custom(to_currency, 'to_currency',
                (value) => isSupportedCurrency(value),
                'Currency is not supported'
            )
            .required(rate, 'rate')
            .number(rate, 'rate')
            .range(rate, 'rate', 0.000001, Infinity)
            .string(source, 'source');

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        // Verify currency pairs cannot be the same
        if (from_currency.toUpperCase() === to_currency.toUpperCase()) {
            return validationError(res, 'from_currency and to_currency cannot be the same');
        }

        const result = await this.exchangeRateService.upsertExchangeRate(
            from_currency, 
            to_currency, 
            rate, 
            source
        );

        const operation = result.operation === 'create' ? 'create' : 'update';
        handleDbResult(res, result, operation, 'Exchange rate');
    });

    /* * 
* Update exchange rates in batches */
    bulkUpsertExchangeRates = asyncHandler(async (req, res) => {
        const { rates, source = 'api' } = req.body;

        // Validate input data
        const validator = createValidator();
        validator
            .required(rates, 'rates')
            .array(rates, 'rates')
            .string(source, 'source');

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        if (rates.length === 0) {
            return validationError(res, 'rates array cannot be empty');
        }

        // Validate each exchange rate data
        for (let i = 0; i < rates.length; i++) {
            const rateData = rates[i];
            const rateValidator = createValidator();
            
            rateValidator
                .required(rateData.from_currency, `rates[${i}].from_currency`)
                .string(rateData.from_currency, `rates[${i}].from_currency`)
                .length(rateData.from_currency, `rates[${i}].from_currency`, 3, 3)
                .custom(rateData.from_currency, `rates[${i}].from_currency`,
                    (value) => isSupportedCurrency(value),
                    'Currency is not supported'
                )
                .required(rateData.to_currency, `rates[${i}].to_currency`)
                .string(rateData.to_currency, `rates[${i}].to_currency`)
                .length(rateData.to_currency, `rates[${i}].to_currency`, 3, 3)
                .custom(rateData.to_currency, `rates[${i}].to_currency`,
                    (value) => isSupportedCurrency(value),
                    'Currency is not supported'
                )
                .required(rateData.rate, `rates[${i}].rate`)
                .number(rateData.rate, `rates[${i}].rate`)
                .range(rateData.rate, `rates[${i}].rate`, 0.000001, Infinity);

            if (rateValidator.hasErrors()) {
                return validationError(res, rateValidator.getErrors());
            }

            if (rateData.from_currency.toUpperCase() === rateData.to_currency.toUpperCase()) {
                return validationError(res, `rates[${i}]: from_currency and to_currency cannot be the same`);
            }
        }

        const result = await this.exchangeRateService.bulkUpsertExchangeRates(rates, source);
        
        success(res, result, 'Bulk exchange rate update completed');
    });

    /* * 
* Delete exchange rate */
    deleteExchangeRate = asyncHandler(async (req, res) => {
        const { from, to } = req.params;

        // Verify currency code
        const validator = createValidator();
        validator
            .required(from, 'from')
            .string(from, 'from')
            .length(from, 'from', 3, 3)
            .required(to, 'to')
            .string(to, 'to')
            .length(to, 'to', 3, 3);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.exchangeRateService.deleteExchangeRate(from, to);
        handleDbResult(res, result, 'delete', 'Exchange rate');
    });

    /* * 
* Currency conversion */
    convertCurrency = asyncHandler(async (req, res) => {
        const { amount, from, to } = req.query;

        // Validate input parameters
        const validator = createValidator();
        validator
            .required(amount, 'amount')
            .number(parseFloat(amount), 'amount')
            .range(parseFloat(amount), 'amount', 0, Infinity)
            .required(from, 'from')
            .string(from, 'from')
            .length(from, 'from', 3, 3)
            .custom(from, 'from',
                (value) => isSupportedCurrency(value),
                'Currency is not supported'
            )
            .required(to, 'to')
            .string(to, 'to')
            .length(to, 'to', 3, 3)
            .custom(to, 'to',
                (value) => isSupportedCurrency(value),
                'Currency is not supported'
            );

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.exchangeRateService.convertCurrency(
            parseFloat(amount), 
            from, 
            to
        );

        handleQueryResult(res, result, 'Currency conversion');
    });

    /* * 
* Get exchange rate statistics */
    getExchangeRateStats = asyncHandler(async (req, res) => {
        const stats = await this.exchangeRateService.getExchangeRateStats();
        handleQueryResult(res, stats, 'Exchange rate statistics');
    });

    /* * 
* Verify exchange rate data */
    validateExchangeRateData = asyncHandler(async (req, res) => {
        const { from_currency, to_currency, rate } = req.body;

        const validator = createValidator();
        const errors = [];

        // Verify source currency
        if (!from_currency || typeof from_currency !== 'string' || from_currency.length !== 3) {
            errors.push({ field: 'from_currency', message: 'from_currency must be a 3-character currency code' });
        } else if (!isSupportedCurrency(from_currency)) {
            errors.push({ field: 'from_currency', message: 'from_currency is not supported' });
        }

        // Verify target currency
        if (!to_currency || typeof to_currency !== 'string' || to_currency.length !== 3) {
            errors.push({ field: 'to_currency', message: 'to_currency must be a 3-character currency code' });
        } else if (!isSupportedCurrency(to_currency)) {
            errors.push({ field: 'to_currency', message: 'to_currency is not supported' });
        }

        // Verify exchange rate
        const rateNum = parseFloat(rate);
        if (isNaN(rateNum) || rateNum <= 0) {
            errors.push({ field: 'rate', message: 'rate must be a positive number' });
        }

        // Verify currency pairs cannot be the same
        if (from_currency && to_currency && from_currency.toUpperCase() === to_currency.toUpperCase()) {
            errors.push({ field: 'currencies', message: 'from_currency and to_currency cannot be the same' });
        }

        const isValid = errors.length === 0;

        success(res, {
            isValid,
            errors,
            data: isValid ? {
                from_currency: from_currency.toUpperCase(),
                to_currency: to_currency.toUpperCase(),
                rate: rateNum
            } : null
        }, 'Exchange rate data validation completed');
    });
}

module.exports = ExchangeRateController;
