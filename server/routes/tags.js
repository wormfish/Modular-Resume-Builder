import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../lib/auth.js';

const router = Router();

// GET all tags for authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Convert Map to plain object
    const tags = {};
    if (user.tags) {
      for (const [key, value] of user.tags) {
        tags[key] = value;
      }
    }
    res.json(tags);
  } catch (err) {
    console.error('Failed to list tags:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST add a new tag
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tags = user.tags || new Map();
    tags.set(id, name);
    user.tags = tags;
    await user.save();

    res.status(201).json({ id, name });
  } catch (err) {
    console.error('Failed to add tag:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update an existing tag name
router.put('/', requireAuth, async (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tags = user.tags || new Map();
    if (!tags.has(id)) return res.status(404).json({ error: 'Tag not found' });

    tags.set(id, name);
    user.tags = tags;
    await user.save();

    res.json({ id, name });
  } catch (err) {
    console.error('Failed to update tag:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a tag
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tags = user.tags || new Map();
    tags.delete(id);
    user.tags = tags;
    await user.save();

    res.json({ success: true, id });
  } catch (err) {
    console.error('Failed to delete tag:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;