const Database = require('better-sqlite3');
const config = require('./index');
const { createAdminUserManager } = require('./authCredentials');

// Flags used to control database path log output
let dbPathLogged = false;

/* * 
* Create database connection 
* Focus on the creation of database connections and does not handle initialization logic 
* @returns {Database} Database connection instance */
function createDatabaseConnection() {
    const dbPath = config.getDatabasePath();
    
    // Only output the database path when creating a connection for the first time
    if (!dbPathLogged) {
        console.log(`📂 Database path: ${dbPath}`);
        dbPathLogged = true;
    }

    // Make sure the database directory exists
    config.ensureDatabaseDir();

    const db = new Database(dbPath);

    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    return db;
}

/* * 
* Initialize database (including migration logic) 
* If complete database initialization is required, use db/init.js 
* @returns {Database} Database connection instance */
function initializeDatabase() {
    const db = createDatabaseConnection();

    try {
        // Check if the database needs to be initialized
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const hasAnyTables = tables.length > 0;

        if (!hasAnyTables) {
            console.log('🔧 Empty database detected, running migrations...');

            // Run migrations to set up the database schema
            const DatabaseMigrations = require('../db/migrations');
            const migrations = new DatabaseMigrations(config.getDatabasePath());
            migrations.runMigrations();
            migrations.close();

            console.log('✅ Database initialized successfully via migrations!');
        } else {
            console.log('📋 Database tables already exist, checking for pending migrations...');

            const DatabaseMigrations = require('../db/migrations');
            const migrations = new DatabaseMigrations(config.getDatabasePath());

            migrations.initMigrationsTable();
            migrations.runMigrations();
            migrations.close();

            console.log('✅ Database schema is up to date!');
        }

        const adminManager = createAdminUserManager(db);
        adminManager.bootstrapDefaultAdmin();

        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        db.close();
        throw error;
    }
}

module.exports = {
    createDatabaseConnection,
    initializeDatabase
};
