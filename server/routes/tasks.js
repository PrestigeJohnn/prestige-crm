/**
 * routes/tasks.js
 * Task CRUD with optional status / priority / overdue filter.
 */

const express = require('express');
const { getDb } = require('../../database/services/db');
const router = express.Router();

// ── List ───────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status, priority, overdue } = req.query;
    let sql = `SELECT t.*, a.company_name AS account_name
               FROM tasks t LEFT JOIN accounts a ON t.account_id = a.id`;
    const params = [];
    const where = [];
    if (status)   { where.push('t.status = ?');   params.push(status); }
    if (priority) { where.push('t.priority = ?'); params.push(priority); }
    if (overdue === 'true') {
      where.push("t.due_date < date('now') AND t.status NOT IN ('Completed','Cancelled')");
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY t.due_date ASC, t.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Detail ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare(
      `SELECT t.*, a.company_name AS account_name
       FROM tasks t LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?`
    ).get(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
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
      `INSERT INTO tasks (account_id, contact_id, opportunity_id, title, description, due_date, priority, status, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.opportunity_id || null,
      b.title, b.description || null, b.due_date || null,
      b.priority || 'Medium', b.status || 'Not Started', b.assigned_to || null
    );
    const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: task });
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
      `UPDATE tasks SET account_id=?, contact_id=?, opportunity_id=?, title=?, description=?,
       due_date=?, priority=?, status=?, assigned_to=?,
       updated_at=datetime('now','localtime') WHERE id=?`
    );
    const result = stmt.run(
      b.account_id || null, b.contact_id || null, b.opportunity_id || null,
      b.title, b.description || null, b.due_date || null,
      b.priority || 'Medium', b.status || 'Not Started', b.assigned_to || null, req.params.id
    );
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Task not found' });
    const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Delete ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
