const express = require('express');
const MonthlyCategorySummaryController = require('../controllers/monthlyCategorySummaryController');

function createMonthlyCategorySummaryRoutes(db) {
    const router = express.Router();
    const controller = new MonthlyCategorySummaryController(db);

    // GET monthly category summaries with filters (Public)
    router.get('/', controller.getMonthlyCategorySummary);

    // GET single month category summary (Public)
    router.get('/:year/:month', controller.getMonthCategorySummary);

    // GET total summary (Public)
    router.get('/total', controller.getTotalSummary);

    return router;
}

function createProtectedMonthlyCategorySummaryRoutes(db) {
    const router = express.Router();
    const controller = new MonthlyCategorySummaryController(db);

    // POST recalculate all monthly category summaries (Protected)
    router.post('/recalculate', controller.recalculateAllSummaries);

    // POST process specific payment for monthly category summaries (Protected)
    router.post('/process-payment/:paymentId', controller.processPayment);

    return router;
}

module.exports = {
    createMonthlyCategorySummaryRoutes,
    createProtectedMonthlyCategorySummaryRoutes
};
