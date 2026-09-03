const db = require('../database/services/db').getDb();
const crypto = require('crypto');

function sha256(pw) {
  return Buffer.from(crypto.createHash('sha256').update(pw).digest()).toString('base64');
}

function generateId() {
  return crypto.randomUUID();
}

// Ensure admin user exists (upsert)
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('Johnn@admin.com.sg');
if (!existing) {
  const id = generateId();
  const hash = sha256('Johnn@123');
  db.prepare('INSERT INTO users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)')
    .run(id, 'Johnn', 'Johnn@admin.com.sg', hash, 'admin');
  console.log('[AUTH] Admin user created: Johnn@admin.com.sg');
} else {
  // Ensure password is correct (in case it was changed)
  const hash = sha256('Johnn@123');
  db.prepare('UPDATE users SET password_hash = ?, is_active = 1 WHERE email = ?')
    .run(hash, 'Johnn@admin.com.sg');
  console.log('[AUTH] Admin user verified: Johnn@admin.com.sg');
}
