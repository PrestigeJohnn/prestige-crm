/**
 * Prestige CRM - Express Server
 * Main entry point. Registers all API routes and serves the frontend.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, closeDb } = require('./database/services/db');
const fs = require('fs');

// ── Route modules ──────────────────────────────────────────
const accountsRouter      = require('./server/routes/accounts');
const contactsRouter      = require('./server/routes/contacts');
const leadsRouter         = require('./server/routes/leads');
const opportunitiesRouter  = require('./server/routes/opportunities');
const activitiesRouter    = require('./server/routes/activities');
const tasksRouter         = require('./server/routes/tasks');
const quotesRouter        = require('./server/routes/quotes');
const ordersRouter        = require('./server/routes/orders');
const productsRouter      = require('./server/routes/products');
const casesRouter         = require('./server/routes/cases');
const documentsRouter     = require('./server/routes/documents');
const dashboardRouter     = require('./server/routes/dashboard');
const notifierRouter      = require('./server/routes/notifier');
const searchRouter        = require('./server/routes/search');
const contractsRouter     = require('./server/routes/contracts');
const invoicesRouter      = require('./server/routes/invoices');
const communicationsRouter = require('./server/routes/communications');
const meetingsRouter      = require('./server/routes/meetings');
const reportRoutes        = require('./server/routes/reports');
const authRoutes          = require('./server/routes/auth');
const accountNotesRouter  = require('./routes/account-notes');
const activityLogRouter   = require('./routes/activity-log');
const quotationsRouter    = require('./routes/quotations');
const prRequestsRouter    = require('./routes/pr-requests');
const equipmentLoansRouter = require('./routes/equipment-loans');
const templatesRouter     = require('./routes/templates');
const approvalsRouter     = require('./routes/approvals');
const auditLogsRouter    = require('./routes/audit-logs');

// ── App setup ──────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes (BEFORE static so requests don't get intercepted) ──
app.use('/api/accounts',      accountsRouter);
app.use('/api/contacts',      contactsRouter);
app.use('/api/leads',         leadsRouter);
app.use('/api/opportunities',  opportunitiesRouter);
app.use('/api/activities',    activitiesRouter);
app.use('/api/tasks',         tasksRouter);
app.use('/api/quotes',        quotesRouter);
app.use('/api/orders',        ordersRouter);
app.use('/api/products',      productsRouter);
app.use('/api/cases',         casesRouter);
app.use('/api/documents',     documentsRouter);
app.use('/api/dashboard',     dashboardRouter);
app.use('/api',               notifierRouter);
app.use('/api/search',        searchRouter);
app.use('/api/auth',        authRoutes);
app.use('/api/contracts',     contractsRouter);
app.use('/api/invoices',      invoicesRouter);
app.use('/api/communications', communicationsRouter);
app.use('/api/meetings',      meetingsRouter);
app.use('/api/reports',      reportRoutes);
app.use('/api/account-notes', accountNotesRouter);
app.use('/api/activity-log',  activityLogRouter);
app.use('/api/quotations',    quotationsRouter);
app.use('/api/pr-requests',   prRequestsRouter);
app.use('/api/equipment-loans', equipmentLoansRouter);
app.use('/api/templates',     templatesRouter);
app.use('/api/approvals',     approvalsRouter);
app.use('/api/audit-logs',    auditLogsRouter);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ── Static frontend (AFTER API routes) ─────────────────────
// Disable caching so users always get the latest version
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|html)$/)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'dist'), { etag: false }));

// Also serve public assets
app.use(express.static(path.join(__dirname, 'public'), { etag: false }));

// SPA fallback — serve index.html for non-API routes (no cache)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Initialise database ────────────────────────────────────
const SCHEMA_PATH = path.join(__dirname, 'database', 'schema.sql');
const SEED_PATH   = path.join(__dirname, 'database', 'seed.sql');
const DB_PATH     = path.join(__dirname, 'database', 'crm.db');

function initDatabase() {
  const seeded = process.argv.includes('--seed');
  const db = getDb();

  // Self-heal: apply schema when the users table is missing
  // (fresh/empty DB file — e.g. first boot on Render)
  let hasUsers = false;
  try {
    hasUsers = !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  } catch { hasUsers = false; }
  if (!hasUsers) {
    console.log('[DB] Initializing database...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    console.log('[DB] Schema applied.');

    if (seeded && fs.existsSync(SEED_PATH)) {
      const seed = fs.readFileSync(SEED_PATH, 'utf-8');
      db.exec(seed);
      console.log('[DB] Seed data inserted.');
    }
    
    // Verify
    const tables = [
      'accounts','contacts','leads','opportunities',
      'activities','tasks','quotes','quote_items',
      'orders','products','cases','documents',
    ];
    console.log('[DB] Table row counts:');
    for (const t of tables) {
      try {
        const row = db.prepare(`SELECT COUNT(*) AS cnt FROM ${t}`).get();
        console.log(`   ${t.padEnd(16)} → ${row.cnt}`);
      } catch { /* ignore */ }
    }
  } else {
    console.log('[DB] Database found.');
  }

  // Ensure audit_logs table exists (may not be in seed.sql)
  db.exec(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now', '+8 hours'))
  )`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at)`);
  console.log('[DB] Audit logs table ensured.');

  // Ensure admin user always exists and password is correct
  try {
    require('./server/init-user');
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log('[DB] Admin user already exists, skipping.');
    } else {
      throw e;
    }
  }
}

// ── Start ──────────────────────────────────────────────────
initDatabase();

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       Prestige CRM Server Started        ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Local:   http://localhost:${PORT}          ║`);
  console.log(`║  API:     http://localhost:${PORT}/api      ║`);
  console.log(`║  Health:  http://localhost:${PORT}/api/health ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SERVER] Shutting down...');
  closeDb();
  process.exit(0);
});

module.exports = app;
