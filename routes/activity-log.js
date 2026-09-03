const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST activity log for an account
router.get('/account/:accountId', (req, res) => {
  try {
    const db = getDb();
    const { accountId } = req.params;
    const { type, startDate, endDate, direction } = req.query;
    
    let sql = 'SELECT * FROM activity_log WHERE account_id = ?';
    const params = [accountId];
    
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (startDate) { sql += ' AND created_at >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND created_at <= ?'; params.push(endDate); }
    if (direction) { sql += ' AND direction = ?'; params.push(direction); }
    
    sql += ' ORDER BY created_at DESC';
    
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE activity log entry
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { account_id, contact_id, type, direction, subject, description, duration_minutes, next_follow_up, next_action, attachments, created_by } = req.body;
    
    const result = db.prepare(`
      INSERT INTO activity_log (account_id, contact_id, type, direction, subject, description, duration_minutes, next_follow_up, next_action, attachments, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      account_id, contact_id || null, type || 'note', direction || 'outbound', subject, description || '', duration_minutes || 0, next_follow_up || null, next_action || null, attachments || null, created_by || 'admin'
    );
    
    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, "CREATE", "activity_log", ?, ?)').run(
      created_by || 'admin', result.lastInsertRowid, JSON.stringify({ subject, type })
    );
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE activity log entry
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { type, direction, subject, description, duration_minutes, next_follow_up, next_action } = req.body;
    
    db.prepare(`UPDATE activity_log SET type=?, direction=?, subject=?, description=?, duration_minutes=?, next_follow_up=?, next_action=?, updated_at=datetime('now', '+8 hours') WHERE id=?`).run(
      type, direction, subject, description, duration_minutes, next_follow_up, next_action, id
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE activity log entry
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM activity_log WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all activity logs (for global activity page)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { type, startDate, endDate, limit } = req.query;
    
    let sql = 'SELECT al.*, a.name as account_name FROM activity_log al LEFT JOIN accounts a ON al.account_id = a.id WHERE 1=1';
    const params = [];
    
    if (type) { sql += ' AND al.type = ?'; params.push(type); }
    if (startDate) { sql += ' AND al.created_at >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND al.created_at <= ?'; params.push(endDate); }
    
    sql += ' ORDER BY al.created_at DESC';
    
    if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)); }
    
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
