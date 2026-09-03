/**
 * routes/cases.js
 * Support case CRUD.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      `SELECT c.*, a.company_name AS account_name
       FROM cases c LEFT JOIN accounts a ON c.account_id = a.id
       ORDER BY c.created_at DESC`
    ).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Detail ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const kase = db.prepare(
      `SELECT c.*, a.company_name AS account_name
       FROM cases c LEFT JOIN accounts a ON c.account_id = a.id
       WHERE c.id = ?`
    ).get(req.params.id);
    if (!kase) return res.status(404).json({ success: false, error: 'Case not found' });
    res.json({ success: true, data: kase });
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
      `INSERT INTO cases (account_id, contact_id, case_no, subject, description, priority, status, resolution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.case_no || null,
      b.subject, b.description || null, b.priority || 'Medium',
      b.status || 'New', b.resolution || null
    );
    const kase = db.prepare(`SELECT * FROM cases WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: kase });
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
      `UPDATE cases SET account_id=?, contact_id=?, case_no=?, subject=?, description=?,
       priority=?, status=?, resolution=?, updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.case_no || null,
      b.subject, b.description || null, b.priority || 'Medium',
      b.status || 'New', b.resolution || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Case not found' });
    const kase = db.prepare(`SELECT * FROM cases WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: kase });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM cases WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Case not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
