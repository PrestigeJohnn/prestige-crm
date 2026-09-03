/**
 * routes/leads.js
 * Lead CRUD with optional status filter.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let rows;
    if (status) {
      rows = db.prepare(`SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC`).all(status);
    } else {
      rows = db.prepare(`SELECT * FROM leads ORDER BY created_at DESC`).all();
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
    const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
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
      `INSERT INTO leads (company_name, contact_name, email, phone, source, status, score, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.company_name, b.contact_name || null, b.email || null, b.phone || null,
      b.source || null, b.status || 'New', b.score || 0, b.notes || null
    );
    const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: lead });
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
      `UPDATE leads SET company_name=?, contact_name=?, email=?, phone=?, source=?,
       status=?, score=?, notes=?, updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.company_name, b.contact_name || null, b.email || null, b.phone || null,
      b.source || null, b.status || 'New', b.score || 0, b.notes || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Lead not found' });
    const lead = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM leads WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
