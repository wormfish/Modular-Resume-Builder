import bcrypt from 'bcrypt';
import { connectToDatabase } from '../../api-lib/db.js';
import User from '../../api-lib/models/User.js';
import Block from '../../api-lib/models/Block.js';
import Resume from '../../api-lib/models/Resume.js';
import { requireAuth } from '../../api-lib/auth.js';
import { sanitizePersonalInfo as sanitize } from '../../api-lib/personalInfo.js';
import { issuePasswordCode, confirmPasswordCode, sendResetCodeEmail } from '../../api-lib/passwordReset.js';

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'defaults') {
    try {
      const authUser = await requireAuth(req, res);
      if (!authUser) return;

      if (req.method !== 'GET' && req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      await connectToDatabase();

      const user = await User.findOne({ email: authUser.email });
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (req.method === 'GET') {
        return res.json(sanitize(user.defaultPersonalInfo || {}));
      }

      // PUT — save/replace the defaults
      const defaults = sanitize(req.body);
      user.defaultPersonalInfo = defaults;
      await user.save();
      return res.json(defaults);
    } catch (err) {
      console.error('Default personal info handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (action === 'tags') {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;

      await connectToDatabase();

      const dbUser = await User.findOne({ email: user.email });
      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (req.method === 'GET') {
        // Return tags as a plain object
        const tagsObj = {};
        if (dbUser.tags) {
          for (const [key, value] of dbUser.tags.entries()) {
            tagsObj[key] = value;
          }
        }
        return res.json(tagsObj);
      }

      if (req.method === 'POST') {
        const { id, name } = req.body;
        if (!id || !name) {
          return res.status(400).json({ error: 'Missing id or name' });
        }
        dbUser.tags.set(id, name);
        await dbUser.save();
        return res.status(201).json({ id, name });
      }

      if (req.method === 'PUT') {
        const { id, name } = req.body;
        if (!id || !name) {
          return res.status(400).json({ error: 'Missing id or name' });
        }
        if (!dbUser.tags.has(id)) {
          return res.status(404).json({ error: 'Tag not found' });
        }
        dbUser.tags.set(id, name);
        await dbUser.save();
        return res.json({ id, name });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Missing id query parameter' });
        }
        dbUser.tags.delete(id);
        await dbUser.save();
        return res.json({ success: true, id });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      console.error('Tags handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (action === 'password') {
    try {
      const authUser = await requireAuth(req, res);
      if (!authUser) return;

      await connectToDatabase();

      const user = await User.findOne({ email: authUser.email });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // POST — email a confirmation code to the account owner.
      if (req.method === 'POST') {
        const issued = await issuePasswordCode(User, user.email);
        if (!issued) return res.status(429).json({ error: 'Please wait a minute before requesting another code' });
        try {
          await sendResetCodeEmail(user.email, issued.code, 'change');
        } catch (mailErr) {
          console.error('Change-password email failed:', mailErr);
          return res.status(500).json({ error: 'Failed to send confirmation email' });
        }
        return res.json({ success: true });
      }

      // PUT — confirm with the emailed code and set the new password.
      if (req.method === 'PUT') {
        const { code, newPassword } = req.body || {};
        if (!code || !newPassword) {
          return res.status(400).json({ error: 'Code and new password are required' });
        }
        if (String(newPassword).length < 8) {
          return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }
        const changed = await confirmPasswordCode(User, user.email, code, newPassword);
        if (!changed) return res.status(400).json({ error: 'Invalid or expired code' });
        return res.json({ success: true });
      }

      return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
      console.error('Change password handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (action === 'account') {
    try {
      const authUser = await requireAuth(req, res);
      if (!authUser) return;

      if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      await connectToDatabase();

      const password = (req.body && req.body.password) || req.query.password;
      const user = await User.findOne({ email: authUser.email });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const valid = await bcrypt.compare(String(password || ''), user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Password is incorrect' });
      }

      await Resume.deleteMany({ owner: authUser.email });
      await Block.deleteMany({ owner: authUser.email });
      await User.deleteOne({ email: authUser.email });
      return res.json({ success: true });
    } catch (err) {
      console.error('Delete account handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}
