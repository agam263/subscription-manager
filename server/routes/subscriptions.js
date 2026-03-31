const express = require('express');
const SubscriptionController = require('../controllers/subscriptionController');

function createSubscriptionRoutes(db) {
    const router = express.Router();
    const controller = new SubscriptionController(db);

    // GET all subscriptions (Public)
    router.get('/', controller.getAllSubscriptions);

    // GET single subscription by ID (Public)
    router.get('/:id', controller.getSubscriptionById);

    // GET subscription statistics (Public)
    router.get('/stats/overview', controller.getSubscriptionStats);

    // GET upcoming renewals (Public)
    router.get('/stats/upcoming-renewals', controller.getUpcomingRenewals);

    // GET expired subscriptions (Public)
    router.get('/stats/expired', controller.getExpiredSubscriptions);

    // GET subscriptions by category (Public)
    router.get('/category/:category', controller.getSubscriptionsByCategory);

    // GET subscriptions by status (Public)
    router.get('/status/:status', controller.getSubscriptionsByStatus);

    // GET search subscriptions (Public)
    router.get('/search', controller.searchSubscriptions);

    // GET subscription payment history (Public)
    router.get('/:id/payment-history', controller.getSubscriptionPaymentHistory);

    return router;
}

function createProtectedSubscriptionRoutes(db) {
    const router = express.Router();
    const controller = new SubscriptionController(db);

    // POST create new subscription (Protected)
    router.post('/', controller.createSubscription);

    // POST bulk create subscriptions (Protected)
    router.post('/bulk', controller.bulkCreateSubscriptions);

    // PUT update subscription (Protected)
    router.put('/:id', controller.updateSubscription);

    // DELETE subscription (Protected)
    router.delete('/:id', controller.deleteSubscription);

    // POST reset all subscriptions (Protected)
    router.post('/reset', controller.resetAllSubscriptions);

    return router;
}

module.exports = {
    createSubscriptionRoutes,
    createProtectedSubscriptionRoutes
};
