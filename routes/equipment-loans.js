const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST all equipment loans
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const loans = db.prepare(`
      SELECT el.*, a.name as account_name 
      FROM equipment_loans el 
      LEFT JOIN accounts a ON el.account_id = a.id 
      ORDER BY el.created_at DESC
    `).all();
    res.json({ success: true, data: loans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE equipment loan
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { account_id, title, borrow_date, return_date, items } = req.body;
    
    const result = db.prepare(`
      INSERT INTO equipment_loans (account_id, title, borrow_date, return_date, status) 
      VALUES (?, ?, ?, ?, 'borrowed')
    `).run(account_id, title, borrow_date, return_date);
    
    const loanId = result.lastInsertRowid;
    
    if (items && items.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO loan_items (loan_id, item_name, quantity, condition) 
        VALUES (?, ?, ?, ?)
      `);
      
      items.forEach(item => {
        stmt.run(loanId, item.item_name, item.quantity, item.condition || 'good');
      });
    }
    
    res.json({ success: true, data: { id: loanId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE equipment loan
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { account_id, title, borrow_date, return_date, status } = req.body;
    
    db.prepare(`
      UPDATE equipment_loans SET account_id = ?, title = ?, borrow_date = ?, return_date = ?, status = ? 
      WHERE id = ?
    `).run(account_id, title, borrow_date, return_date, status, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE equipment loan
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM loan_items WHERE loan_id = ?').run(req.params.id);
    db.prepare('DELETE FROM equipment_loans WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
