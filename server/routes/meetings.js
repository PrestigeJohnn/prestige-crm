const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// GET /api/meetings
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT m.*, a.company_name as account_name FROM meetings m LEFT JOIN accounts a ON m.account_id = a.id ORDER BY m.scheduled_at DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/meetings/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT m.*, a.company_name as account_name FROM meetings m LEFT JOIN accounts a ON m.account_id = a.id WHERE m.id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Meeting not found' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/meetings
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('INSERT INTO meetings (account_id, title, description, scheduled_at, duration, location, attendees) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(b.account_id || null, b.title, b.description || null, b.scheduled_at || null, b.duration || 60, b.location || null, b.attendees || null);
    const row = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/meetings/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('UPDATE meetings SET account_id=?, title=?, description=?, scheduled_at=?, duration=?, location=?, attendees=?, completed_at=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?');
    const result = stmt.run(b.account_id || null, b.title, b.description || null, b.scheduled_at || null, b.duration || 60, b.location || null, b.attendees || null, b.completed_at || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Meeting not found' });
    const row = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/meetings/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Meeting not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
