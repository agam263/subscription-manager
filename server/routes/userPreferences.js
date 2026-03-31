const express = require('express');
const router = express.Router();
const UserPreferenceService = require('../services/userPreferenceService');

const userPreferenceService = new UserPreferenceService();

/**
 * GET /api/user-preferences
 * Get user preferences
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 1; // Default to user 1 for single user system
        const preferences = userPreferenceService.getUserPreferences(parseInt(userId));
        
        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Error getting user preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user preferences',
            error: error.message
        });
    }
});

/**
 * PUT /api/user-preferences
 * Update user preferences
 */
router.put('/', async (req, res) => {
    try {
        const userId = req.body.userId || 1; // Default to user 1 for single user system
        const preferences = req.body.preferences;
        
        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid preferences data'
            });
        }

        const success = userPreferenceService.updateUserPreferences(preferences, parseInt(userId));
        
        if (success) {
            const updatedPreferences = userPreferenceService.getUserPreferences(parseInt(userId));
            res.json({
                success: true,
                message: 'User preferences updated successfully',
                data: updatedPreferences
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update user preferences'
            });
        }
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user preferences',
            error: error.message
        });
    }
});

/**
 * GET /api/user-preferences/language
 * Get user language preference
 */
router.get('/language', async (req, res) => {
    try {
        const userId = req.query.userId || 1;
        const language = userPreferenceService.getUserLanguage(parseInt(userId));
        
        res.json({
            success: true,
            data: {
                language: language,
                languageName: userPreferenceService.getLanguageName(language)
            }
        });
    } catch (error) {
        console.error('Error getting user language:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user language',
            error: error.message
        });
    }
});

/**
 * PUT /api/user-preferences/language
 * Set user language preference
 */
router.put('/language', async (req, res) => {
    try {
        const userId = req.body.userId || 1;
        const { language } = req.body;
        
        if (!language) {
            return res.status(400).json({
                success: false,
                message: 'Language code is required'
            });
        }

        // Validate language code
        if (!userPreferenceService.validateLanguageCode(language)) {
            return res.status(400).json({
                success: false,
                message: 'Unsupported language code',
                supportedLanguages: userPreferenceService.getSupportedLanguages()
            });
        }

        const success = userPreferenceService.setUserLanguage(language, parseInt(userId));
        
        if (success) {
            res.json({
                success: true,
                message: 'Language preference updated successfully',
                data: {
                    language: language,
                    languageName: userPreferenceService.getLanguageName(language)
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update language preference'
            });
        }
    } catch (error) {
        console.error('Error setting user language:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set user language',
            error: error.message
        });
    }
});

/**
 * GET /api/user-preferences/supported-languages
 * Get supported languages
 */
router.get('/supported-languages', async (req, res) => {
    try {
        const languages = userPreferenceService.getSupportedLanguages();
        
        res.json({
            success: true,
            data: languages
        });
    } catch (error) {
        console.error('Error getting supported languages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get supported languages',
            error: error.message
        });
    }
});

module.exports = router;
