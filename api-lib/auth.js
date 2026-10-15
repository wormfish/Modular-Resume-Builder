import User from './models/User.js';
import { connectToDatabase } from './db.js';
import { authenticateSession } from './session.js';

export async function authenticateRequest(req) {
  if (typeof req.headers.authorization !== 'string' || !req.headers.authorization.startsWith('Bearer ')) return null;
  await connectToDatabase();
  return authenticateSession(req, User);
}

export async function requireAuth(req, res) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return null;
    }
    req.user = user;
    return user;
  } catch (err) {
    console.error('Session lookup failed:', err);
    res.status(503).json({ error: 'Authentication temporarily unavailable' });
    return null;
  }
}
