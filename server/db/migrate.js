#!/usr/bin/env node

const config = require('../config');
const DatabaseMigrations = require('./migrations');

async function runMigrations() {
  const dbPath = config.getDatabasePath();
  console.log(`📂 数据库路径: ${dbPath}`);

  const migrations = new DatabaseMigrations(dbPath);

  try {
    await migrations.runMigrations();
    console.log('🎉 Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    migrations.close();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
