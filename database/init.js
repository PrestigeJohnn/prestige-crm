/**
 * Database Initialization Script
 * Deletes the existing database (if any), reads schema.sql, and executes it.
 * Optionally runs seed.sql for demo data.
 *
 * Usage:
 *   node database/init.js          # schema only
 *   node database/init.js --seed   # schema + seed data
 */

const fs = require('fs');
const path = require('path');
const { getDb, closeDb } = require('./services/db');

const DB_PATH = path.resolve(__dirname, 'crm.db');
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');
const SEED_PATH = path.resolve(__dirname, 'seed.sql');

function init() {
  // 1. Remove existing database file(s) for a clean start
  const walPath = DB_PATH + '-wal';
  const shmPath = DB_PATH + '-shm';

  [DB_PATH, walPath, shmPath].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  console.log('✅ Old database removed.');

  // 2. Read and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const db = getDb();

  try {
    db.exec(schema);
    console.log('✅ Schema applied successfully.');
  } catch (err) {
    console.error('❌ Schema execution failed:', err.message);
    closeDb();
    process.exit(1);
  }

  // 3. Optionally seed
  const shouldSeed = process.argv.includes('--seed');
  if (shouldSeed) {
    if (!fs.existsSync(SEED_PATH)) {
      console.error('❌ seed.sql not found at', SEED_PATH);
      closeDb();
      process.exit(1);
    }
    const seed = fs.readFileSync(SEED_PATH, 'utf-8');
    try {
      db.exec(seed);
      console.log('✅ Seed data inserted successfully.');
    } catch (err) {
      console.error('❌ Seed execution failed:', err.message);
      closeDb();
      process.exit(1);
    }
  }

  // 4. Verify — print row counts for all tables
  const tables = [
    'accounts', 'contacts', 'leads', 'opportunities',
    'activities', 'tasks', 'quotes', 'quote_items',
    'orders', 'products', 'cases', 'documents',
  ];

  console.log('\n📊 Table row counts:');
  for (const t of tables) {
    const row = db.prepare(`SELECT COUNT(*) AS cnt FROM ${t}`).get();
    console.log(`   ${t.padEnd(16)} → ${row.cnt}`);
  }

  closeDb();
  console.log('\n🎉 Database initialization complete.');
}

init();
