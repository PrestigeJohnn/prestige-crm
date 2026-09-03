/**
 * routes/notifier.js
 * Notification store backed by notifications/pending.json
 * and notifications/hermes-inbox.json (via services/notifier).
 *
 * POST /api/notify                — write a notification
 * GET  /api/notifications         — list notifications (hermes-inbox)
 * GET  /api/notifications?filter= — filtered list
 * PATCH /api/notifications/:id    — mark as read
 * DELETE /api/notifications/:id   — remove from pending
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { notifyHermes, getNotifications, markRead } = require('../services/notifier');
const router = express.Router();

const NOTIFY_DIR  = path.join(__dirname, '..', 'notifications');
const NOTIFY_FILE = path.join(NOTIFY_DIR, 'pending.json');
const INBOX_FILE  = path.join(NOTIFY_DIR, 'hermes-inbox.json');

// ── Helpers (pending.json — backward compat) ─────────────────
function readNotifications() {
  try {
    if (!fs.existsSync(NOTIFY_FILE)) return [];
    const raw = fs.readFileSync(NOTIFY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeNotifications(list) {
  if (!fs.existsSync(NOTIFY_DIR)) fs.mkdirSync(NOTIFY_DIR, { recursive: true });
  fs.writeFileSync(NOTIFY_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// ── POST /api/notify ─────────────────────────────────────────
router.post('/notify', (req, res) => {
  try {
    const b = req.body;
    if (!b.message) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    const notification = notifyHermes(
      b.message,
      b.type || 'info',
      b.title || 'Notification',
      b.source || 'system'
    );

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/notifications ───────────────────────────────────
// Returns hermes-inbox.json content (supports ?filter=)
router.get('/notifications', (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const list = getNotifications(filter);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/notifications/:id — mark read ─────────────────
router.patch('/notifications/:id', (req, res) => {
  try {
    const found = markRead(req.params.id);
    if (!found) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: { id: Number(req.params.id), read: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /api/notifications/:id — remove from pending ──────
router.delete('/notifications/:id', (req, res) => {
  try {
    const list = readNotifications();
    const filtered = list.filter(n => n.id !== Number(req.params.id));
    if (filtered.length === list.length) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    writeNotifications(filtered);
    res.json({ success: true, data: { id: Number(req.params.id) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
