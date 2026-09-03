const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST account notes for an account
router.get('/account/:accountId', (req, res) => {
  try {
    const db = getDb();
    const { accountId } = req.params;
    const { category, importance, pinned } = req.query;
    
    let sql = 'SELECT * FROM account_notes WHERE account_id = ?';
    const params = [accountId];
    
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (importance) { sql += ' AND importance = ?'; params.push(importance); }
    if (pinned === 'true') { sql += ' AND is_pinned = 1'; }
    
    sql += ' ORDER BY is_pinned DESC, created_at DESC';
    
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE account note
router.post('/account', (req, res) => {
  try {
    const db = getDb();
    const { account_id, category, title, content, importance, is_pinned, created_by } = req.body;
    
    const result = db.prepare(`
      INSERT INTO account_notes (account_id, category, title, content, importance, is_pinned, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(account_id, category || 'general', title, content, importance || 'medium', is_pinned || 0, created_by || 'admin');
    
    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, "CREATE", "account_note", ?, ?)').run(
      created_by || 'admin', result.lastInsertRowid, JSON.stringify({ title })
    );
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE account note
router.put('/account/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { category, title, content, importance, is_pinned } = req.body;
    
    db.prepare(`UPDATE account_notes SET category=?, title=?, content=?, importance=?, is_pinned=?, updated_at=datetime('now', '+8 hours') WHERE id=?`).run(
      category, title, content, importance, is_pinned, id
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE account note
router.delete('/account/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM account_notes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
