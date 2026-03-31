const express = require('express');
const SubscriptionManagementController = require('../controllers/subscriptionManagementController');

function createSubscriptionManagementRoutes(db) {
    const router = express.Router();
    const controller = new SubscriptionManagementController(db);

    // POST to process auto renewals (Protected)
    router.post('/auto-renew', controller.processAutoRenewals);
    // POST to process expired manual subscriptions (Protected)
    router.post('/process-expired', controller.processExpiredSubscriptions);

    // POST to manually renew a subscription (Protected)
    router.post('/:id/manual-renew', controller.manualRenewSubscription);

    // POST to reactivate a cancelled subscription (Protected)
    router.post('/:id/reactivate', controller.reactivateSubscription);

    // POST to reset all subscriptions (Protected)
    router.post('/reset', controller.resetAllSubscriptions);

    // POST batch process subscriptions (Protected)
    router.post('/batch-process', controller.batchProcessSubscriptions);

    // GET subscription management statistics (Protected)
    router.get('/stats', controller.getSubscriptionManagementStats);

    // GET preview upcoming renewals (Protected)
    router.get('/upcoming-renewals', controller.previewUpcomingRenewals);



    return router;
}

module.exports = {
    createSubscriptionManagementRoutes
};
