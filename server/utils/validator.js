const { ValidationError } = require('../middleware/errorHandler');
const { isSupportedCurrency } = require('../config/currencies');

/* * 
* Data validation tools */
class Validator {
    constructor() {
        this.errors = [];
    }

    /* * 
* Reset error list */
    reset() {
        this.errors = [];
        return this;
    }

    /* * 
* Add errors 
* @param {string} field - field name 
* @param {string} message - error message */
    addError(field, message) {
        this.errors.push({ field, message });
        return this;
    }

    /* * 
* Check for errors 
* @returns {boolean} */
    hasErrors() {
        return this.errors.length > 0;
    }

    /* * 
* Get error list 
* @returns {Array} */
    getErrors() {
        return this.errors;
    }

    /* * 
* Throw validation error */
    throwIfErrors() {
        if (this.hasErrors()) {
            const errorMessage = this.errors.map(err => `${err.field}: ${err.message}`).join(', ');
            throw new ValidationError(errorMessage);
        }
    }

    /* * 
* Validate required fields 
* @param {*} value - value 
* @param {string} field - field name */
    required(value, field) {
        if (value === undefined || value === null || value === '') {
            this.addError(field, `${field} is required`);
        }
        return this;
    }

    /* * 
* Verify string type 
* @param {*} value - value 
* @param {string} field - field name */
    string(value, field) {
        if (value !== undefined && value !== null && typeof value !== 'string') {
            this.addError(field, `${field} must be a string`);
        }
        return this;
    }

    /* * 
* Verify numeric type 
* @param {*} value - value 
* @param {string} field - field name */
    number(value, field) {
        if (value !== undefined && value !== null && (typeof value !== 'number' || isNaN(value))) {
            this.addError(field, `${field} must be a number`);
        }
        return this;
    }

    /* * 
* Verify integer type 
* @param {*} value - value 
* @param {string} field - field name */
    integer(value, field) {
        if (value !== undefined && value !== null && (!Number.isInteger(Number(value)))) {
            this.addError(field, `${field} must be an integer`);
        }
        return this;
    }

    /* * 
* Validate Boolean type (supports SQLite's integer Boolean value: 0/1) 
* @param {*} value - value 
* @param {string} field - field name */
    boolean(value, field) {
        if (value !== undefined && value !== null) {
            // Supports standard boolean values
            if (typeof value === 'boolean') {
                return this;
            }
            // Supports SQLite's integer boolean values: 0 = false, 1 = true
            if (value === 0 || value === 1) {
                return this;
            }
            // Supports Boolean values ​​in string form
            if (value === '0' || value === '1' ||
                value === 'true' || value === 'false') {
                return this;
            }

            this.addError(field, `${field} must be a boolean (true/false) or integer boolean (0/1)`);
        }
        return this;
    }

    /* * 
* Verify email format 
* @param {string} value - value 
* @param {string} field - field name */
    email(value, field) {
        if (value && typeof value === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.addError(field, `${field} must be a valid email address`);
            }
        }
        return this;
    }

    /* * 
* Verify URL format 
* @param {string} value - value 
* @param {string} field - field name */
    url(value, field) {
        if (value && typeof value === 'string') {
            try {
                new URL(value);
            } catch {
                this.addError(field, `${field} must be a valid URL`);
            }
        }
        return this;
    }

    /* * 
* Verify date format 
* @param {string} value - value 
* @param {string} field - field name */
    date(value, field) {
        if (value && typeof value === 'string') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                this.addError(field, `${field} must be a valid date`);
            }
        }
        return this;
    }

    /* * 
* Verify string length 
* @param {string} value - value 
* @param {string} field - field name 
* @param {number} min - minimum length 
* @param {number} max - maximum length */
    length(value, field, min = 0, max = Infinity) {
        if (value && typeof value === 'string') {
            if (value.length < min) {
                this.addError(field, `${field} must be at least ${min} characters long`);
            }
            if (value.length > max) {
                this.addError(field, `${field} must be no more than ${max} characters long`);
            }
        }
        return this;
    }

    /* * 
* Verify value range 
* @param {number} value - value 
* @param {string} field - field name 
* @param {number} min - minimum value 
* @param {number} max - maximum value */
    range(value, field, min = -Infinity, max = Infinity) {
        if (value !== undefined && value !== null) {
            const num = Number(value);
            if (!isNaN(num)) {
                if (num < min) {
                    this.addError(field, `${field} must be at least ${min}`);
                }
                if (num > max) {
                    this.addError(field, `${field} must be no more than ${max}`);
                }
            }
        }
        return this;
    }

    /* * 
* Verify enumeration value 
* @param {*} value - value 
* @param {string} field - field name 
* @param {Array} allowedValues - list of allowed values */
    enum(value, field, allowedValues) {
        if (value !== undefined && value !== null && !allowedValues.includes(value)) {
            this.addError(field, `${field} must be one of: ${allowedValues.join(', ')}`);
        }
        return this;
    }

    /* * 
* Verify array type 
* @param {*} value - value 
* @param {string} field - field name */
    array(value, field) {
        if (value !== undefined && value !== null && !Array.isArray(value)) {
            this.addError(field, `${field} must be an array`);
        }
        return this;
    }

    /* * 
* Verification object type 
* @param {*} value - value 
* @param {string} field - field name */
    object(value, field) {
        if (value !== undefined && value !== null && (typeof value !== 'object' || Array.isArray(value))) {
            this.addError(field, `${field} must be an object`);
        }
        return this;
    }

    /* * 
* Custom verification function 
* @param {*} value - value 
* @param {string} field - field name 
* @param {Function} validatorFn - verification function, returning true indicates that the verification is passed 
* @param {string} message - error message */
    custom(value, field, validatorFn, message) {
        if (value !== undefined && value !== null && !validatorFn(value)) {
            this.addError(field, message || `${field} is invalid`);
        }
        return this;
    }

    /* * 
* Verify whether the foreign key exists 
* @param {number} value - foreign key value 
* @param {string} field - field name 
* @param {Function} existsCheckFn - Check function, return true to indicate the existence of the foreign key 
* @param {string} entityName - entity name (used for error messages) */
    foreignKey(value, field, existsCheckFn, entityName) {
        if (value !== undefined && value !== null) {
            if (!existsCheckFn(value)) {
                this.addError(field, `${entityName} with id ${value} does not exist`);
            }
        }
        return this;
    }
}

/* * 
* Create a new validator instance 
* @returns {Validator} */
function createValidator() {
    return new Validator();
}

/* * 
* Verify subscription data 
* @param {Object} data - subscription data 
* @returns {Validator} */
function validateSubscription(data) {
    const validator = createValidator();

    validator
        .required(data.name, 'name')
        .string(data.name, 'name')
        .length(data.name, 'name', 1, 255)

        .required(data.plan, 'plan')
        .string(data.plan, 'plan')
        .length(data.plan, 'plan', 1, 255)

        .required(data.billing_cycle, 'billing_cycle')
        .enum(data.billing_cycle, 'billing_cycle', ['monthly', 'yearly', 'quarterly', 'semiannual'])

        .required(data.amount, 'amount')
        .number(data.amount, 'amount')
        .range(data.amount, 'amount', 0)

        .required(data.currency, 'currency')
        .string(data.currency, 'currency')
        .length(data.currency, 'currency', 3, 3)
        .custom(data.currency, 'currency',
            (value) => isSupportedCurrency(value),
            'Currency is not supported'
        )

        .required(data.payment_method_id, 'payment_method_id')
        .integer(data.payment_method_id, 'payment_method_id')
        .range(data.payment_method_id, 'payment_method_id', 1)

        .date(data.next_billing_date, 'next_billing_date')
        .date(data.start_date, 'start_date')

        .enum(data.status, 'status', ['active', 'trial', 'cancelled'])
        .enum(data.renewal_type, 'renewal_type', ['auto', 'manual'])

        .required(data.category_id, 'category_id')
        .integer(data.category_id, 'category_id')
        .range(data.category_id, 'category_id', 1)

        .string(data.notes, 'notes')
        .url(data.website, 'website');

    return validator;
}

/* * 
* Verify subscription data (including foreign key verification) 
* @param {Object} data - subscription data 
* @param {Object} db - database connection 
* @returns {Validator} */
function validateSubscriptionWithForeignKeys(data, db) {
    const validator = validateSubscription(data);

    // Validate category_id foreign key
    if (data.category_id !== undefined && data.category_id !== null) {
        const categoryExists = db.prepare('SELECT COUNT(*) as count FROM categories WHERE id = ?').get(data.category_id);
        validator.custom(data.category_id, 'category_id',
            () => categoryExists.count > 0,
            `Category with id ${data.category_id} does not exist`);
    }

    // Validate payment_method_id foreign key
    if (data.payment_method_id !== undefined && data.payment_method_id !== null) {
        const paymentMethodExists = db.prepare('SELECT COUNT(*) as count FROM payment_methods WHERE id = ?').get(data.payment_method_id);
        validator.custom(data.payment_method_id, 'payment_method_id',
            () => paymentMethodExists.count > 0,
            `Payment method with id ${data.payment_method_id} does not exist`);
    }

    return validator;
}

/* * 
* Verify notification settings data 
* @param {Object} data - 通知设置数据
 * @returns {Validator} */
function validateNotificationSetting(data) {
    const validator = createValidator();

    validator
        .required(data.notification_type, 'notification_type')
        .string(data.notification_type, 'notification_type')
        .enum(data.notification_type, 'notification_type', [
            'renewal_reminder',
            'expiration_warning',
            'payment_failed',
            'trial_ending'
        ])

        .boolean(data.is_enabled, 'is_enabled')

        .integer(data.advance_days, 'advance_days')
        .range(data.advance_days, 'advance_days', 0, 365)

        .array(data.notification_channels, 'notification_channels')
        .custom(data.notification_channels, 'notification_channels',
            (channels) => channels && channels.every(channel => ['telegram', 'email', 'webhook'].includes(channel)),
            'notification_channels must contain only valid channel types: telegram, email, webhook'
        )

        .boolean(data.repeat_notification, 'repeat_notification');

    return validator;
}

/* * 
* Verify notification channel configuration data 
* @param {Object} data - 渠道配置数据
 * @returns {Validator} */
function validateChannelConfig(data) {
    const validator = createValidator();

    validator
        .required(data.channel_type, 'channel_type')
        .string(data.channel_type, 'channel_type')
        .enum(data.channel_type, 'channel_type', ['telegram', 'email', 'webhook'])

        .required(data.config, 'config')
        .object(data.config, 'config');

    // Verify specific configuration based on channel type
    if (data.channel_type === 'telegram' && data.config) {
        if (data.config.chat_id !== undefined && data.config.chat_id !== null && data.config.chat_id !== "") {
            validator
                .string(data.config.chat_id, 'config.chat_id')
                .custom(data.config.chat_id, 'config.chat_id',
                    (chatId) => /^-?\d+$/.test(chatId),
                    'Telegram chat_id must be a valid number string'
                );
        }
    } else if (data.channel_type === 'email' && data.config) {
        const emailAddress = data.config.email || data.config.address;
        validator
            .required(emailAddress, 'config.email')
            .email(emailAddress, 'config.email');
    } else if (data.channel_type === 'webhook' && data.config) {
        validator
            .required(data.config.url, 'config.url')
            .url(data.config.url, 'config.url');
    }

    return validator;
}

/* * 
* Verify sending notification request data 
* @param {Object} data - Send notification request data 
* @returns {Validator} */
function validateSendNotification(data) {
    const validator = createValidator();

    validator
        .required(data.subscription_id, 'subscription_id')
        .integer(data.subscription_id, 'subscription_id')
        .range(data.subscription_id, 'subscription_id', 1)

        .required(data.notification_type, 'notification_type')
        .string(data.notification_type, 'notification_type')
        .enum(data.notification_type, 'notification_type', [
            'renewal_reminder',
            'expiration_warning',
            'payment_failed',
            'trial_ending'
        ])

        .array(data.channels, 'channels')
        .custom(data.channels, 'channels',
            (channels) => !channels || channels.every(channel => ['telegram', 'email', 'webhook'].includes(channel)),
            'channels must contain only valid channel types: telegram, email, webhook'
        );

    return validator;
}

module.exports = {
    Validator,
    createValidator,
    validateSubscription,
    validateSubscriptionWithForeignKeys,
    validateNotificationSetting,
    validateChannelConfig,
    validateSendNotification
};
