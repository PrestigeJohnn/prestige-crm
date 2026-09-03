/**
 * routes/accounts.js
 * Account CRUD + detail with related contacts, opportunities, activities.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    const db = getDb();
    let rows;
    if (search) {
      const term = `%${search}%`;
      rows = db.prepare(
        `SELECT * FROM accounts
         WHERE company_name LIKE ? OR industry LIKE ? OR city LIKE ?
         ORDER BY updated_at DESC`
      ).all(term, term, term);
    } else {
      rows = db.prepare(`SELECT * FROM accounts ORDER BY updated_at DESC`).all();
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Detail (with relations) ────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(req.params.id);
    if (!account) return res.status(404).json({ success: false, error: 'Account not found' });

    const contacts      = db.prepare(`SELECT * FROM contacts WHERE account_id = ? ORDER BY created_at DESC`).all(req.params.id);
    const opportunities = db.prepare(`SELECT * FROM opportunities WHERE account_id = ? ORDER BY created_at DESC`).all(req.params.id);
    const activities    = db.prepare(`SELECT * FROM activities WHERE account_id = ? ORDER BY date DESC`).all(req.params.id);

    res.json({ success: true, data: { ...account, contacts, opportunities, activities } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Create ─────────────────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare(
      `INSERT INTO accounts (company_name, industry, country, city, address, postal_code, website, phone, employees, annual_revenue, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.company_name, b.industry || null, b.country || 'Singapore', b.city || null,
      b.address || null, b.postal_code || null, b.website || null, b.phone || null,
      b.employees || null, b.annual_revenue || null, b.notes || null
    );
    const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Update ─────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare(
      `UPDATE accounts SET company_name=?, industry=?, country=?, city=?, address=?,
       postal_code=?, website=?, phone=?, employees=?, annual_revenue=?, notes=?,
       updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.company_name, b.industry || null, b.country || 'Singapore', b.city || null,
      b.address || null, b.postal_code || null, b.website || null, b.phone || null,
      b.employees || null, b.annual_revenue || null, b.notes || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Account not found' });
    const account = db.prepare(`SELECT * FROM accounts WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM accounts WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Account not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
