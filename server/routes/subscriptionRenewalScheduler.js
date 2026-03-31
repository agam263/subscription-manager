const express = require('express');
const SubscriptionRenewalSchedulerController = require('../controllers/subscriptionRenewalSchedulerController');

/* * 
* Create routes related to subscription renewal scheduled tasks 
* @param {Object} subscriptionRenewalScheduler - subscription renewal scheduled task service instance 
* @returns {Object} Express router */
function createSubscriptionRenewalSchedulerRoutes(subscriptionRenewalScheduler) {
    const router = express.Router();
    const schedulerController = new SubscriptionRenewalSchedulerController(subscriptionRenewalScheduler);

    // Get scheduled task status (public interface)
    router.get('/status', schedulerController.getStatus);

    return router;
}

/* * 
* Create protected subscription renewal scheduled task routing (requires API key) 
* @param {Object} subscriptionRenewalScheduler - subscription renewal scheduled task service instance 
* @returns {Object} Express router */
function createProtectedSubscriptionRenewalSchedulerRoutes(subscriptionRenewalScheduler) {
    const router = express.Router();
    const schedulerController = new SubscriptionRenewalSchedulerController(subscriptionRenewalScheduler);

    // Manually trigger maintenance tasks (requires API key)
    router.post('/maintenance/run', schedulerController.runMaintenanceNow);

    return router;
}

module.exports = {
    createSubscriptionRenewalSchedulerRoutes,
    createProtectedSubscriptionRenewalSchedulerRoutes
};
