/* * 
* Currency configuration file 
* Centrally manage the list of supported currencies to avoid duplicate definitions in multiple services */

// All supported currency codes (fixed)
const ALL_CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'TRY', 'HKD'];

// Base currency configuration - read from environment variables, defaults to CNY
let BASE_CURRENCY = process.env.BASE_CURRENCY || 'CNY';

// Verify that the base currency is in the list of supported currencies
if (!ALL_CURRENCY_CODES.includes(BASE_CURRENCY)) {
    console.warn(`⚠️  Invalid BASE_CURRENCY: ${BASE_CURRENCY}. Using default: CNY`);
    BASE_CURRENCY = 'CNY';
}

/* * 
* List of supported currency codes (base currency first, others in alphabetical order) 
* These currencies support exchange rate API acquisition and conversion */
const SUPPORTED_CURRENCY_CODES = [
    BASE_CURRENCY,
    ...ALL_CURRENCY_CODES.filter(code => code !== BASE_CURRENCY).sort()
];

// Details for all currencies (fixed)
const ALL_CURRENCIES = [
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' }
];

/* * 
* Supported currency details (base currency first, others in alphabetical order) */
const SUPPORTED_CURRENCIES = [
    ALL_CURRENCIES.find(c => c.code === BASE_CURRENCY),
    ...ALL_CURRENCIES.filter(c => c.code !== BASE_CURRENCY).sort((a, b) => a.code.localeCompare(b.code))
];

// Base exchange rate configuration - dynamically generated based on the base currency
const BASE_RATES = {
    CNY: {
        CNY: 1.0000,
        USD: 0.1538,
        EUR: 0.1308,
        GBP: 0.1154,
        CAD: 0.1923,
        AUD: 0.2077,
        JPY: 16.9231,
        TRY: 4.2000,
        HKD: 1.1923
    },
    USD: {
        USD: 1.0000,
        CNY: 6.5000,
        EUR: 0.8500,
        GBP: 0.7500,
        CAD: 1.2500,
        AUD: 1.3500,
        JPY: 110.0000,
        TRY: 27.0000,
        HKD: 7.8000
    },
    EUR: {
        EUR: 1.0000,
        USD: 1.1765,
        CNY: 7.6471,
        GBP: 0.8824,
        CAD: 1.4706,
        AUD: 1.5882,
        JPY: 129.4118,
        TRY: 31.7647,
        HKD: 9.1765
    },
    GBP: {
        GBP: 1.0000,
        USD: 1.3333,
        CNY: 8.6667,
        EUR: 1.1333,
        CAD: 1.6667,
        AUD: 1.8000,
        JPY: 146.6667,
        TRY: 36.0000,
        HKD: 10.3333
    },
    CAD: {
        CAD: 1.0000,
        USD: 0.8000,
        CNY: 5.2000,
        EUR: 0.6800,
        GBP: 0.6000,
        AUD: 1.0800,
        JPY: 88.0000,
        TRY: 21.6000,
        HKD: 6.2400
    },
    AUD: {
        AUD: 1.0000,
        USD: 0.7407,
        CNY: 4.8148,
        EUR: 0.6296,
        GBP: 0.5556,
        CAD: 0.9259,
        JPY: 81.4815,
        TRY: 20.0000,
        HKD: 5.7778
    },
    JPY: {
        JPY: 1.0000,
        USD: 0.0091,
        CNY: 0.0591,
        EUR: 0.0077,
        GBP: 0.0068,
        CAD: 0.0114,
        AUD: 0.0123,
        TRY: 0.2455,
        HKD: 0.0667
    },
    TRY: {
        TRY: 1.0000,
        USD: 0.0370,
        CNY: 0.2381,
        EUR: 0.0315,
        GBP: 0.0278,
        CAD: 0.0463,
        AUD: 0.0500,
        JPY: 4.0741,
        HKD: 0.2889
    },
    HKD: {
        HKD: 1.0000,
        USD: 0.1282,
        CNY: 0.8387,
        EUR: 0.1089,
        GBP: 0.0965,
        CAD: 0.1603,
        AUD: 0.1731,
        JPY: 14.1026,
        TRY: 3.4615
    }
};

/* * 
*Default exchange rate data (dynamically generated based on base currency) 
* Used for database initialization */
const DEFAULT_EXCHANGE_RATES = Object.entries(BASE_RATES[BASE_CURRENCY] || {}).map(([to_currency, rate]) => ({
    from_currency: BASE_CURRENCY,
    to_currency,
    rate
}));

/* * 
* Verify currency code is supported 
* @param {string} currencyCode - currency code 
* @returns {boolean} whether supported */
function isSupportedCurrency(currencyCode) {
    return SUPPORTED_CURRENCY_CODES.includes(currencyCode?.toUpperCase());
}

/* * 
* Get currency information 
* @param {string} currencyCode - currency code 
* @returns {Object|null} currency information object or null */
function getCurrencyInfo(currencyCode) {
    return SUPPORTED_CURRENCIES.find(currency => 
        currency.code === currencyCode?.toUpperCase()
    ) || null;
}

/* * 
* Get currency symbol 
* @param {string} currencyCode - currency code 
* @returns {string} currency symbol */
function getCurrencySymbol(currencyCode) {
    const currency = getCurrencyInfo(currencyCode);
    return currency ? currency.symbol : currencyCode;
}

/* * 
* Get base currency 
* @returns {string} base currency code */
function getBaseCurrency() {
    return BASE_CURRENCY;
}

/* * 
* Check if it is the base currency 
* @param {string} currencyCode - currency code 
* @returns {boolean} whether it is the base currency */
function isBaseCurrency(currencyCode) {
    return currencyCode?.toUpperCase() === BASE_CURRENCY;
}

/* * 
* Get the exchange rate data of the specified base currency 
* @param {string} baseCurrency - base currency code 
* @returns {Array} exchange rate array */
function getExchangeRatesForBase(baseCurrency = BASE_CURRENCY) {
    const rates = BASE_RATES[baseCurrency];
    if (!rates) {
        throw new Error(`No exchange rates found for base currency: ${baseCurrency}`);
    }

    return Object.entries(rates).map(([to_currency, rate]) => ({
        from_currency: baseCurrency,
        to_currency,
        rate
    }));
}

module.exports = {
    BASE_CURRENCY,
    SUPPORTED_CURRENCY_CODES,
    SUPPORTED_CURRENCIES,
    DEFAULT_EXCHANGE_RATES,
    BASE_RATES,
    isSupportedCurrency,
    getCurrencyInfo,
    getCurrencySymbol,
    getBaseCurrency,
    isBaseCurrency,
    getExchangeRatesForBase
};