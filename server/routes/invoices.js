const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// GET /api/invoices
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT i.*, c.title as contract_title FROM invoices i LEFT JOIN contracts c ON i.contract_id = c.id ORDER BY i.created_at DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/invoices/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT i.*, c.title as contract_title FROM invoices i LEFT JOIN contracts c ON i.contract_id = c.id WHERE i.id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/invoices
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('INSERT INTO invoices (contract_id, invoice_number, amount, status, issued_date, due_date, paid_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(b.contract_id || null, b.invoice_number || null, b.amount || 0, b.status || 'Pending', b.issued_date || null, b.due_date || null, b.paid_date || null, b.notes || null);
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /api/invoices/:id
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const stmt = db.prepare('UPDATE invoices SET contract_id=?, invoice_number=?, amount=?, status=?, issued_date=?, due_date=?, paid_date=?, notes=?, updated_at=datetime(\'now\',\'localtime\') WHERE id=?');
    const result = stmt.run(b.contract_id || null, b.invoice_number || null, b.amount || 0, b.status || 'Pending', b.issued_date || null, b.due_date || null, b.paid_date || null, b.notes || null, req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/invoices/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
