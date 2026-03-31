const BaseRepository = require('../utils/BaseRepository');
const logger = require('../utils/logger');
const { SUPPORTED_CURRENCIES, isSupportedCurrency, getBaseCurrency } = require('../config/currencies');

/* * 
* 设置服务类
 * Handle business logic for application settings */
class SettingsService extends BaseRepository {
    constructor(db) {
        super(db, 'settings');
    }

    /* * 
* Get application settings 
* @returns {Object} setting data */
    async getSettings() {
        try {
            const settings = this.findById(1);
            return settings || this._getDefaultSettings();
        } catch (error) {
            logger.error('Failed to get settings:', error.message);
            throw error;
        }
    }

    /* * 
* Update application settings 
* @param {Object} updateData - the setting data to be updated 
* @param {string} updateData.currency - currency settings 
* @param {string} updateData.theme - theme settings 
* @returns {Object} update results */
    async updateSettings(updateData) {
        try {
            // Verify updated data
            this._validateUpdateData(updateData);

            // Prepare to update data
            const updates = {};
            if (updateData.currency) {
                updates.currency = updateData.currency;
            }
            if (updateData.theme) {
                updates.theme = updateData.theme;
            }
            if (updateData.show_original_currency !== undefined) {
                updates.show_original_currency = updateData.show_original_currency;
            }

            if (Object.keys(updates).length === 0) {
                throw new Error('No update fields provided');
            }

            // Add update timestamp
            updates.updated_at = new Date().toISOString();

            // perform update
            const result = this.update(1, updates);

            if (result.changes === 0) {
                // If no record is found, create default settings
                const defaultSettings = this._getDefaultSettings();
                const createData = { ...defaultSettings, ...updates, id: 1 };
                return this.create(createData);
            }

            return result;
        } catch (error) {
            logger.error('Failed to update settings:', error.message);
            throw error;
        }
    }

    /* * 
*Reset settings to default 
* @returns {Object} reset result */
    async resetSettings() {
        try {
            // Delete existing settings
            this.delete(1);

            // Create default settings
            const defaultSettings = this._getDefaultSettings();
            const result = this.create({ ...defaultSettings, id: 1 });

            logger.info('Settings reset to default values');
            return result;
        } catch (error) {
            logger.error('Failed to reset settings:', error.message);
            throw error;
        }
    }

    /* * 
* Verify currency code 
* @param {string} currency - currency code 
* @returns {boolean} whether it is valid */
    validateCurrency(currency) {
        return isSupportedCurrency(currency);
    }

    /* * 
* Verify theme settings 
* @param {string} theme - theme settings 
* @returns {boolean} whether it is valid */
    validateTheme(theme) {
        const validThemes = ['light', 'dark', 'system'];
        return validThemes.includes(theme);
    }

    /* * 
* Verification shows original currency settings 
* @param {boolean|number} showOriginalCurrency - displays the original currency setting 
* @returns {boolean} whether it is valid */
    validateShowOriginalCurrency(showOriginalCurrency) {
        return typeof showOriginalCurrency === 'boolean' ||
               showOriginalCurrency === 0 ||
               showOriginalCurrency === 1;
    }

    /* * 
* Get default settings 
* @private 
* @returns {Object} default settings */
    _getDefaultSettings() {
        return {
            currency: getBaseCurrency(),
            theme: 'system',
            show_original_currency: 1, // Use integer instead of boolean for SQLite
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    /* * 
* Verify updated data 
* @private 
* @param {Object} updateData - update data */
    _validateUpdateData(updateData) {
        if (updateData.currency && !this.validateCurrency(updateData.currency)) {
            throw new Error(`Invalid currency: ${updateData.currency}`);
        }

        if (updateData.theme && !this.validateTheme(updateData.theme)) {
            throw new Error(`Invalid theme: ${updateData.theme}`);
        }

        if (updateData.show_original_currency !== undefined && !this.validateShowOriginalCurrency(updateData.show_original_currency)) {
            throw new Error(`Invalid show_original_currency value: ${updateData.show_original_currency}`);
        }
    }

    /* * 
* Get the list of supported currencies 
* @returns {Array} currency list */
    getSupportedCurrencies() {
        return SUPPORTED_CURRENCIES;
    }

    /* * 
* Get list of supported themes 
* @returns {Array} topic list */
    getSupportedThemes() {
        return [
            { value: 'light', label: 'Light Theme', description: 'Light color scheme' },
            { value: 'dark', label: 'Dark Theme', description: 'Dark color scheme' },
            { value: 'system', label: 'System Default', description: 'Follow system preference' }
        ];
    }
}

module.exports = SettingsService;
