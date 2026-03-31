const express = require('express');
const TemplateController = require('../controllers/templateController');

const router = express.Router();

/* * 
* Template related routing 
* Provide query and preview functions for notification templates */

// Get a list of supported languages
// GET /api/templates/languages
router.get('/languages', TemplateController.getSupportedLanguages);

// Get a list of supported notification types
// GET /api/templates/types
router.get('/types', TemplateController.getSupportedNotificationTypes);

// Get a list of supported channels
// GET /api/templates/channels?notificationType=renewal_reminder&language=zh-CN
router.get('/channels', TemplateController.getSupportedChannels);

// Get a specific template
// GET /api/templates/template?notificationType=renewal_reminder&language=zh-CN&channel=telegram
router.get('/template', TemplateController.getTemplate);

// Get an overview of all templates
// GET /api/templates/overview
router.get('/overview', TemplateController.getTemplateOverview);

// Preview template rendering results
// POST /api/templates/preview
router.post('/preview', TemplateController.previewTemplate);

module.exports = router;
