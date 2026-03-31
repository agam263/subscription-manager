const express = require('express');
const NotificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

function createNotificationRoutes(db) {
    const router = express.Router();
    const notificationController = new NotificationController();

    // Public routes
    router.get('/history', notificationController.getNotificationHistory);
    router.get('/stats', notificationController.getNotificationStats);
    
    return router;
}

function createProtectedNotificationRoutes(db) {
    const router = express.Router();
    const notificationController = new NotificationController();

    // Notification settings routing
    router.get('/settings', notificationController.getAllSettings);
    router.get('/settings/:type', notificationController.getSettings);
    router.put('/settings/:id', notificationController.updateSetting);

    // Channel configuration routing
    router.post('/channels', notificationController.configureChannel);
    router.get('/channels/:channelType', notificationController.getChannelConfig);

    // Notification operation routing
    router.post('/send', notificationController.sendNotification);
    router.post('/test', notificationController.testNotification);

    // History routing
    router.get('/history', notificationController.getNotificationHistory);

    // Statistical routing
    router.get('/stats', notificationController.getNotificationStats);

    // Telegram related routes
    router.post('/validate-chat-id', notificationController.validateChatId);
    router.get('/telegram/bot-info', notificationController.getBotInfo);
    router.get('/telegram/config-status', notificationController.getTelegramConfigStatus);

    return router;
}

module.exports = { createNotificationRoutes, createProtectedNotificationRoutes };