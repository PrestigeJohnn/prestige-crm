/**
 * routes/contacts.js
 * Contact CRUD with optional account_id filter.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { account_id } = req.query;
    let rows;
    if (account_id) {
      rows = db.prepare(
        `SELECT c.*, a.company_name AS account_name
         FROM contacts c LEFT JOIN accounts a ON c.account_id = a.id
         WHERE c.account_id = ?
         ORDER BY c.created_at DESC`
      ).all(account_id);
    } else {
      rows = db.prepare(
        `SELECT c.*, a.company_name AS account_name
         FROM contacts c LEFT JOIN accounts a ON c.account_id = a.id
         ORDER BY c.created_at DESC`
      ).all();
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Detail ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const contact = db.prepare(
      `SELECT c.*, a.company_name AS account_name
       FROM contacts c LEFT JOIN accounts a ON c.account_id = a.id
       WHERE c.id = ?`
    ).get(req.params.id);
    if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });
    res.json({ success: true, data: contact });
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
      `INSERT INTO contacts (account_id, first_name, last_name, position, department, email, phone, linkedin, decision_maker, influence_level, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.account_id || null, b.first_name, b.last_name || null, b.position || null,
      b.department || null, b.email || null, b.phone || null, b.linkedin || null,
      b.decision_maker ? 1 : 0, b.influence_level || 3, b.notes || null
    );
    const contact = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: contact });
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
      `UPDATE contacts SET account_id=?, first_name=?, last_name=?, position=?, department=?,
       email=?, phone=?, linkedin=?, decision_maker=?, influence_level=?, notes=?,
       updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.account_id || null, b.first_name, b.last_name || null, b.position || null,
      b.department || null, b.email || null, b.phone || null, b.linkedin || null,
      b.decision_maker ? 1 : 0, b.influence_level || 3, b.notes || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Contact not found' });
    const contact = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM contacts WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Contact not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
