import jwt from 'jsonwebtoken';

// Resolve every session against the current account. Email alone can be reused
// after deletion, and password recovery must revoke previously issued tokens.
export async function authenticateSession(req, User) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
  if (!decoded || typeof decoded !== 'object' || typeof decoded.userId !== 'string') return null;
  const user = await User.findById(decoded.userId).select('email sessionVersion');
  if (!user || (decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) return null;
  return { userId: String(user._id), email: user.email, sessionVersion: user.sessionVersion ?? 0 };
}
