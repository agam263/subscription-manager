const express = require('express');
const AnalyticsController = require('../controllers/analyticsController');

function createAnalyticsRoutes(db) {
    const router = express.Router();
    const controller = new AnalyticsController(db);

    // GET monthly revenue statistics (Public)
    router.get('/monthly-revenue', controller.getMonthlyRevenue);

    // GET monthly active subscriptions statistics (Public)
    router.get('/monthly-active-subscriptions', controller.getMonthlyActiveSubscriptions);

    // GET revenue trends analysis (Public)
    router.get('/revenue-trends', controller.getRevenueTrends);

    // GET subscription overview (Public)
    router.get('/subscription-overview', controller.getSubscriptionOverview);

    return router;
}

module.exports = {
    createAnalyticsRoutes
};
