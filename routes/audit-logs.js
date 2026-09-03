const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST audit logs with filtering
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { user, entity, action, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (user) { sql += ' AND user_id = ?'; params.push(user); }
    if (entity) { sql += ' AND entity_type = ?'; params.push(entity); }
    if (action) { sql += ' AND action = ?'; params.push(action); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    const logs = db.prepare(sql).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// COUNT audit logs
router.get('/count', (req, res) => {
  try {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
    res.json(total);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
