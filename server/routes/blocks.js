import { Router } from 'express';
import Block from '../models/Block.js';

const router = Router();

// GET all blocks
router.get('/', async (_req, res) => {
  try {
    const blocks = await Block.find().sort({ updatedAt: -1 });
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a block
router.post('/', async (req, res) => {
  try {
    const { id, type, jobTypes, content } = req.body;
    const block = await Block.findByIdAndUpdate(
      id,
      { _id: id, type, jobTypes, content },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.status(201).json(block);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a block
router.put('/:id', async (req, res) => {
  try {
    const { type, jobTypes, content } = req.body;
    const block = await Block.findByIdAndUpdate(
      req.params.id,
      { type, jobTypes, content },
      { new: true },
    );
    if (!block) return res.status(404).json({ error: 'Block not found' });
    res.json(block);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a block
router.delete('/:id', async (req, res) => {
  try {
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) return res.status(404).json({ error: 'Block not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
