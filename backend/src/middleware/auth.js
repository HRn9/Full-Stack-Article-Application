const jwt = require('jsonwebtoken');
const config = require('../config');

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

function authMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;


