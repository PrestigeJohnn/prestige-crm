/**
 * routes/opportunities.js
 * Opportunity CRUD with optional stage / account_id filter.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { stage, account_id } = req.query;
    let sql = `SELECT o.*, a.company_name AS account_name
               FROM opportunities o LEFT JOIN accounts a ON o.account_id = a.id`;
    const params = [];
    const where = [];
    if (stage)       { where.push('o.stage = ?');       params.push(stage); }
    if (account_id)  { where.push('o.account_id = ?');  params.push(account_id); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY o.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Detail ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const opp = db.prepare(
      `SELECT o.*, a.company_name AS account_name
       FROM opportunities o LEFT JOIN accounts a ON o.account_id = a.id
       WHERE o.id = ?`
    ).get(req.params.id);
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    res.json({ success: true, data: opp });
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
      `INSERT INTO opportunities (account_id, contact_id, name, description, value, probability, stage, competitor, expected_close_date, actual_close_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.name, b.description || null,
      b.value || 0, b.probability || 0, b.stage || 'Discovery', b.competitor || null,
      b.expected_close_date || null, b.actual_close_date || null, b.notes || null
    );
    const opp = db.prepare(`SELECT * FROM opportunities WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: opp });
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
      `UPDATE opportunities SET account_id=?, contact_id=?, name=?, description=?, value=?,
       probability=?, stage=?, competitor=?, expected_close_date=?, actual_close_date=?, notes=?,
       updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.name, b.description || null,
      b.value || 0, b.probability || 0, b.stage || 'Discovery', b.competitor || null,
      b.expected_close_date || null, b.actual_close_date || null, b.notes || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    const opp = db.prepare(`SELECT * FROM opportunities WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: opp });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM opportunities WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Opportunity not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
