const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// GET /api/contracts
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT c.*, a.company_name as account_name FROM contracts c LEFT JOIN accounts a ON c.account_id = a.id ORDER BY c.created_at DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/contracts/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT c.*, a.company_name as account_name FROM contracts c LEFT JOIN accounts a ON c.account_id = a.id WHERE c.id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Contract not found' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/contracts
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('INSERT INTO contracts (account_id, contract_number, title, amount, status, signed_date, expired_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(b.account_id || null, b.contract_number || null, b.title, b.amount || 0, b.status || 'Draft', b.signed_date || null, b.expired_date || null, b.notes || null);
    const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/contracts/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('UPDATE contracts SET account_id=?, contract_number=?, title=?, amount=?, status=?, signed_date=?, expired_date=?, notes=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?');
    const result = stmt.run(b.account_id || null, b.contract_number || null, b.title, b.amount || 0, b.status || 'Draft', b.signed_date || null, b.expired_date || null, b.notes || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Contract not found' });
    const row = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/contracts/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Contract not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
