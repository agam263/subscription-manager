const responseHelper = require('../utils/responseHelper');

class SchedulerController {
    constructor(notificationScheduler) {
        this.notificationScheduler = notificationScheduler;
    }

    /* * 
* Get scheduler settings */
    getSettings = (req, res) => {
        try {
            const settings = this.notificationScheduler.getSchedulerSettings();
            responseHelper.success(res, settings);
        } catch (error) {
            console.error('Error getting scheduler settings:', error);
            responseHelper.error(res, 'Failed to get scheduler settings', 500);
        }
    };

    /* * 
* Update scheduler settings */
    updateSettings = (req, res) => {
        try {
            const { notification_check_time, timezone, is_enabled } = req.body;

            // Validation time format (HH:MM)
            if (notification_check_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(notification_check_time)) {
                return responseHelper.badRequest(res, 'Invalid time format. Use HH:MM format.');
            }

            // Verify time zone
            const validTimezones = [
                'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Hong_Kong',
                'America/New_York', 'America/Los_Angeles', 'Europe/London', 
                'Europe/Paris', 'UTC'
            ];
            if (timezone && !validTimezones.includes(timezone)) {
                return responseHelper.badRequest(res, 'Invalid timezone.');
            }

            const settings = {
                notification_check_time: notification_check_time || '09:00',
                timezone: timezone || 'Asia/Shanghai',
                is_enabled: is_enabled !== undefined ? is_enabled : true
            };

            const result = this.notificationScheduler.updateSchedulerSettings(settings);

            if (result.success) {
                responseHelper.success(res, { message: 'Scheduler settings updated successfully', settings });
            } else {
                responseHelper.error(res, result.error || 'Failed to update scheduler settings', 400);
            }
        } catch (error) {
            console.error('Error updating scheduler settings:', error);
            responseHelper.error(res, 'Failed to update scheduler settings', 500);
        }
    };

    /* * 
* Get scheduler status */
    getStatus = (req, res) => {
        try {
            const status = this.notificationScheduler.getStatus();
            const settings = this.notificationScheduler.getSchedulerSettings();
            
            responseHelper.success(res, {
                ...status,
                settings,
                currentSchedule: this.notificationScheduler.currentSchedule
            });
        } catch (error) {
            console.error('Error getting scheduler status:', error);
            responseHelper.error(res, 'Failed to get scheduler status', 500);
        }
    };

    /* * 
* Manually trigger notification check */
    triggerCheck = async (req, res) => {
        try {
            await this.notificationScheduler.triggerCheck();
            responseHelper.success(res, { message: 'Notification check triggered successfully' });
        } catch (error) {
            console.error('Error triggering notification check:', error);
            responseHelper.error(res, 'Failed to trigger notification check', 500);
        }
    };
}

module.exports = SchedulerController;
