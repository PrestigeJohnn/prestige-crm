/**
 * routes/quotes.js
 * Quote CRUD. Detail includes quote_items. Create accepts items array.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      `SELECT q.*, a.company_name AS account_name
       FROM quotes q LEFT JOIN accounts a ON q.account_id = a.id
       ORDER BY q.created_at DESC`
    ).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Detail (with items) ────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const quote = db.prepare(
      `SELECT q.*, a.company_name AS account_name
       FROM quotes q LEFT JOIN accounts a ON q.account_id = a.id
       WHERE q.id = ?`
    ).get(req.params.id);
    if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

    const items = db.prepare(
      `SELECT qi.*, p.name AS product_name
       FROM quote_items qi LEFT JOIN products p ON qi.product_id = p.id
       WHERE qi.quote_id = ?`
    ).all(req.params.id);

    res.json({ success: true, data: { ...quote, items } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Create (with items) ────────────────────────────────────
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const b = req.body;
    const items = Array.isArray(b.items) ? b.items : [];

    const insertQuote = db.prepare(
      `INSERT INTO quotes (account_id, opportunity_id, quote_no, amount, discount, tax, total, version, status, valid_until, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertItem = db.prepare(
      `INSERT INTO quote_items (quote_id, product_id, description, quantity, unit_price, discount, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const totalAmount = items.reduce((s, it) => s + (it.quantity || 1) * (it.unit_price || 0) * (1 - (it.discount || 0) / 100), 0);
    const discount = b.discount || 0;
    const tax = b.tax || 0;
    const grandTotal = totalAmount * (1 - discount / 100) + tax;

    const result = insertQuote.run(
      b.account_id || null, b.opportunity_id || null, b.quote_no || null,
      totalAmount, discount, tax, grandTotal,
      b.version || 1, b.status || 'Draft', b.valid_until || null, b.notes || null
    );
    const quoteId = result.lastInsertRowid;

    for (const it of items) {
      const lineTotal = (it.quantity || 1) * (it.unit_price || 0) * (1 - (it.discount || 0) / 100);
      insertItem.run(quoteId, it.product_id || null, it.description || '', it.quantity || 1, it.unit_price || 0, it.discount || 0, lineTotal);
    }

    const quote = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(quoteId);
    res.status(201).json({ success: true, data: { ...quote, items: db.prepare(`SELECT * FROM quote_items WHERE quote_id = ?`).all(quoteId) } });
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
      `UPDATE quotes SET account_id=?, opportunity_id=?, quote_no=?, amount=?, discount=?,
       tax=?, total=?, version=?, status=?, valid_until=?, notes=?,
       updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.account_id || null, b.opportunity_id || null, b.quote_no || null,
      b.amount || 0, b.discount || 0, b.tax || 0, b.total || 0,
      b.version || 1, b.status || 'Draft', b.valid_until || null, b.notes || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Quote not found' });
    const quote = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM quotes WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Quote not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
