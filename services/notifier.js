/**
 * services/notifier.js
 * Hermes notification bridge.
 *
 * Writes to notifications/pending.json (existing notifier route format)
 * and notifications/hermes-inbox.json (Hermes-readable format).
 *
 * Exports:
 *   notifyHermes(message, type, title, source) → notification object
 *   getNotifications(filter?) → array
 *   markRead(id) → boolean
 */

const fs = require('fs');
const path = require('path');

const NOTIFY_DIR      = path.join(__dirname, '..', 'notifications');
const PENDING_FILE    = path.join(NOTIFY_DIR, 'pending.json');
const HERMES_INBOX    = path.join(NOTIFY_DIR, 'hermes-inbox.json');

// ── Helpers ──────────────────────────────────────────────────
function ensureDir() {
  if (!fs.existsSync(NOTIFY_DIR)) fs.mkdirSync(NOTIFY_DIR, { recursive: true });
}

function readJson(file) {
  try {
    if (!fs.existsSync(file)) return [];
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Core notification creation ──────────────────────────────
function createNotification({ message, type = 'info', title = 'Notification', source = 'system' }) {
  return {
    id: Date.now(),
    type,           // 'info' | 'success' | 'warning' | 'error' | 'task' | 'opportunity'
    title,
    message,
    source,         // 'system' | 'crm' | 'hermes'
    read: false,
    created_at: new Date().toISOString(),
  };
}

// ── Write to both stores ─────────────────────────────────────
function persist(notification) {
  // 1. pending.json — existing format
  const pending = readJson(PENDING_FILE);
  pending.unshift(notification);
  writeJson(PENDING_FILE, pending);

  // 2. hermes-inbox.json — Hermes-readable format
  const inbox = readJson(HERMES_INBOX);
  inbox.unshift({
    ...notification,
    hermes: true,
    priority: notification.type === 'error' ? 'high'
            : notification.type === 'warning' ? 'medium'
            : 'low',
  });
  writeJson(HERMES_INBOX, inbox);

  return notification;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Send a notification to both stores.
 * Call this when important CRM events happen.
 */
function notifyHermes(message, type = 'info', title = 'Notification', source = 'crm') {
  const n = createNotification({ message, type, title, source });
  return persist(n);
}

/**
 * Convenience: notify opportunity stage change
 */
function notifyOpportunityStage(oppName, oldStage, newStage, value) {
  return notifyHermes(
    `Opportunity "${oppName}" moved from ${oldStage} to ${newStage}${value ? ` (value: $${value.toLocaleString()})` : ''}.`,
    'opportunity',
    'Opportunity Stage Changed'
  );
}

/**
 * Convenience: notify task overdue
 */
function notifyTaskOverdue(taskTitle, dueDate) {
  return notifyHermes(
    `Task "${taskTitle}" is overdue (due: ${dueDate}).`,
    'warning',
    'Task Overdue'
  );
}

/**
 * Convenience: notify big deal won
 */
function notifyBigDeal(oppName, value) {
  return notifyHermes(
    `🎉 Big deal closed: "${oppName}" worth $${value.toLocaleString()}!`,
    'success',
    'Deal Won!'
  );
}

/**
 * Get notifications from hermes-inbox.json.
 * @param {string} [filter] — 'all' | 'unread' | 'task' | 'opportunity' | 'system'
 */
function getNotifications(filter = 'all') {
  const inbox = readJson(HERMES_INBOX);
  switch (filter) {
    case 'unread':      return inbox.filter(n => !n.read);
    case 'task':        return inbox.filter(n => n.type === 'task');
    case 'opportunity': return inbox.filter(n => n.type === 'opportunity');
    case 'system':      return inbox.filter(n => n.type === 'info' || n.type === 'error' || n.type === 'warning' || n.type === 'success');
    default:            return inbox;
  }
}

/**
 * Mark a notification as read by id.
 * Updates both pending.json and hermes-inbox.json.
 * @returns {boolean} true if found and updated
 */
function markRead(id) {
  const numId = Number(id);
  let found = false;

  // Update pending.json
  const pending = readJson(PENDING_FILE);
  const pIdx = pending.findIndex(n => n.id === numId);
  if (pIdx !== -1) {
    pending.splice(pIdx, 1);
    writeJson(PENDING_FILE, pending);
    found = true;
  }

  // Update hermes-inbox.json
  const inbox = readJson(HERMES_INBOX);
  const iIdx = inbox.findIndex(n => n.id === numId);
  if (iIdx !== -1) {
    inbox[iIdx].read = true;
    writeJson(HERMES_INBOX, inbox);
    found = true;
  }

  return found;
}

/**
 * Clear all notifications.
 */
function clearAll() {
  writeJson(PENDING_FILE, []);
  writeJson(HERMES_INBOX, []);
}

module.exports = {
  notifyHermes,
  notifyOpportunityStage,
  notifyTaskOverdue,
  notifyBigDeal,
  getNotifications,
  markRead,
  clearAll,
};
