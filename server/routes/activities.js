/**
 * routes/activities.js
 * Activity CRUD with optional account_id / type filter.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { account_id, type } = req.query;
    let sql = `SELECT * FROM activities`;
    const params = [];
    const where = [];
    if (account_id) { where.push('account_id = ?'); params.push(account_id); }
    if (type)       { where.push('type = ?');       params.push(type); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY date DESC';
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
    const activity = db.prepare(`SELECT * FROM activities WHERE id = ?`).get(req.params.id);
    if (!activity) return res.status(404).json({ success: false, error: 'Activity not found' });
    res.json({ success: true, data: activity });
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
      `INSERT INTO activities (account_id, contact_id, opportunity_id, type, subject, description, date, duration, next_action, next_action_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.opportunity_id || null,
      b.type || null, b.subject, b.description || null, b.date || new Date().toISOString().slice(0, 10),
      b.duration || 0, b.next_action || null, b.next_action_date || null
    );
    const activity = db.prepare(`SELECT * FROM activities WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: activity });
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
      `UPDATE activities SET account_id=?, contact_id=?, opportunity_id=?, type=?, subject=?,
       description=?, date=?, duration=?, next_action=?, next_action_date=? WHERE id=?`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.opportunity_id || null,
      b.type || null, b.subject, b.description || null, b.date,
      b.duration || 0, b.next_action || null, b.next_action_date || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Activity not found' });
    const activity = db.prepare(`SELECT * FROM activities WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM activities WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Activity not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
