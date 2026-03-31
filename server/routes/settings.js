const express = require('express');
const SettingsController = require('../controllers/settingsController');

function createSettingsRoutes(db) {
    const router = express.Router();
    const controller = new SettingsController(db);

    // GET settings (Public)
    router.get('/', controller.getSettings);

    // GET supported currencies (Public)
    router.get('/currencies', controller.getSupportedCurrencies);

    // GET supported themes (Public)
    router.get('/themes', controller.getSupportedThemes);

    // GET settings information (Public)
    router.get('/info', controller.getSettingsInfo);

    // GET validate currency (Public)
    router.get('/validate/currency/:currency', controller.validateCurrency);

    // GET validate theme (Public)
    router.get('/validate/theme/:theme', controller.validateTheme);

    return router;
}

function createProtectedSettingsRoutes(db) {
    const router = express.Router();
    const controller = new SettingsController(db);

    // PUT to update settings (Protected)
    router.put('/', controller.updateSettings);

    // POST to reset settings (Protected)
    router.post('/reset', controller.resetSettings);

    // PUT bulk update settings (Protected)
    router.put('/bulk', controller.bulkUpdateSettings);

    return router;
}

module.exports = {
    createSettingsRoutes,
    createProtectedSettingsRoutes
};
