/**
 * routes/orders.js
 * Order CRUD.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      `SELECT o.*, a.company_name AS account_name
       FROM orders o LEFT JOIN accounts a ON o.account_id = a.id
       ORDER BY o.created_at DESC`
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
    const order = db.prepare(
      `SELECT o.*, a.company_name AS account_name
       FROM orders o LEFT JOIN accounts a ON o.account_id = a.id
       WHERE o.id = ?`
    ).get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
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
      `INSERT INTO orders (account_id, opportunity_id, quote_id, order_no, amount, status, delivery_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.account_id || null, b.opportunity_id || null, b.quote_id || null,
      b.order_no || null, b.amount || 0, b.status || 'Pending',
      b.delivery_date || null, b.notes || null
    );
    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: order });
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
      `UPDATE orders SET account_id=?, opportunity_id=?, quote_id=?, order_no=?, amount=?,
       status=?, delivery_date=?, notes=?, updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.account_id || null, b.opportunity_id || null, b.quote_id || null,
      b.order_no || null, b.amount || 0, b.status || 'Pending',
      b.delivery_date || null, b.notes || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Order not found' });
    const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM orders WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
