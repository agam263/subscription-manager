const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/responseHelper');

/* * 
* Subscription renewal scheduled task controller 
* Process HTTP requests related to subscription renewal scheduled tasks */
class SubscriptionRenewalSchedulerController {
    constructor(subscriptionRenewalScheduler) {
        this.subscriptionRenewalScheduler = subscriptionRenewalScheduler;
    }

    /* * 
* Manually trigger maintenance tasks */
    runMaintenanceNow = asyncHandler(async (req, res) => {
        const result = await this.subscriptionRenewalScheduler.runMaintenanceNow();

        if (result.success) {
            success(res, result, 'Maintenance completed successfully');
        } else {
            error(res, result.error || 'Maintenance failed', 500);
        }
    });

    /* * 
* Get scheduled task status */
    getStatus = asyncHandler(async (req, res) => {
        const status = this.subscriptionRenewalScheduler.getStatus();
        success(res, status, 'Scheduler status retrieved');
    });
}

module.exports = SubscriptionRenewalSchedulerController;
