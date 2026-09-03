/**
 * Database Connection Module
 * Uses better-sqlite3 for synchronous, high-performance SQLite access.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'crm.db');

let db;

/**
 * Get the singleton database instance.
 * Creates and configures the connection on first call.
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enforce foreign key constraints
    db.pragma('foreign_keys = ON');
    // Return rows as plain objects (default, but explicit for clarity)
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

/**
 * Close the database connection safely.
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb };
