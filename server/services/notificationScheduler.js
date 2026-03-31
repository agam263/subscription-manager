const cron = require('node-cron');
const NotificationService = require('./notificationService');
const { createDatabaseConnection } = require('../config/database');

class NotificationScheduler {
    constructor() {
        this.db = createDatabaseConnection();
        this.notificationService = new NotificationService(this.db);
        this.job = null;
        this.currentSchedule = null;
    }

    /* * 
* Start notification scheduler */
    start() {
        this.updateSchedule();
        console.log('✅ Notification scheduler started');
    }

    /* * 
* Update scheduler settings */
    updateSchedule() {
        try {
            // Get the current scheduler settings
            const settings = this.getSchedulerSettings();

            // If there is already a task running with the same settings, no update is required
            if (this.currentSchedule &&
                this.currentSchedule.time === settings.notification_check_time &&
                this.currentSchedule.timezone === settings.timezone &&
                this.currentSchedule.enabled === settings.is_enabled) {
                return;
            }

            // Stop existing task
            if (this.job) {
                this.job.stop();
                this.job = null;
            }

            // If the scheduler is disabled, new tasks are not started
            if (!settings.is_enabled) {
                console.log('⏸️ Notification scheduler is disabled');
                this.currentSchedule = null;
                return;
            }

            // Parse time setting (HH:MM format)
            const [hour, minute] = settings.notification_check_time.split(':');
            const cronExpression = `${minute} ${hour} * * *`;

            // Create a new scheduled task
            this.job = cron.schedule(cronExpression, async () => {
                console.log(`🔔 Starting notification check at ${settings.notification_check_time}...`);
                await this.checkAndSendNotifications();
            }, {
                scheduled: false,
                timezone: settings.timezone
            });

            this.job.start();

            // Record current settings
            this.currentSchedule = {
                time: settings.notification_check_time,
                timezone: settings.timezone,
                enabled: settings.is_enabled
            };

            console.log(`✅ Notification scheduler updated: ${settings.notification_check_time} (${settings.timezone})`);
        } catch (error) {
            console.error('Error updating notification schedule:', error);
        }
    }

    /* * 
* Get scheduler settings */
    getSchedulerSettings() {
        try {
            const query = `
                SELECT notification_check_time, timezone, is_enabled
                FROM scheduler_settings
                WHERE id = 1
            `;
            const result = this.db.prepare(query).get();

            // If not set, returns default value
            if (!result) {
                return {
                    notification_check_time: '09:00',
                    timezone: 'Asia/Shanghai',
                    is_enabled: true
                };
            }

            return result;
        } catch (error) {
            console.error('Error getting scheduler settings:', error);
            // Return to default settings
            return {
                notification_check_time: '09:00',
                timezone: 'Asia/Shanghai',
                is_enabled: true
            };
        }
    }

    /* * 
* Stop notification scheduler */
    stop() {
        if (this.job) {
            this.job.stop();
            this.job = null;
            console.log('⏹️ Notification scheduler stopped');
        }
    }

    /* * 
* Check and send notifications */
    async checkAndSendNotifications() {
        try {
            console.log('🔍 Checking for notifications to send...');

            // Check for renewal reminders
            const renewalNotifications = await this.getRenewalNotifications();
            console.log(`📅 Found ${renewalNotifications.length} renewal reminders`);
            
            for (const notification of renewalNotifications) {
                await this.sendNotification(notification);
            }

            // Check for expiration warnings
            const expirationNotifications = await this.getExpirationNotifications();
            console.log(`⚠️ Found ${expirationNotifications.length} expiration warnings`);
            
            for (const notification of expirationNotifications) {
                await this.sendNotification(notification);
            }

            console.log(`✅ Processed ${renewalNotifications.length + expirationNotifications.length} notifications`);
        } catch (error) {
            console.error('❌ Notification check failed:', error);
        }
    }

    /* * 
* Get the subscriptions that need to send renewal reminders */
    async getRenewalNotifications() {
        try {
            // Find subscriptions that will expire within the advance_days period (1 to advance_days from now)
            let query = `
                SELECT s.*, ns.advance_days, ns.notification_channels, ns.repeat_notification, 'renewal_reminder' as notification_type
                FROM subscriptions s
                CROSS JOIN notification_settings ns
                WHERE ns.notification_type = 'renewal_reminder'
                    AND ns.is_enabled = 1
                    AND s.status = 'active'
                    AND s.next_billing_date BETWEEN date('now', '+1 day') AND date('now', '+' || ns.advance_days || ' days')
            `;

            // If repeat_notification is disabled, add check to prevent duplicate notifications
            query += `
                AND (ns.repeat_notification = 1 OR NOT EXISTS (
                    SELECT 1 FROM notification_history nh
                    WHERE nh.subscription_id = s.id
                    AND nh.notification_type = 'renewal_reminder'
                    AND nh.status = 'sent'
                    AND date(nh.created_at) >= date('now', '-' || ns.advance_days || ' days')
                ))
            `;

            return this.db.prepare(query).all();
        } catch (error) {
            console.error('Error getting renewal notifications:', error);
            return [];
        }
    }

    /* * 
* Get the subscriptions that need to send expiration warnings */
    async getExpirationNotifications() {
        try {
            // Find subscriptions that expired exactly yesterday (next_billing_date = yesterday)
            // This ensures we only send expiration warning once, on the first day after expiration
            const query = `
                SELECT s.*, ns.notification_channels, 'expiration_warning' as notification_type
                FROM subscriptions s
                CROSS JOIN notification_settings ns
                WHERE ns.notification_type = 'expiration_warning'
                    AND ns.is_enabled = 1
                    AND s.status = 'active'
                    AND s.next_billing_date = date('now', '-1 day')
                    AND NOT EXISTS (
                        SELECT 1 FROM notification_history nh
                        WHERE nh.subscription_id = s.id
                        AND nh.notification_type = 'expiration_warning'
                        AND nh.status = 'sent'
                        AND date(nh.created_at) = date('now')
                    )
            `;

            return this.db.prepare(query).all();
        } catch (error) {
            console.error('Error getting expiration notifications:', error);
            return [];
        }
    }

    /* * 
* Send notification */
    async sendNotification(subscription) {
        try {
            const result = await this.notificationService.sendNotification({
                subscriptionId: subscription.id,
                notificationType: subscription.notification_type,
                channels: JSON.parse(subscription.notification_channels || '["telegram"]')
            });

            if (result.success) {
                console.log(`✅ Notification sent for subscription: ${subscription.name} (${subscription.notification_type})`);
            } else {
                console.error(`❌ Failed to send notification for subscription: ${subscription.name}`, result.error);
            }
        } catch (error) {
            console.error(`❌ Error sending notification for subscription: ${subscription.name}`, error);
        }
    }

    /* * 
* Manually trigger notification check */
    async triggerCheck() {
        console.log('🔔 Manually triggering notification check...');
        await this.checkAndSendNotifications();
    }

    /* * 
* Update scheduler settings */
    updateSchedulerSettings(settings) {
        try {
            const query = `
                UPDATE scheduler_settings
                SET notification_check_time = ?, timezone = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `;

            const result = this.db.prepare(query).run(
                settings.notification_check_time,
                settings.timezone,
                settings.is_enabled ? 1 : 0
            );

            if (result.changes === 0) {
                // If no rows are updated, the record does not exist and needs to be inserted.
                const insertQuery = `
                    INSERT INTO scheduler_settings (id, notification_check_time, timezone, is_enabled)
                    VALUES (1, ?, ?, ?)
                `;
                this.db.prepare(insertQuery).run(
                    settings.notification_check_time,
                    settings.timezone,
                    settings.is_enabled ? 1 : 0
                );
            }

            // Update scheduler
            this.updateSchedule();

            return { success: true };
        } catch (error) {
            console.error('Error updating scheduler settings:', error);
            return { success: false, error: error.message };
        }
    }

    /* * 
* Get scheduler status */
    getStatus() {
        return {
            running: this.job !== null,
            nextRun: this.job ? this.job.running : false
        };
    }

    /* * 
* Close the database connection */
    close() {
        if (this.db) {
            this.db.close();
        }
        if (this.notificationService) {
            this.notificationService.close();
        }
    }
}

module.exports = NotificationScheduler;