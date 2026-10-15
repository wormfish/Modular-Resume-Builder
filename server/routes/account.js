import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Block from '../models/Block.js';
import Resume from '../models/Resume.js';
import { requireAuth } from '../lib/auth.js';
import { issuePasswordCode, confirmPasswordCode, sendResetCodeEmail } from '../../api-lib/passwordReset.js';

const router = Router();

// POST /api/user/password — email a confirmation code
router.post('/password', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const issued = await issuePasswordCode(User, user.email);
    if (!issued) return res.status(429).json({ error: 'Please wait a minute before requesting another code' });

    try {
      await sendResetCodeEmail(user.email, issued.code, 'change');
    } catch (mailErr) {
      console.error('Change-password email failed:', mailErr);
      return res.status(500).json({ error: 'Failed to send confirmation email' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Change password request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/password — confirm with the emailed code and set the new password
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { code, newPassword } = req.body || {};
    if (!code || !newPassword) {
      return res.status(400).json({ error: 'Code and new password are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const changed = await confirmPasswordCode(User, user.email, code, newPassword);
    if (!changed) return res.status(400).json({ error: 'Invalid or expired code' });

    res.json({ success: true });
  } catch (err) {
    console.error('Change password confirm error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  try {
    const password = (req.body && req.body.password) || req.query.password;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(String(password || ''), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    await Resume.deleteMany({ owner: req.user.email });
    await Block.deleteMany({ owner: req.user.email });
    await User.deleteOne({ email: req.user.email });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
