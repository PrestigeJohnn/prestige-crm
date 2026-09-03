const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST all PR requests
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const prRequests = db.prepare(`
      SELECT pr.*, a.name as account_name 
      FROM pr_requests pr 
      LEFT JOIN accounts a ON pr.account_id = a.id 
      ORDER BY pr.created_at DESC
    `).all();
    res.json({ success: true, data: prRequests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE PR request
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { account_id, title, priority, items } = req.body;
    
    const result = db.prepare(`
      INSERT INTO pr_requests (account_id, title, priority, status) 
      VALUES (?, ?, ?, 'pending')
    `).run(account_id, title, priority || 'medium');
    
    const prId = result.lastInsertRowid;
    
    if (items && items.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO pr_request_items (pr_request_id, product_name, quantity, unit_price, total) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      items.forEach(item => {
        stmt.run(prId, item.product_name, item.quantity, item.unit_price, item.total);
      });
    }
    
    res.json({ success: true, data: { id: prId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE PR request
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { account_id, title, priority, status } = req.body;
    
    db.prepare(`
      UPDATE pr_requests SET account_id = ?, title = ?, priority = ?, status = ? 
      WHERE id = ?
    `).run(account_id, title, priority, status, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE PR request
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM pr_request_items WHERE pr_request_id = ?').run(req.params.id);
    db.prepare('DELETE FROM pr_requests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
