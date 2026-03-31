const path = require('path');
const fs = require('fs');

/* * 
* Unified configuration management module 
* Provide all configuration items of the application, including database path, environment variables, etc. */
class Config {
    constructor() {
        // Load environment variables - uniformly load from the .env file in the root directory
        this.loadEnvironmentVariables();
        
        // Cache configuration items
        this._databasePath = null;
    }

    /* * 
* Load environment variables 
* Unified environment variable loading logic to ensure that all modules use the same configuration */
    loadEnvironmentVariables() {
        const envPath = path.join(__dirname, '..', '..', '.env');
        require('dotenv').config({ path: envPath });
    }

    /* * 
* Get database path - supports multiple environments 
* Unified database path acquisition logic, replacing the repeated getDatabasePath function in each module 
* @returns {string} database file path */
    getDatabasePath() {
        if (this._databasePath) {
            return this._databasePath;
        }

        // Use environment variables first
        if (process.env.DATABASE_PATH) {
            this._databasePath = process.env.DATABASE_PATH;
            return this._databasePath;
        }

        // Common paths in Docker environments
        const dockerPath = '/app/data/database.sqlite';

        // Check if Docker data directory exists
        if (fs.existsSync('/app/data')) {
            this._databasePath = dockerPath;
            return this._databasePath;
        }

        // local development environment
        this._databasePath = path.resolve(__dirname, '..', 'db', 'database.sqlite');
        return this._databasePath;
    }

    /* * 
* Get application port 
* @returns {number} port number */
    getPort() {
        return parseInt(process.env.PORT) || 3001;
    }

    /* * 
* Get Tianxing API key 
* @returns {string|null} Tianxing API key */
    getTianApiKey() {
        return process.env.TIANAPI_KEY || null;
    }

    /* * 
* Get base currency 
* @returns {string} base currency code */
    getBaseCurrency() {
        return process.env.BASE_CURRENCY || 'CNY';
    }

    /* * 
* Get log level 
* @returns {string} log level */
    getLogLevel() {
        // The production environment uses warn by default, and the development environment uses info by default.
        const defaultLevel = this.isProduction() ? 'warn' : 'info';
        return process.env.LOG_LEVEL || defaultLevel;
    }

    /* * 
* Get the operating environment 
* @returns {string} operating environment (development, production, test) */
    getNodeEnv() {
        return process.env.NODE_ENV || 'development';
    }

    /* * 
* Whether it is a development environment 
* @returns {boolean} */
    isDevelopment() {
        return this.getNodeEnv() === 'development';
    }

    /* * 
* Whether it is a production environment 
* @returns {boolean} */
    isProduction() {
        return this.getNodeEnv() === 'production';
    }

    /* * 
* Whether it is a test environment 
* @returns {boolean} */
    isTest() {
        return this.getNodeEnv() === 'test';
    }

    /* * 
* Get the database directory path 
* @returns {string} Database directory path */
    getDatabaseDir() {
        return path.dirname(this.getDatabasePath());
    }

    /* * 
* Make sure the database directory exists 
* @returns {void} */
    ensureDatabaseDir() {
        const dbDir = this.getDatabaseDir();
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log(`📁 Created database directory: ${dbDir}`);
        }
    }

    /* * 
* Check if the database file exists 
* @returns {boolean} */
    databaseExists() {
        return fs.existsSync(this.getDatabasePath());
    }

    /* * 
* Get summary information of all configurations 
* @returns {Object} configuration summary */
    getSummary() {
        return {
            nodeEnv: this.getNodeEnv(),
            port: this.getPort(),
            databasePath: this.getDatabasePath(),
            logLevel: this.getLogLevel(),
            baseCurrency: this.getBaseCurrency(),
            hasApiKey: false,
            hasTianApiKey: !!this.getTianApiKey(),
            databaseExists: this.databaseExists(),
            emailConfigured: this.getEmailConfig().enabled
        };
    }

    /* * 
* Print configuration information */
    printSummary() {
        const summary = this.getSummary();
        console.log('📋 Configuration Summary:');
        console.log(`   Environment: ${summary.nodeEnv}`);
        console.log(`   Port: ${summary.port}`);
        console.log(`   Database Path: ${summary.databasePath}`);
        console.log(`   Log Level: ${summary.logLevel}`);
        console.log(`   Base Currency: ${summary.baseCurrency}`);
        console.log(`   API Key: ❌ Removed (session-based auth)`);
        console.log(`   TianAPI Key: ${summary.hasTianApiKey ? '✅ Set' : '❌ Not set'}`);
        console.log(`   Email Notifications: ${summary.emailConfigured ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`   Database Exists: ${summary.databaseExists ? '✅ Yes' : '❌ No'}`);
    }

    /* * 
* Get email notification configuration 
* @returns {Object} email configuration */
    getEmailConfig() {
        const host = process.env.EMAIL_HOST;
        const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
        const secureEnv = process.env.EMAIL_SECURE;
        const secure = secureEnv !== undefined ? secureEnv === 'true' : port === 465;
        const authUser = process.env.EMAIL_USER || process.env.EMAIL_USERNAME;
        const authPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
        const from = process.env.EMAIL_FROM || authUser || 'no-reply@example.com';
        const rejectUnauthorizedEnv = process.env.EMAIL_TLS_REJECT_UNAUTHORIZED;
        const rejectUnauthorized = rejectUnauthorizedEnv === undefined ? true : rejectUnauthorizedEnv === 'true';

        const enabled = Boolean(host && from && (authUser ? authPass : true));

        return {
            enabled,
            host,
            port,
            secure,
            from,
            authUser,
            authPass,
            tlsOptions: {
                rejectUnauthorized
            },
            locale: process.env.EMAIL_LOCALE || 'zh-CN'
        };
    }
}

// Export singleton instance
const config = new Config();

module.exports = config;
