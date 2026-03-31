const express = require('express');
const SchedulerController = require('../controllers/schedulerController');

/* * 
* Create scheduler-related routes 
* @param {Object} notificationScheduler - notification scheduler instance 
* @returns {Object} Express router */
function createSchedulerRoutes(notificationScheduler) {
    const router = express.Router();
    const schedulerController = new SchedulerController(notificationScheduler);

    // Get scheduler settings (public interface)
    router.get('/settings', schedulerController.getSettings);
    
    // Get scheduler status (public interface)
    router.get('/status', schedulerController.getStatus);

    return router;
}

/* * 
* Create protected scheduler routes (requires API key) 
* @param {Object} notificationScheduler - notification scheduler instance 
* @returns {Object} Express router */
function createProtectedSchedulerRoutes(notificationScheduler) {
    const router = express.Router();
    const schedulerController = new SchedulerController(notificationScheduler);

    // Update scheduler settings (requires API key)
    router.put('/settings', schedulerController.updateSettings);
    
    // Manually trigger notification checks (requires API key)
    router.post('/trigger', schedulerController.triggerCheck);

    return router;
}

module.exports = {
    createSchedulerRoutes,
    createProtectedSchedulerRoutes
};
