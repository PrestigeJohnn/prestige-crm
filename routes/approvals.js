const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST all approval workflows
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const workflows = db.prepare(`
      SELECT aw.*, COUNT(astep.id) as step_count 
      FROM approval_workflows aw 
      LEFT JOIN approval_steps astep ON aw.id = astep.workflow_id 
      GROUP BY aw.id 
      ORDER BY aw.created_at DESC
    `).all();
    res.json({ success: true, data: workflows });
  } catch (err) {
    if (err.message.includes('no such table')) {
      res.json({ success: true, data: [] });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// GET single workflow with steps
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const workflow = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(req.params.id);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    const steps = db.prepare('SELECT * FROM approval_steps WHERE workflow_id = ? ORDER BY step_order').all(req.params.id);
    res.json({ success: true, data: { ...workflow, steps } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE workflow
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, entity_type, description } = req.body;
    
    const result = db.prepare(`
      INSERT INTO approval_workflows (name, entity_type, description) 
      VALUES (?, ?, ?)
    `).run(name, entity_type, description);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE workflow
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, entity_type, description } = req.body;
    
    db.prepare(`
      UPDATE approval_workflows SET name = ?, entity_type = ?, description = ? 
      WHERE id = ?
    `).run(name, entity_type, description, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE workflow
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM approval_steps WHERE workflow_id = ?').run(req.params.id);
    db.prepare('DELETE FROM approval_workflows WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
