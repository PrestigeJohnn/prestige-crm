/**
 * routes/documents.js
 * Document CRUD (no file upload — just metadata records).
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      `SELECT d.*, a.company_name AS account_name
       FROM documents d LEFT JOIN accounts a ON d.account_id = a.id
       ORDER BY d.created_at DESC`
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
    const doc = db.prepare(
      `SELECT d.*, a.company_name AS account_name
       FROM documents d LEFT JOIN accounts a ON d.account_id = a.id
       WHERE d.id = ?`
    ).get(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
    res.json({ success: true, data: doc });
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
      `INSERT INTO documents (account_id, opportunity_id, name, file_path, file_size, file_type, category, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.account_id || null, b.opportunity_id || null, b.name,
      b.file_path || '', b.file_size || 0, b.file_type || null,
      b.category || null, b.uploaded_by || null
    );
    const doc = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM documents WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Document not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
