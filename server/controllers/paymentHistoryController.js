const PaymentHistoryService = require('../services/paymentHistoryService');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleQueryResult, handleDbResult, validationError } = require('../utils/responseHelper');
const { createValidator } = require('../utils/validator');
const { isSupportedCurrency } = require('../config/currencies');

class PaymentHistoryController {
    constructor(db) {
        this.paymentHistoryService = new PaymentHistoryService(db);
    }

    /* * 
* Get payment history list */
    getPaymentHistory = asyncHandler(async (req, res) => {
        const {
            subscription_id,
            start_date,
            end_date,
            status,
            currency,
            limit = 50,
            offset = 0
        } = req.query;

        const filters = {};
        if (subscription_id) filters.subscription_id = subscription_id;
        if (start_date) filters.start_date = start_date;
        if (end_date) filters.end_date = end_date;
        if (status) filters.status = status;
        if (currency) filters.currency = currency;

        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        const result = await this.paymentHistoryService.getPaymentHistory(filters, options);
        handleQueryResult(res, result, 'Payment history');
    });

    /* * 
* Get a single payment record based on ID */
    getPaymentById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const payment = await this.paymentHistoryService.getPaymentById(id);
        handleQueryResult(res, payment, 'Payment record');
    });

    /* * 
* Get monthly payment statistics */
    getMonthlyStats = asyncHandler(async (req, res) => {
        const { year, month } = req.query;
        
        const validator = createValidator();
        validator
            .required(year, 'year')
            .integer(year, 'year')
            .range(year, 'year', 2000, 3000)
            .required(month, 'month')
            .integer(month, 'month')
            .range(month, 'month', 1, 12);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const stats = await this.paymentHistoryService.getMonthlyStats(parseInt(year), parseInt(month));
        handleQueryResult(res, stats, 'Monthly payment statistics');
    });

    /* * 
* Get annual payment statistics */
    getYearlyStats = asyncHandler(async (req, res) => {
        const { year } = req.query;
        
        const validator = createValidator();
        validator
            .required(year, 'year')
            .integer(year, 'year')
            .range(year, 'year', 2000, 3000);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const stats = await this.paymentHistoryService.getYearlyStats(parseInt(year));
        handleQueryResult(res, stats, 'Yearly payment statistics');
    });

    /* * 
* Get quarterly payment statistics */
    getQuarterlyStats = asyncHandler(async (req, res) => {
        const { year, quarter } = req.query;
        
        const validator = createValidator();
        validator
            .required(year, 'year')
            .integer(year, 'year')
            .range(year, 'year', 2000, 3000)
            .required(quarter, 'quarter')
            .integer(quarter, 'quarter')
            .range(quarter, 'quarter', 1, 4);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const stats = await this.paymentHistoryService.getQuarterlyStats(parseInt(year), parseInt(quarter));
        handleQueryResult(res, stats, 'Quarterly payment statistics');
    });

    /* * 
* Create payment records */
    createPayment = asyncHandler(async (req, res) => {
        const paymentData = req.body;

        // Convert the front-end camelCase field name to the database snake_case field name
        const transformedData = this.transformPaymentData(paymentData);

        // Validate data
        const validator = this.validatePaymentData(transformedData);
        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.paymentHistoryService.createPayment(transformedData);
        handleDbResult(res, result, 'create', 'Payment record');
    });

    /* * 
* Update payment records */
    updatePayment = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        // Convert the front-end camelCase field name to the database snake_case field name
        const transformedData = this.transformPaymentData(updateData);

        // Validate data
        const validator = this.validatePaymentData(transformedData, false);
        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.paymentHistoryService.updatePayment(id, transformedData);
        handleDbResult(res, result, 'update', 'Payment record');
    });

    /* * 
* Delete payment history */
    deletePayment = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await this.paymentHistoryService.deletePayment(id);
        handleDbResult(res, result, 'delete', 'Payment record');
    });

    /* * 
* Create payment records in batches */
    bulkCreatePayments = asyncHandler(async (req, res) => {
        const paymentsData = req.body;

        if (!Array.isArray(paymentsData)) {
            return validationError(res, 'Request body must be an array of payment records');
        }

        // Convert and validate each record
        const transformedPaymentsData = [];
        for (let i = 0; i < paymentsData.length; i++) {
            const transformedData = this.transformPaymentData(paymentsData[i]);
            const validator = this.validatePaymentData(transformedData);
            if (validator.hasErrors()) {
                return validationError(res, `Record ${i + 1}: ${validator.getErrors().map(e => e.message).join(', ')}`);
            }
            transformedPaymentsData.push(transformedData);
        }

        const result = await this.paymentHistoryService.bulkCreatePayments(transformedPaymentsData);
        handleDbResult(res, result, 'create', 'Payment records');
    });

    /* * 
* Recalculate monthly fees */
    recalculateMonthlyExpenses = asyncHandler(async (req, res) => {
        await this.paymentHistoryService.recalculateMonthlyExpenses();
        handleQueryResult(res, { message: 'Monthly expenses recalculated successfully' }, 'Recalculation result');
    });

    /* * 
* Verify payment data */
    validatePaymentData(data, isCreate = true) {
        const validator = createValidator();
        
        if (isCreate) {
            validator
                .required(data.subscription_id, 'subscription_id')
                .required(data.payment_date, 'payment_date')
                .required(data.amount_paid, 'amount_paid')
                .required(data.currency, 'currency');
        }

        validator
            .integer(data.subscription_id, 'subscription_id')
            .date(data.payment_date, 'payment_date')
            .number(data.amount_paid, 'amount_paid')
            .range(data.amount_paid, 'amount_paid', 0)
            .string(data.currency, 'currency')
            .length(data.currency, 'currency', 3, 3)
            .custom(data.currency, 'currency',
                (value) => isSupportedCurrency(value),
                'Currency is not supported'
            )
            .date(data.billing_period_start, 'billing_period_start')
            .date(data.billing_period_end, 'billing_period_end')
            .enum(data.status, 'status', ['succeeded', 'failed', 'pending', 'cancelled', 'refunded'])
            .string(data.notes, 'notes');

        return validator;
    }

    /* * 
* Convert the front-end camelCase field name to the database snake_case field name */
    transformPaymentData(data) {
        const transformed = {};

        // Field name mapping table
        const fieldMapping = {
            subscriptionId: 'subscription_id',
            paymentDate: 'payment_date',
            amountPaid: 'amount_paid',
            billingPeriodStart: 'billing_period_start',
            billingPeriodEnd: 'billing_period_end'
        };

        // Convert field names
        Object.keys(data).forEach(key => {
            const dbFieldName = fieldMapping[key] || key;
            transformed[dbFieldName] = data[key];
        });

        return transformed;
    }
}

module.exports = PaymentHistoryController;
