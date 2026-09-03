const db = require('../database/services/db').getDb();
const crypto = require('crypto');

function sha256(pw) {
  return Buffer.from(crypto.createHash('sha256').update(pw).digest()).toString('base64');
}

function generateId() {
  return crypto.randomUUID();
}

// Upsert a login account by email (stores hash only for team accounts)
function ensureUser(username, email, passwordHash, role) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!existing) {
    db.prepare('INSERT INTO users (id, username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)')
      .run(generateId(), username, email, passwordHash, role);
    console.log('[AUTH] User created: ' + email);
  } else {
    db.prepare('UPDATE users SET password_hash = ?, is_active = 1 WHERE email = ?')
      .run(passwordHash, email);
    console.log('[AUTH] User verified: ' + email);
  }
}

// Default admin (legacy)
ensureUser('Johnn', 'Johnn@admin.com.sg', sha256('Johnn@123'), 'admin');
// Team login accounts (same credentials as local dev DB)
ensureUser('johnn', 'johnn@prestigesolutions.com.sg', 'p2bVFBqJ5T4UwvsHpO18Bab2orf16/KJ4s91uAlpeTI=', 'admin');
ensureUser('Prestige', 'prestige@prestigesolutions.com.sg', 'NdUub5kdbLFHTJp262yRcLZZw9SoHFcdfw4j8Br5KNI=', 'admin');
