const axios = require('axios');
const config = require('../config');

class TelegramService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.apiBaseUrl = `https://api.telegram.org/bot${this.botToken}`;
        this.client = axios.create({
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    /* * 
* Send Telegram message 
* @param {string} chatId - Telegram Chat ID 
* @param {string} text - message content 
* @param {Object} options - Send options 
* @returns {Promise<Object>} sends the result */
    async sendMessage(chatId, text, options = {}) {
        try {
            if (!this.botToken) {
                throw new Error('Telegram Bot Token not configured');
            }

            if (!chatId) {
                throw new Error('Chat ID is required');
            }

            const response = await this.client.post(`${this.apiBaseUrl}/sendMessage`, {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                ...options
            });

            return {
                success: true,
                messageId: response.data.result.message_id,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Telegram notification failed:', error);
            return {
                success: false,
                error: error.response?.data?.description || error.message
            };
        }
    }

    /* * 
* Verify whether the Chat ID is valid 
* @param {string} chatId - Telegram Chat ID 
* @returns {Promise<Object>} verification result */
    async validateChatId(chatId) {
        try {
            if (!this.botToken) {
                return { success: false, error: 'Telegram Bot Token not configured' };
            }

            const response = await this.client.get(`${this.apiBaseUrl}/getChat`, {
                params: { chat_id: chatId }
            });
            return { success: true, chatInfo: response.data.result };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.description || error.message || 'Invalid Chat ID'
            };
        }
    }

    /* * 
* Get Bot information 
* @returns {Promise<Object>} Bot information */
    async getBotInfo() {
        try {
            if (!this.botToken) {
                return { success: false, error: 'Telegram Bot Token not configured' };
            }

            const response = await this.client.get(`${this.apiBaseUrl}/getMe`);
            return { success: true, botInfo: response.data.result };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.description || error.message || 'Failed to get bot info'
            };
        }
    }

    /* * 
* Set up Webhook 
* @param {string} webhookUrl - Webhook URL 
* @returns {Promise<Object>} set the result */
    async setWebhook(webhookUrl) {
        try {
            if (!this.botToken) {
                throw new Error('Telegram Bot Token not configured');
            }

            const response = await this.client.post(`${this.apiBaseUrl}/setWebhook`, {
                url: webhookUrl
            });
            return { success: true, result: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /* * 
* Delete Webhook 
* @returns {Promise<Object>} delete result */
    async deleteWebhook() {
        try {
            if (!this.botToken) {
                throw new Error('Telegram Bot Token not configured');
            }

            const response = await this.client.post(`${this.apiBaseUrl}/deleteWebhook`);
            return { success: true, result: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /* * 
* Get Webhook information 
* @returns {Promise<Object>} Webhook information */
    async getWebhookInfo() {
        try {
            if (!this.botToken) {
                throw new Error('Telegram Bot Token not configured');
            }

            const response = await this.client.get(`${this.apiBaseUrl}/getWebhookInfo`);
            return { success: true, webhookInfo: response.data.result };
        } catch (error) {
            return { success: false, error: error.response?.data?.description };
        }
    }

    /* * 
* Get updates 
* @param {number} offset - offset 
* @param {number} limit - limit number 
* @returns {Promise<Object>} update message */
    async getUpdates(offset = 0, limit = 100) {
        try {
            if (!this.botToken) {
                throw new Error('Telegram Bot Token not configured');
            }

            const response = await this.client.get(`${this.apiBaseUrl}/getUpdates`, {
                params: { offset, limit }
            });
            return { success: true, updates: response.data.result };
        } catch (error) {
            return { success: false, error: error.response?.data?.description };
        }
    }

    /* * 
* Send test message 
* @param {string} chatId - Telegram Chat ID 
* @returns {Promise<Object>} sends the result */
    async sendTestMessage(chatId) {
        const testMessage = `🔔 <b>订阅管理系统测试消息</b>

这是一条来自订阅管理系统的测试消息。

如果您收到此消息，说明您的Telegram通知配置正确！

⏰ 发送时间: ${new Date().toLocaleString('zh-CN')}

如有问题，请联系管理员。`;

        return await this.sendMessage(chatId, testMessage);
    }

    /* * 
* Check whether Bot Token is configured 
* @returns {boolean} whether to configure */
    isConfigured() {
        return !!this.botToken && this.botToken !== 'your_telegram_bot_token_here';
    }

    /* * 
* Get configuration status 
* @returns {Object} configuration status */
    getConfigStatus() {
        return {
            configured: this.isConfigured(),
            hasToken: !!this.botToken,
            isPlaceholder: this.botToken === 'your_telegram_bot_token_here' || !this.botToken
        };
    }
}

module.exports = TelegramService;