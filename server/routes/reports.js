const express = require('express');
const router = express.Router();
const { getDb } = require('../../database/services/db');
const { authenticate } = require('../../server/middleware/auth');
router.use(authenticate);

// ── Dashboard KPIs ─────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  try {
    const db = getDb();
    const totalAccounts  = db.prepare('SELECT COUNT(*) as n FROM accounts').get().n;
    const totalLeads     = db.prepare('SELECT COUNT(*) as n FROM leads').get().n;
    const totalOpps      = db.prepare('SELECT COUNT(*) as n FROM opportunities').get().n;
    const totalOrders    = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;
    const totalAmount    = db.prepare('SELECT COALESCE(SUM(amount),0) as n FROM orders').get().n;
    const totalActivities = db.prepare('SELECT COUNT(*) as n FROM activities').get().n;
    const pendingTasks   = db.prepare("SELECT COUNT(*) as n FROM tasks WHERE status != 'Completed'").get().n;
    const wonOpps        = db.prepare("SELECT COUNT(*) as n FROM opportunities WHERE stage = 'Closed Won'").get().n;
    const pipelineValue  = db.prepare("SELECT COALESCE(SUM(value * probability / 100.0), 0) as n FROM opportunities WHERE stage NOT IN ('Closed Won','Closed Lost')").get().n;

    res.json({ success: true, data: {
      totalAccounts, totalLeads, totalOpps, totalOrders,
      totalAmount, totalActivities, pendingTasks, wonOpps: wonOpps || 0,
      pipelineValue: Math.round(pipelineValue),
    }});
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ── Customer Report ────────────────────────────────────────
router.get('/customers', (req, res) => {
  try {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as n FROM accounts').get().n;
    const active = db.prepare('SELECT COUNT(*) as n FROM accounts WHERE id IN (SELECT DISTINCT account_id FROM opportunities WHERE stage NOT IN (\"Closed Lost\"))').get().n;
    const byIndustry = db.prepare('SELECT industry, COUNT(*) as count FROM accounts WHERE industry IS NOT NULL GROUP BY industry ORDER BY count DESC').all();
    const recent = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC LIMIT 10').all();
    res.json({ success: true, data: { totalCustomers: total, activeCustomers: active, byIndustry, recent } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ── Order Report ───────────────────────────────────────────
router.get('/orders', (req, res) => {
  try {
    const db = getDb();
    const totalOrders = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;
    const totalAmount = db.prepare('SELECT COALESCE(SUM(amount),0) as n FROM orders').get().n;
    const avgAmount   = db.prepare('SELECT COALESCE(AVG(amount),0) as n FROM orders').get().n;
    const byStatus    = db.prepare('SELECT status, COUNT(*) as count, SUM(amount) as total FROM orders GROUP BY status').all();
    const recent      = db.prepare('SELECT o.*, a.company_name FROM orders o LEFT JOIN accounts a ON o.account_id = a.id ORDER BY o.created_at DESC LIMIT 10').all();
    res.json({ success: true, data: { totalOrders, totalAmount, avgAmount: Math.round(avgAmount), byStatus, recent } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ── Activity Report ────────────────────────────────────────
router.get('/activities', (req, res) => {
  try {
    const db = getDb();
    const totalActivities = db.prepare('SELECT COUNT(*) as n FROM activities').get().n;
    // activities table uses date/completed_at, not status
    const byType = db.prepare('SELECT type, COUNT(*) as count FROM activities GROUP BY type ORDER BY count DESC').all();
    const recent = db.prepare('SELECT a.*, ac.company_name FROM activities a LEFT JOIN accounts ac ON a.account_id = ac.id ORDER BY a.date DESC LIMIT 10').all();
    const upcoming = db.prepare("SELECT a.*, ac.company_name FROM activities a LEFT JOIN accounts ac ON a.account_id = ac.id WHERE a.date >= date('now') ORDER BY a.date ASC LIMIT 10").all();
    res.json({ success: true, data: { totalActivities, byType, recent, upcoming } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;
