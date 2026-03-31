const express = require('express');
const PaymentHistoryController = require('../controllers/paymentHistoryController');

function createPaymentHistoryRoutes(db) {
    const router = express.Router();
    const controller = new PaymentHistoryController(db);

    // GET payment history list (Public)
    router.get('/', controller.getPaymentHistory);

    // GET payment record by ID (Public)
    router.get('/:id', controller.getPaymentById);

    // GET monthly payment statistics (Public)
    router.get('/stats/monthly', controller.getMonthlyStats);

    // GET yearly payment statistics (Public)
    router.get('/stats/yearly', controller.getYearlyStats);

    // GET quarterly payment statistics (Public)
    router.get('/stats/quarterly', controller.getQuarterlyStats);

    return router;
}

function createProtectedPaymentHistoryRoutes(db) {
    const router = express.Router();
    const controller = new PaymentHistoryController(db);

    // POST create new payment record (Protected)
    router.post('/', controller.createPayment);

    // POST bulk create payment records (Protected)
    router.post('/bulk', controller.bulkCreatePayments);

    // PUT update payment record (Protected)
    router.put('/:id', controller.updatePayment);

    // DELETE payment record (Protected)
    router.delete('/:id', controller.deletePayment);

    // POST recalculate monthly expenses (Protected)
    router.post('/recalculate-monthly-expenses', controller.recalculateMonthlyExpenses);

    return router;
}

module.exports = {
    createPaymentHistoryRoutes,
    createProtectedPaymentHistoryRoutes
};