/**
 * routes/search.js
 * Global search across accounts, contacts, opportunities.
 *
 * GET /api/search?q=query
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── GET /api/search?q= ───────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, data: { accounts: [], contacts: [], opportunities: [] } });
    }

    const like = `%${q}%`;

    // ── Accounts: search company_name, industry, city ──
    const accounts = db.prepare(
      `SELECT id, company_name, industry, city
       FROM accounts
       WHERE company_name LIKE ? OR industry LIKE ? OR city LIKE ?
       ORDER BY company_name
       LIMIT 10`
    ).all(like, like, like);

    // ── Contacts: search first_name, last_name, email, position ──
    const contacts = db.prepare(
      `SELECT c.id, c.first_name, c.last_name, c.email, c.position, c.account_id,
              a.company_name AS account_name
       FROM contacts c
       LEFT JOIN accounts a ON c.account_id = a.id
       WHERE c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.position LIKE ?
       ORDER BY c.last_name, c.first_name
       LIMIT 10`
    ).all(like, like, like, like);

    // ── Opportunities: search name, description ──
    const opportunities = db.prepare(
      `SELECT o.id, o.name, o.description, o.value, o.stage,
              a.company_name AS account_name
       FROM opportunities o
       LEFT JOIN accounts a ON o.account_id = a.id
       WHERE o.name LIKE ? OR o.description LIKE ?
       ORDER BY o.name
       LIMIT 10`
    ).all(like, like);

    res.json({ success: true, data: { accounts, contacts, opportunities } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
