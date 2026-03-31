#!/usr/bin/env node

/**
 * Script to run database migrations
 * Usage: node server/scripts/run-migration.js
 */

const path = require('path');
const DatabaseMigrations = require('../db/migrations');

async function runMigrations() {
  const dbPath = path.resolve(__dirname, '../db/database.sqlite');
  
  console.log('🚀 Starting database migrations...');
  console.log(`Database path: ${dbPath}`);
  
  try {
    const migrations = new DatabaseMigrations(dbPath);
    await migrations.runMigrations();
    migrations.close();
    
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
