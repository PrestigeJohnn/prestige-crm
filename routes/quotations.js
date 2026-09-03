const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST all quotes
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const quotes = db.prepare(`
      SELECT q.*, a.name as account_name 
      FROM quotes q 
      LEFT JOIN accounts a ON q.account_id = a.id 
      ORDER BY q.created_at DESC
    `).all();
    res.json({ success: true, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single quote
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
    res.json({ success: true, data: { ...quote, items } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE quote
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { account_id, title, status, items } = req.body;
    
    const result = db.prepare(`
      INSERT INTO quotes (account_id, title, status) 
      VALUES (?, ?, ?)
    `).run(account_id, title, status || 'draft');
    
    const quoteId = result.lastInsertRowid;
    
    if (items && items.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO quote_items (quote_id, product_name, quantity, unit_price, total) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      items.forEach(item => {
        stmt.run(quoteId, item.product_name, item.quantity, item.unit_price, item.total);
      });
    }
    
    res.json({ success: true, data: { id: quoteId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE quote
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { account_id, title, status } = req.body;
    
    db.prepare(`
      UPDATE quotes SET account_id = ?, title = ?, status = ? 
      WHERE id = ?
    `).run(account_id, title, status, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE quote
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(req.params.id);
    db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
