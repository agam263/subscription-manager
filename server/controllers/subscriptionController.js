const SubscriptionService = require('../services/subscriptionService');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleQueryResult, handleDbResult, validationError } = require('../utils/responseHelper');
const { validateSubscription, validateSubscriptionWithForeignKeys } = require('../utils/validator');

class SubscriptionController {
    constructor(db) {
        this.db = db;
        this.subscriptionService = new SubscriptionService(db);
    }

    /* * 
* Get all subscriptions */
    getAllSubscriptions = asyncHandler(async (req, res) => {
        const subscriptions = await this.subscriptionService.getAllSubscriptions();
        handleQueryResult(res, subscriptions, 'Subscriptions');
    });

    /* * 
* Get a single subscription based on ID */
    getSubscriptionById = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const subscription = await this.subscriptionService.getSubscriptionById(id);
        handleQueryResult(res, subscription, 'Subscription');
    });

    /* * 
* Create new subscription */
    createSubscription = asyncHandler(async (req, res) => {
        const subscriptionData = req.body;

        // Validate data (including foreign key validation)
        const validator = validateSubscriptionWithForeignKeys(subscriptionData, this.db);
        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.subscriptionService.createSubscription(subscriptionData);
        handleDbResult(res, result, 'create', 'Subscription');
    });

    /* * 
* Create subscriptions in batches */
    bulkCreateSubscriptions = asyncHandler(async (req, res) => {
        const subscriptionsData = req.body;
        
        if (!Array.isArray(subscriptionsData)) {
            return validationError(res, 'Request body must be an array of subscriptions');
        }

        // Verify each subscription
        for (let i = 0; i < subscriptionsData.length; i++) {
            const validator = validateSubscriptionWithForeignKeys(subscriptionsData[i], this.db);
            if (validator.hasErrors()) {
                return validationError(res, `Subscription ${i + 1}: ${validator.getErrors().map(e => e.message).join(', ')}`);
            }
        }

        const result = await this.subscriptionService.bulkCreateSubscriptions(subscriptionsData);
        handleDbResult(res, result, 'create', 'Subscriptions');
    });

    /* * 
* Update subscription */
    updateSubscription = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        // Validate data (not all fields required when updating)
        const validator = validateSubscriptionWithForeignKeys(updateData, this.db);
        // Remove required validation as only some fields may be updated when updating
        validator.errors = validator.errors.filter(error => !error.message.includes('is required'));

        if (validator.hasErrors()) {
            return validationError(res, validator.getErrors());
        }

        const result = await this.subscriptionService.updateSubscription(id, updateData);
        handleDbResult(res, result, 'update', 'Subscription');
    });

    /* * 
* Delete subscription */
    deleteSubscription = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await this.subscriptionService.deleteSubscription(id);
        handleDbResult(res, result, 'delete', 'Subscription');
    });

    /* * 
* Get subscription statistics */
    getSubscriptionStats = asyncHandler(async (req, res) => {
        const stats = await this.subscriptionService.getSubscriptionStats();
        handleQueryResult(res, stats, 'Subscription statistics');
    });

    /* * 
* Get expiring subscriptions */
    getUpcomingRenewals = asyncHandler(async (req, res) => {
        const { days = 7 } = req.query;
        const upcomingRenewals = await this.subscriptionService.getUpcomingRenewals(parseInt(days));
        handleQueryResult(res, upcomingRenewals, 'Upcoming renewals');
    });

    /* * 
* Get expired subscriptions */
    getExpiredSubscriptions = asyncHandler(async (req, res) => {
        const expiredSubscriptions = await this.subscriptionService.getExpiredSubscriptions();
        handleQueryResult(res, expiredSubscriptions, 'Expired subscriptions');
    });

    /* * 
* Get subscriptions by category */
    getSubscriptionsByCategory = asyncHandler(async (req, res) => {
        const { category } = req.params;
        const subscriptions = await this.subscriptionService.getSubscriptionsByCategory(category);
        handleQueryResult(res, subscriptions, 'Subscriptions by category');
    });

    /* * 
* Get subscriptions by status */
    getSubscriptionsByStatus = asyncHandler(async (req, res) => {
        const { status } = req.params;
        const subscriptions = await this.subscriptionService.getSubscriptionsByStatus(status);
        handleQueryResult(res, subscriptions, 'Subscriptions by status');
    });

    /* * 
* Search subscriptions */
    searchSubscriptions = asyncHandler(async (req, res) => {
        const { q: query } = req.query;
        if (!query) {
            return validationError(res, 'Search query is required');
        }

        const subscriptions = await this.subscriptionService.searchSubscriptions(query);
        handleQueryResult(res, subscriptions, 'Search results');
    });

    /* * 
* Get the payment history of a subscription */
    getSubscriptionPaymentHistory = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const paymentHistory = await this.subscriptionService.getSubscriptionPaymentHistory(id);
        handleQueryResult(res, paymentHistory, 'Payment history');
    });

    /* * 
*Reset all subscription data */
    resetAllSubscriptions = asyncHandler(async (req, res) => {
        const result = await this.subscriptionService.resetAllSubscriptions();
        handleQueryResult(res, result, 'Reset result');
    });
}

module.exports = SubscriptionController;
