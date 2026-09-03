const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getDb } = require('../../database/services/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticate } = require('../../server/middleware/auth');

function sha256(pw) { return Buffer.from(crypto.createHash('sha256').update(pw).digest()).toString('base64'); }

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, error: 'username, email, password required' });
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) return res.status(409).json({ success: false, error: 'Email or username already exists' });
    const password_hash = sha256(password);
    const result = db.prepare('INSERT INTO users (id, username, email, password_hash, role, is_active) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, 1) RETURNING *').all(username, email, password_hash, role || 'user');
    const user = result[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, datetime(\'now\', \'+7 days\'))').run(user.id, refreshToken);
    res.status(201).json({ success: true, data: { user: { id: user.id, username: user.username, email: user.email, role: user.role }, accessToken, refreshToken } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'email and password required' });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    if (user.password_hash.startsWith('$2')) {
      if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    } else {
      if (sha256(password) !== user.password_hash) return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, datetime(\'now\', \'+7 days\'))').run(user.id, refreshToken);
    res.json({ success: true, data: { user: { id: user.id, username: user.username, email: user.email, role: user.role }, accessToken, refreshToken } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: 'refreshToken required' });
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, datetime(\'now\', \'+7 days\'))').run(user.id, newRefreshToken);
    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/logout', authenticate, (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    getDb().prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/me', authenticate, (req, res) => { res.json({ success: true, data: req.user }); });

module.exports = router;
