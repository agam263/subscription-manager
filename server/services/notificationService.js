const TelegramService = require('./telegramService');
const EmailService = require('./emailService');
const { createDatabaseConnection } = require('../config/database');
const UserPreferenceService = require('./userPreferenceService');
const { getTemplate } = require('../config/notificationTemplates');
const {
  SUPPORTED_NOTIFICATION_TYPES,
  SUPPORTED_CHANNELS,
  DEFAULT_NOTIFICATION_CHANNELS
} = require('../config/notification');

class NotificationService {
    constructor(db = null) {
        this.db = db || createDatabaseConnection();
        this.telegramService = new TelegramService();
        this.emailService = new EmailService();
        this.userPreferenceService = new UserPreferenceService(this.db);
    }

    /* * 
* Send notification 
* @param {Object} notificationData - notification data 
* @param {number} notificationData.subscriptionId - subscription ID 
* @param {string} notificationData.notificationType - notification type 
* @param {string[]} [notificationData.channels] - specified notification channels 
* @returns {Promise<Object>} sends the result */
    async sendNotification(notificationData) {
        const {
            subscriptionId,
            notificationType,
            channels = null
        } = notificationData;

        try {
            // Validation notification type
            if (!SUPPORTED_NOTIFICATION_TYPES.includes(notificationType)) {
                return { success: false, message: 'Invalid notification type' };
            }

            // Get notification settings
            const settings = this.getNotificationSettings(notificationType);
            if (!settings || !settings.is_enabled) {
                return { success: false, message: 'Notification type disabled' };
            }

            // Get subscription information
            const subscription = this.getSubscriptionById(subscriptionId);
            if (!subscription) {
                return { success: false, message: 'Subscription not found' };
            }

            // Get configured notification channels
            const targetChannels = channels || this.getEnabledChannels();

            // Send to all channels in parallel to reduce overall time
            const results = await Promise.all(
                targetChannels.map((channel) =>
                    this.sendToChannel({
                        subscription,
                        notificationType,
                        channel,
                        settings
                    })
                )
            );

            return { success: true, results };
        } catch (error) {
            console.error('Notification service error:', error);
            return { success: false, error: error.message };
        }
    }

    /* * 
*Send to designated channel 
* @param {Object} params - send parameters 
* @param {Object} params.subscription - subscription information 
* @param {string} params.notificationType - notification type 
* @param {string} params.channel - notification channel 
* @param {Object} params.settings - notification settings 
* @returns {Promise<Object>} sends the result */
    async sendToChannel({ subscription, notificationType, channel, settings }) {
        try {
            const channelConfig = this.getChannelConfig(channel);
            if (!channelConfig || !channelConfig.is_active) {
                return { success: false, channel, message: 'Channel not configured' };
            }

            // Get user language preference (single-user system)
            const userLanguage = this.userPreferenceService.getUserLanguage();

            // Render message template
            const { content: messageContent, subject } = this.renderMessageTemplate({
                subscription,
                notificationType,
                channel,
                language: userLanguage
            });

            const recipient = this.getRecipient(channelConfig);
            const sendTime = new Date();

            // Send notification
            let sendResult;
            switch (channel) {
                case 'telegram':
                    sendResult = await this.telegramService.sendMessage(
                        recipient,
                        messageContent
                    );
                    break;
                case 'email':
                    sendResult = await this.sendEmailNotification({
                        recipient,
                        subscription,
                        notificationType,
                        subject,
                        htmlContent: messageContent
                    });
                    break;
                default:
                    sendResult = { success: false, error: `Unsupported channel: ${channel}` };
            }

            // Directly create notification records of final status
            const notificationRecord = this.createNotificationRecord({
                subscriptionId: subscription.id,
                notificationType,
                channelType: channel,
                recipient,
                messageContent,
                status: sendResult.success ? 'sent' : 'failed',
                sentAt: sendResult.success ? sendTime : null,
                errorMessage: sendResult.error || null
            });

            // Update channel last usage time
            this.updateChannelLastUsed(channel);

            return sendResult;
        } catch (error) {
            console.error(`Error sending to ${channel}:`, error);
            return { success: false, channel, error: error.message };
        }
    }

    /* * 
* Get notification settings 
* @param {string} notificationType - notification type 
* @returns {Object|null} notification settings */
    getNotificationSettings(notificationType) {
        try {
            const query = `
                SELECT * FROM notification_settings
                WHERE notification_type = ?
            `;
            const result = this.db.prepare(query).get(notificationType);
            return result;
        } catch (error) {
            console.error('Error getting notification settings:', error);
            return null;
        }
    }

    /* * 
* Get subscription information 
* @param {number} subscriptionId - subscription ID 
* @returns {Object|null} subscription information */
    getSubscriptionById(subscriptionId) {
        try {
            const query = `
                SELECT s.*, c.label as category_label, pm.label as payment_method_label
                FROM subscriptions s
                LEFT JOIN categories c ON s.category_id = c.id
                LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
                WHERE s.id = ?
            `;
            const result = this.db.prepare(query).get(subscriptionId);
            return result;
        } catch (error) {
            console.error('Error getting subscription:', error);
            return null;
        }
    }

    /* * 
* Get enabled notification channels 
* @returns {Array<string>} channel list */
    getEnabledChannels() {
        try {
            const query = `
                SELECT channel_type FROM notification_channels
                WHERE is_active = 1
            `;
            const results = this.db.prepare(query).all();

            if (results.length === 0) {
                return DEFAULT_NOTIFICATION_CHANNELS; // Use default channel
            }

            return results.map(row => row.channel_type);
        } catch (error) {
            console.error('Error getting enabled channels:', error);
            return DEFAULT_NOTIFICATION_CHANNELS;
        }
    }

    /* * 
* Get channel configuration 
* @param {string} channelType - channel type 
* @returns {Object|null} channel configuration */
    getChannelConfig(channelType) {
        try {
            const query = `
                SELECT * FROM notification_channels
                WHERE channel_type = ?
            `;
            const result = this.db.prepare(query).get(channelType);
            if (result) {
                try {
                    result.config = JSON.parse(result.channel_config);
                } catch (parseError) {
                    console.error('Error parsing channel config JSON:', parseError);
                    result.config = {};
                }
            }
            return result;
        } catch (error) {
            console.error('Error getting channel config:', error);
            return null;
        }
    }

    /* * 
* Render message template 
* @param {Object} params - template parameters 
* @returns {string} Rendered message */
    renderMessageTemplate({ subscription, notificationType, channel, language = 'zh-CN' }) {
        try {
            // Get template
            const template = this.getTemplate(notificationType, language, channel);
            if (!template) {
                return {
                    content: this.getDefaultContent(subscription, notificationType, language),
                    subject: this.getDefaultSubject(subscription, notificationType, language)
                };
            }

            // Prepare template data
            const templateData = {
                name: subscription.name,
                plan: subscription.plan,
                amount: subscription.amount,
                currency: subscription.currency,
                next_billing_date: this.formatDate(subscription.next_billing_date, language),
                payment_method: subscription.payment_method_label || subscription.payment_method_id,
                status: subscription.status,
                billing_cycle: subscription.billing_cycle
            };

            // Simple template replacement
            const replacePlaceholders = (input) => {
                if (!input) return input;
                let output = input;
                Object.keys(templateData).forEach(key => {
                    const regex = new RegExp(`{{${key}}}`, 'g');
                    output = output.replace(regex, templateData[key] ?? '');
                });
                return output;
            };

            const content = replacePlaceholders(template.content_template);
            const subject = replacePlaceholders(template.subject_template) ||
                this.getDefaultSubject(subscription, notificationType, language);

            return { content, subject };
        } catch (error) {
            console.error('Error rendering template:', error);
            return {
                content: this.getDefaultContent(subscription, notificationType, language),
                subject: this.getDefaultSubject(subscription, notificationType, language)
            };
        }
    }

    /* * 
* Get template (supports language fallback) 
* @param {string} notificationType - notification type 
* @param {string} language - language 
* @param {string} channel - channel 
* @returns {Object|null} template */
    getTemplate(notificationType, language, channel) {
        try {
            // Use templates from configuration files
            return getTemplate(notificationType, language, channel);
        } catch (error) {
            console.error('Error getting template:', error);
            return null;
        }
    }

    /* * 
* Get the default message content 
* @param {Object} subscription - subscription information 
* @param {string} notificationType - notification type 
* @returns {string} default message */
    getDefaultContent(subscription, notificationType, language = 'zh-CN') {
        const typeMessages = {
            renewal_reminder: `续订提醒: ${subscription.name} 将在 ${this.formatDate(subscription.next_billing_date)} 到期，金额: ${subscription.amount} ${subscription.currency}`,
            expiration_warning: `过期警告: ${subscription.name} 已在 ${this.formatDate(subscription.next_billing_date)} 过期`,
            renewal_success: `续订成功: ${subscription.name} 续订成功，金额: ${subscription.amount} ${subscription.currency}`,
            renewal_failure: `续订失败: ${subscription.name} 续订失败，金额: ${subscription.amount} ${subscription.currency}`,
            subscription_change: `订阅变更: ${subscription.name} 信息已更新`
        };

        const fallback = typeMessages[notificationType] || `订阅通知: ${subscription.name}`;
        if (language.startsWith('en')) {
            const englishFallbacks = {
                renewal_reminder: `Renewal reminder: ${subscription.name} will renew on ${this.formatDate(subscription.next_billing_date, 'en-US')}, amount: ${subscription.amount} ${subscription.currency}`,
                expiration_warning: `Expiration warning: ${subscription.name} expired on ${this.formatDate(subscription.next_billing_date, 'en-US')}`,
                renewal_success: `Renewal success: ${subscription.name} renewed successfully, amount: ${subscription.amount} ${subscription.currency}`,
                renewal_failure: `Renewal failure: ${subscription.name} renewal failed, amount: ${subscription.amount} ${subscription.currency}`,
                subscription_change: `Subscription change: ${subscription.name} has been updated`
            };
            return englishFallbacks[notificationType] || `Subscription notification: ${subscription.name}`;
        }

        return fallback;
    }

    /* * 
* Get the default email subject */
    getDefaultSubject(subscription, notificationType, language = 'zh-CN') {
        const subjects = {
            renewal_reminder: language.startsWith('en') ? `Renewal Reminder - ${subscription.name}` : `续订提醒 - ${subscription.name}`,
            expiration_warning: language.startsWith('en') ? `Subscription Expired - ${subscription.name}` : `订阅已过期 - ${subscription.name}`,
            renewal_success: language.startsWith('en') ? `Renewal Successful - ${subscription.name}` : `续订成功 - ${subscription.name}`,
            renewal_failure: language.startsWith('en') ? `Renewal Failed - ${subscription.name}` : `续订失败 - ${subscription.name}`,
            subscription_change: language.startsWith('en') ? `Subscription Updated - ${subscription.name}` : `订阅变更通知 - ${subscription.name}`
        };

        return subjects[notificationType] || (language.startsWith('en') ? `Subscription Notification - ${subscription.name}` : `订阅通知 - ${subscription.name}`);
    }

    /* * 
* Create notification records 
* @param {Object} data - notification data 
* @param {number} data.subscriptionId - subscription ID 
* @param {string} data.notificationType - notification type 
* @param {string} data.channelType - channel type 
* @param {string} data.recipient - receiver 
* @param {string} data.messageContent - message content 
* @param {string} data.status - status ('sent' or 'failed') 
* @param {Date} [data.sentAt] - sending time 
* @param {string} [data.errorMessage] - error message 
* @returns {Object} records created */
    createNotificationRecord(data) {
        try {
            const query = `
                INSERT INTO notification_history
                (subscription_id, notification_type, channel_type, status, recipient, message_content, sent_at, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const result = this.db.prepare(query).run(
                data.subscriptionId,
                data.notificationType,
                data.channelType,
                data.status, // 'sent' or 'failed'
                data.recipient,
                data.messageContent,
                data.sentAt ? data.sentAt.toISOString() : null,
                data.errorMessage || null
            );
            return { id: result.lastInsertRowid, ...data };
        } catch (error) {
            console.error('Error creating notification record:', error);
            throw error;
        }
    }



    /* * 
* Update the last usage time of the channel 
* @param {string} channelType - channel type */
    updateChannelLastUsed(channelType) {
        try {
            const query = `
                UPDATE notification_channels
                SET last_used_at = CURRENT_TIMESTAMP
                WHERE channel_type = ?
            `;
            this.db.prepare(query).run(channelType);
        } catch (error) {
            console.error('Error updating channel last used time:', error);
        }
    }

    /* * 
* Get receiver information 
* @param {Object} channelConfig - channel configuration 
* @returns {string} receiver information */
    getRecipient(channelConfig) {
        if (channelConfig.config) {
            if (channelConfig.config.chat_id) {
                return channelConfig.config.chat_id;
            }
            if (channelConfig.config.email) {
                return channelConfig.config.email;
            }
            if (channelConfig.config.address) {
                return channelConfig.config.address;
            }
        }
        return channelConfig.channel_config; // Compatible with older formats
    }

    /* * 
* Format date 
* @param {string} dateString - date string 
* @returns {string} formatted date */
    formatDate(dateString, language = 'zh-CN') {
        try {
            if (!dateString) {
                const locale = language || 'zh-CN';
                return locale.startsWith('en') ? 'Unknown date' : '未知日期';
            }

            const date = new Date(dateString);
            const locale = language || 'zh-CN';
            return date.toLocaleDateString(locale);
        } catch (error) {
            return dateString;
        }
    }

    /* * 
* Configure notification channels 
* @param {string} channelType - channel type 
* @param {Object} config - configuration information 
* @returns {Object} configuration results */
    async configureChannel(channelType, config) {
        try {
            let isActive = 1;

            if (channelType === 'telegram') {
                if (!config.chat_id || config.chat_id.trim() === '') {
                    config.chat_id = null;
                    isActive = 0;
                }
            }
            
            const configJson = JSON.stringify(config);

            // Check if it already exists (without limiting is_active status)
            const existingQuery = `
                SELECT * FROM notification_channels
                WHERE channel_type = ?
            `;
            const existing = this.db.prepare(existingQuery).get(channelType);

            if (existing) {
                // Update existing configuration
                const query = `
                    UPDATE notification_channels
                    SET channel_config = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE channel_type = ?
                `;
                this.db.prepare(query).run(configJson, isActive, channelType);
            } else {
                // Create new configuration
                const query = `
                    INSERT INTO notification_channels (channel_type, channel_config, is_active)
                    VALUES (?, ?, ?)
                `;
                this.db.prepare(query).run(channelType, configJson, isActive);
            }

            return { success: true, message: 'Channel configured successfully' };
        } catch (error) {
            console.error('Error configuring channel:', error);
            return { success: false, error: error.message };
        }
    }

    /* * 
*Test notification 
* @param {string} channelType - channel type 
* @returns {Promise<Object>} test results */
    async testNotification(channelType) {
        try {
            const channelConfig = this.getChannelConfig(channelType);
            if (!channelConfig) {
                return { success: false, message: 'Channel not configured' };
            }

            if (channelType === 'telegram') {
                const chatId = this.getRecipient(channelConfig);
                return await this.telegramService.sendTestMessage(chatId);
            }

            if (channelType === 'email') {
                const address = this.getRecipient(channelConfig);
                return await this.emailService.sendTestMail(address);
            }

            return { success: false, message: 'Unsupported channel type' };
        } catch (error) {
            console.error('Error testing notification:', error);
            return { success: false, error: error.message };
        }
    }

    /* * 
* Email sending implementation */
    async sendEmailNotification({ recipient, subscription, notificationType, subject, htmlContent }) {
        if (!this.emailService.isConfigured()) {
            return { success: false, error: 'Email service not configured' };
        }

        const fallbackSubject = this.getDefaultSubject(subscription, notificationType);
        const finalSubject = subject || fallbackSubject;
        const plainText = this.stripHtml(htmlContent);

        const htmlBody = /<[^>]+>/.test(htmlContent) ? htmlContent : `<p>${htmlContent}</p>`;

        return this.emailService.sendMail({
            to: recipient,
            subject: finalSubject,
            html: htmlBody,
            text: plainText
        });
    }

    /* * 
* Simple HTML to plain text */
    stripHtml(html) {
        if (!html) return '';
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    /* * 
* Get notification history 
* @param {Object} options - query options 
* @returns {Object} An object containing data and totals */
    getNotificationHistory(options = {}) {
        try {
            const { page = 1, limit = 20, status, type } = options;
            const offset = (page - 1) * limit;

            // Build base query
            let baseQuery = `
                FROM notification_history nh
                LEFT JOIN subscriptions s ON nh.subscription_id = s.id
                WHERE 1=1
            `;

            const params = [];
            const countParams = [];
            
            if (status) {
                baseQuery += ' AND nh.status = ?';
                params.push(status);
                countParams.push(status);
            }
            
            if (type) {
                baseQuery += ' AND nh.notification_type = ?';
                params.push(type);
                countParams.push(type);
            }

            // Get total count
            const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
            const countResult = this.db.prepare(countQuery).get(...countParams);
            const total = countResult.total;

            // Get paginated data
            const dataQuery = `
                SELECT nh.*, s.name as subscription_name
                ${baseQuery}
                ORDER BY nh.created_at DESC LIMIT ? OFFSET ?
            `;
            params.push(limit, offset);
            const data = this.db.prepare(dataQuery).all(...params);

            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error getting notification history:', error);
            return {
                data: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0
            };
        }
    }

    /* * 
* Close the database connection */
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = NotificationService;
