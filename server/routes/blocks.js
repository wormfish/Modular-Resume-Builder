import { saveBlock, saveBlocks } from '../../api-lib/blockUpdates.js';
import { Router } from 'express';
import Block from '../models/Block.js';
import { requireAuth } from '../lib/auth.js';

const router = Router();

// GET all blocks (only for authenticated user)
router.get('/', requireAuth, async (req, res) => {
  try {
    const blocks = await Block.find({ owner: req.user.email }).sort({ updatedAt: -1 });
    res.json(blocks);
  } catch (err) {
    console.error('Failed to list blocks:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
  }
});

// POST upsert a block (uses _id from body). Content fields are stored flat
// at the top level of the document.
router.post('/', requireAuth, async (req, res) => {
  try {
    const block = await saveBlock(Block, req.body, req.user.email);
    res.status(201).json(block);
  } catch (err) {
    console.error('Failed to upsert block:', err);
    res.status(err.status || 400).json({ error: err.status ? err.message : 'Invalid block data' });
  }
});

// POST bulk — upsert many blocks at once
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const result = await saveBlocks(Block, req.body, req.user.email);
    res.json({ success: true, matched: result.matchedCount, upserted: result.upsertedCount });
  } catch (err) {
    console.error('Failed to bulk write blocks:', err);
    res.status(err.status || 400).json({ error: err.status ? err.message : 'Invalid block data' });
  }
});

// DELETE a block
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    if (block.owner !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to delete this block' });
    }
    await Block.findByIdAndDelete(req.params.id);
    // Cascade-delete child variants stored in the library under this block.
    // Resume-scoped variants belong to their resume and are left alone.
    await Block.deleteMany({ owner: req.user.email, variantOf: req.params.id, variantIn: null });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete block:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
  }
});

export default router;
