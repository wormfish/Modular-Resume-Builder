import User from '../models/User.js';
import { authenticateSession } from '../../api-lib/session.js';

export const authenticateRequest = (req) => authenticateSession(req, User);

export async function requireAuth(req, res, next) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
