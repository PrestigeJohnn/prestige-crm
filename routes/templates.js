const express = require('express');
const router = express.Router();
const { getDb } = require('../database/services/db');

// LIST all templates
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const templates = db.prepare(`
      SELECT t.*, COUNT(tv.id) as variable_count 
      FROM templates t 
      LEFT JOIN template_variables tv ON t.id = tv.template_id 
      GROUP BY t.id 
      ORDER BY t.created_at DESC
    `).all();
    res.json({ success: true, data: templates });
  } catch (err) {
    // If table doesn't exist, return empty
    if (err.message.includes('no such table')) {
      res.json({ success: true, data: [] });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// GET single template
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    const variables = db.prepare('SELECT * FROM template_variables WHERE template_id = ?').all(req.params.id);
    res.json({ success: true, data: { ...template, variables } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE template
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, type, content } = req.body;
    
    const result = db.prepare(`
      INSERT INTO templates (name, type, content) 
      VALUES (?, ?, ?)
    `).run(name, type, content);
    
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE template
router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, type, content } = req.body;
    
    db.prepare(`
      UPDATE templates SET name = ?, type = ?, content = ? 
      WHERE id = ?
    `).run(name, type, content, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE template
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM template_variables WHERE template_id = ?').run(req.params.id);
    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
