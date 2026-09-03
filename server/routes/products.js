/**
 * routes/products.js
 * Product CRUD.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM products ORDER BY name`).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Detail ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
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
      `INSERT INTO products (name, sku, category, description, cost, selling_price, stock, unit, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.name, b.sku || null, b.category || null, b.description || null,
      b.cost || 0, b.selling_price || 0, b.stock || 0, b.unit || 'Unit', b.active !== undefined ? (b.active ? 1 : 0) : 1
    );
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: product });
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
      `UPDATE products SET name=?, sku=?, category=?, description=?, cost=?, selling_price=?,
       stock=?, unit=?, active=?, updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.name, b.sku || null, b.category || null, b.description || null,
      b.cost || 0, b.selling_price || 0, b.stock || 0, b.unit || 'Unit',
      b.active !== undefined ? (b.active ? 1 : 0) : 1, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM products WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
