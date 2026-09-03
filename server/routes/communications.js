const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// GET /api/communications
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT c.*, a.company_name as account_name FROM communications c LEFT JOIN accounts a ON c.account_id = a.id ORDER BY c.created_at DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/communications/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT c.*, a.company_name as account_name FROM communications c LEFT JOIN accounts a ON c.account_id = a.id WHERE c.id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Communication not found' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/communications
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('INSERT INTO communications (account_id, type, subject, content, date) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(b.account_id || null, b.type || 'Note', b.subject || '', b.content || null, b.date || null);
    const row = db.prepare('SELECT * FROM communications WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/communications/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('UPDATE communications SET account_id=?, type=?, subject=?, content=?, date=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?');
    const result = stmt.run(b.account_id || null, b.type || 'Note', b.subject || '', b.content || null, b.date || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Communication not found' });
    const row = db.prepare('SELECT * FROM communications WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/communications/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM communications WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Communication not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
