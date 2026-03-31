const { createDatabaseConnection } = require('../config/database');

/**
 * User Preference Service
 * Manages user language preferences and other settings
 */
class UserPreferenceService {
    constructor(db = null) {
        this.db = db || createDatabaseConnection();
    }

    /**
     * Get user language preference (single user system)
     * @returns {string} Language code (e.g., 'zh-CN', 'en')
     */
    getUserLanguage() {
        try {
            const query = `SELECT language FROM settings WHERE id = 1`;
            const result = this.db.prepare(query).get();
            return result ? result.language : 'zh-CN'; // Default fallback
        } catch (error) {
            console.error('Error getting user language:', error);
            return 'zh-CN'; // Default fallback
        }
    }

    /**
     * Set user language preference (single user system)
     * @param {string} language - Language code
     * @returns {boolean} Success status
     */
    setUserLanguage(language) {
        try {
            // Validate language code
            const supportedLanguages = ['zh-CN', 'en', 'ja', 'ko', 'fr', 'de', 'es'];
            if (!supportedLanguages.includes(language)) {
                throw new Error(`Unsupported language: ${language}`);
            }

            const query = `
                UPDATE settings
                SET language = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            `;
            const result = this.db.prepare(query).run(language);

            if (result.changes === 0) {
                // If no rows affected, insert new record
                const insertQuery = `
                    INSERT OR REPLACE INTO settings (id, language, currency, theme, show_original_currency)
                    VALUES (1, ?, 'CNY', 'system', 1)
                `;
                this.db.prepare(insertQuery).run(language);
            }

            console.log(`User language preference updated to: ${language}`);
            return true;
        } catch (error) {
            console.error('Error setting user language:', error);
            return false;
        }
    }

    /**
     * Get all user preferences
     * @param {number} userId - User ID (default: 1 for single user system)
     * @returns {Object} User preferences object
     */
    getUserPreferences(userId = 1) {
        try {
            const query = `SELECT * FROM settings WHERE id = ?`;
            const result = this.db.prepare(query).get(userId);
            
            if (!result) {
                // Return default preferences if not found
                return {
                    id: userId,
                    currency: 'CNY',
                    theme: 'system',
                    show_original_currency: true,
                    language: 'zh-CN'
                };
            }

            return result;
        } catch (error) {
            console.error('Error getting user preferences:', error);
            return {
                id: userId,
                currency: 'CNY',
                theme: 'system',
                show_original_currency: true,
                language: 'zh-CN'
            };
        }
    }

    /**
     * Update user preferences
     * @param {Object} preferences - Preferences object
     * @param {number} userId - User ID (default: 1 for single user system)
     * @returns {boolean} Success status
     */
    updateUserPreferences(preferences, userId = 1) {
        try {
            const allowedFields = ['currency', 'theme', 'show_original_currency', 'language'];
            const updateFields = [];
            const values = [];

            // Build dynamic update query
            for (const [key, value] of Object.entries(preferences)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(userId); // Add userId for WHERE clause

            const query = `
                UPDATE settings 
                SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;

            const result = this.db.prepare(query).run(...values);
            
            if (result.changes === 0) {
                // If no rows affected, insert new record with defaults
                const insertQuery = `
                    INSERT OR REPLACE INTO settings (id, currency, theme, show_original_currency, language) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                this.db.prepare(insertQuery).run(
                    userId,
                    preferences.currency || 'CNY',
                    preferences.theme || 'system',
                    preferences.show_original_currency !== undefined ? preferences.show_original_currency : 1,
                    preferences.language || 'zh-CN'
                );
            }

            console.log('User preferences updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating user preferences:', error);
            return false;
        }
    }

    /**
     * Get supported languages
     * @returns {Array} Array of supported language objects
     */
    getSupportedLanguages() {
        return [
            { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語' },
            { code: 'ko', name: 'Korean', nativeName: '한국어' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' }
        ];
    }

    /**
     * Get language name by code
     * @param {string} langCode - Language code
     * @returns {string} Language name
     */
    getLanguageName(langCode) {
        const languages = this.getSupportedLanguages();
        const language = languages.find(lang => lang.code === langCode);
        return language ? language.name : langCode;
    }

    /**
     * Validate language code
     * @param {string} langCode - Language code to validate
     * @returns {boolean} Validation result
     */
    validateLanguageCode(langCode) {
        const supportedCodes = this.getSupportedLanguages().map(lang => lang.code);
        return supportedCodes.includes(langCode);
    }
}

module.exports = UserPreferenceService;
