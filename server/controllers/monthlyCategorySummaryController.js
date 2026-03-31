const MonthlyCategorySummaryService = require('../services/monthlyCategorySummaryService');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleQueryResult, handleDbResult, validationError } = require('../utils/responseHelper');
const { createValidator } = require('../utils/validator');
const { getBaseCurrency } = require('../config/currencies');

/* * 
* Monthly summary controller 
* Provide efficient aggregated data API based on monthly_category_summary table */
class MonthlyCategorySummaryController {
    constructor(db) {
        this.db = db;
        this.monthlyCategorySummaryService = new MonthlyCategorySummaryService(db.name);
    }

    /* * 
* Get monthly classified summary data 
* GET /api/monthly-category-summary */
    getMonthlyCategorySummary = asyncHandler(async (req, res) => {
        const {
            start_year,
            start_month = 1,
            end_year,
            end_month = 12
        } = req.query;

        // Validation parameters
        const validator = createValidator();
        
        if (start_year) {
            validator
                .integer(start_year, 'start_year')
                .range(start_year, 'start_year', 2000, 3000);
        }
        
        if (end_year) {
            validator
                .integer(end_year, 'end_year')
                .range(end_year, 'end_year', 2000, 3000);
        }

        validator
            .integer(start_month, 'start_month')
            .range(start_month, 'start_month', 1, 12)
            .integer(end_month, 'end_month')
            .range(end_month, 'end_month', 1, 12);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        // Query the current year by default
        const currentYear = new Date().getFullYear();
        const startYear = parseInt(start_year) || currentYear;
        const endYear = parseInt(end_year) || currentYear;

        // Validate year range
        if (startYear > endYear) {
            return validationError(res, 'start_year cannot be greater than end_year');
        }

        const summaries = this.monthlyCategorySummaryService.getMonthlyCategorySummary(
            startYear,
            parseInt(start_month),
            endYear,
            parseInt(end_month)
        );

        // Format response data
        const formattedSummaries = this._formatSummariesResponse(summaries);

        const result = {
            summaries: formattedSummaries,
            summary: {
                totalRecords: formattedSummaries.length,
                dateRange: {
                    startYear,
                    startMonth: parseInt(start_month),
                    endYear,
                    endMonth: parseInt(end_month)
                }
            }
        };

        handleQueryResult(res, result, 'Monthly category summaries');
    });

    /* * 
* Get the classified summary for the specified month 
* GET /api/monthly-category-summary/:year/:month */
    getMonthCategorySummary = asyncHandler(async (req, res) => {
        const { year, month } = req.params;

        // Validation parameters
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

        const summaries = this.monthlyCategorySummaryService.getMonthCategorySummary(
            parseInt(year),
            parseInt(month)
        );

        const result = {
            year: parseInt(year),
            month: parseInt(month),
            categories: summaries.map(summary => ({
                categoryId: summary.category_id,
                categoryValue: summary.category_value,
                categoryLabel: summary.category_label,
                totalAmount: parseFloat(summary.total_amount_in_base_currency),
                baseCurrency: summary.base_currency,
                transactionsCount: summary.transactions_count,
                updatedAt: summary.updated_at
            })),
            totalAmount: summaries.reduce((sum, s) => sum + parseFloat(s.total_amount_in_base_currency), 0),
            totalTransactions: summaries.reduce((sum, s) => sum + s.transactions_count, 0),
            baseCurrency: summaries.length > 0 ? summaries[0].base_currency : getBaseCurrency()
        };

        handleQueryResult(res, result, 'Month category summary');
    });

    /* * 
* Get total summary data 
* GET /api/monthly-category-summary/total */
    getTotalSummary = asyncHandler(async (req, res) => {
        const {
            start_year,
            start_month = 1,
            end_year,
            end_month = 12
        } = req.query;

        // Validation parameters
        const validator = createValidator();
        
        if (start_year) {
            validator
                .integer(start_year, 'start_year')
                .range(start_year, 'start_year', 2000, 3000);
        }
        
        if (end_year) {
            validator
                .integer(end_year, 'end_year')
                .range(end_year, 'end_year', 2000, 3000);
        }

        validator
            .integer(start_month, 'start_month')
            .range(start_month, 'start_month', 1, 12)
            .integer(end_month, 'end_month')
            .range(end_month, 'end_month', 1, 12);

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        // Query the current year by default
        const currentYear = new Date().getFullYear();
        const startYear = parseInt(start_year) || currentYear;
        const endYear = parseInt(end_year) || currentYear;

        const total = this.monthlyCategorySummaryService.getTotalSummary(
            startYear,
            parseInt(start_month),
            endYear,
            parseInt(end_month)
        );

        const result = {
            dateRange: {
                startYear,
                startMonth: parseInt(start_month),
                endYear,
                endMonth: parseInt(end_month)
            },
            totalAmount: total ? parseFloat(total.total_amount) : 0,
            totalTransactions: total ? total.total_transactions : 0,
            baseCurrency: total ? total.base_currency : getBaseCurrency()
        };

        handleQueryResult(res, result, 'Total summary');
    });

    /* * 
* Recalculate all monthly subtotal data 
* POST /api/monthly-category-summary/recalculate */
    recalculateAllSummaries = asyncHandler(async (req, res) => {
        this.monthlyCategorySummaryService.recalculateAllMonthlyCategorySummaries();

        const result = {
            message: 'All monthly category summaries recalculated successfully',
            timestamp: new Date().toISOString()
        };

        handleQueryResult(res, result, 'Recalculation');
    });

    /* * 
* Process new payment records 
* POST /api/monthly-category-summary/process-payment/:paymentId */
    processPayment = asyncHandler(async (req, res) => {
        const { paymentId } = req.params;

        // Validation parameters
        const validator = createValidator();
        validator
            .required(paymentId, 'paymentId')
            .integer(paymentId, 'paymentId');

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        this.monthlyCategorySummaryService.processNewPayment(parseInt(paymentId));

        const result = {
            message: `Payment ${paymentId} processed successfully`,
            paymentId: parseInt(paymentId),
            timestamp: new Date().toISOString()
        };

        handleQueryResult(res, result, 'Payment processing');
    });

    /* * 
* Format summary response data 
* @private */
    _formatSummariesResponse(summaries) {
        return summaries.map(summary => ({
            year: summary.year,
            month: summary.month,
            monthKey: `${summary.year}-${summary.month.toString().padStart(2, '0')}`,
            categoryId: summary.category_id,
            categoryValue: summary.category_value,
            categoryLabel: summary.category_label,
            totalAmount: parseFloat(summary.total_amount_in_base_currency),
            baseCurrency: summary.base_currency,
            transactionsCount: summary.transactions_count,
            updatedAt: summary.updated_at
        }));
    }
}

module.exports = MonthlyCategorySummaryController;
