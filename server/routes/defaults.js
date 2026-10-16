import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../lib/auth.js';
import { sanitizePersonalInfo as sanitize } from '../../api-lib/personalInfo.js';

const router = Router();

// GET saved default personal info for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitize(user.defaultPersonalInfo || {}));
  } catch (err) {
    console.error('Failed to get default personal info:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT save/replace the default personal info
router.put('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const defaults = sanitize(req.body);
    user.defaultPersonalInfo = defaults;
    await user.save();

    res.json(defaults);
  } catch (err) {
    console.error('Failed to save default personal info:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
