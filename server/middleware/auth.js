const jwt = require('jsonwebtoken')
const JWT_SECRET = 'dev-secret-key-12345'
const JWT_REFRESH_SECRET = 'dev-refresh-secret-key'

function authenticate(req, res, next) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'No token' })
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next() }
  catch(e) { res.status(401).json({ success: false, error: 'Invalid token' }) }
}

function generateAccessToken(u) { return jwt.sign({ id: u.id, username: u.username, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '24h' }) }
function generateRefreshToken(u) { return jwt.sign({ id: u.id, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '7d' }) }
function verifyRefreshToken(t) { try { return jwt.verify(t, JWT_REFRESH_SECRET) } catch(e) { return null } }

module.exports = { authenticate, generateAccessToken, generateRefreshToken, verifyRefreshToken }
